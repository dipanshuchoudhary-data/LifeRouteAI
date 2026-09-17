"""
LifeRoute AI — FastAPI Application
Main entry point with all API endpoints.
Run: uvicorn main:app --reload --port 8000
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import yaml
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models.schemas import (
    NavigateRequest,
    NavigateResponse,
    AssistantTurnRequest,
    AssistantChatResponse,
    ToolInvokeRequest,
    ToolInvokeResponse,
    ToolCatalogResponse,
    HealthResponse,
)
from graph.pipeline import run_pipeline
from graph.mock_data import MOCK_HOSPITALS
from graph.llm_client import describe_provider
from db.hospital_enrich import enrich_hospitals, enrich_hospital
from assistant.tools import ASSISTANT_TOOLS, ASSISTANT_MANIFEST, get_tools_in_format
from assistant.handler import invoke_tool, run_assistant_turn
from api.v2.router import router as v2_router

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="LifeRoute AI",
    description=(
        "Intelligent healthcare navigation platform with an open assistant connector. "
        "Any LLM provider or agent framework can drive the pipeline through REST "
        "endpoints or tool/function calling — no vendor SDK required."
    ),
    version="2.0.0",
    openapi_tags=[
        {"name": "Navigation", "description": "Core patient navigation pipeline"},
        {"name": "Assistant", "description": "Conversational entry points for any LLM client"},
        {"name": "Tools", "description": "Tool definitions and execution for function calling"},
        {"name": "Facilities", "description": "Hospital network data"},
        {"name": "Clinical", "description": "Streaming triage, SOS, FHIR referral, live telemetry"},
    ],
)


def _cors_origins() -> list[str]:
    origins = [
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost",
        "http://127.0.0.1",
        "http://127.0.0.1:5173",
    ]
    extra = os.getenv("CORS_ORIGINS", "")
    origins.extend(item.strip() for item in extra.split(",") if item.strip())
    return list(dict.fromkeys(origins))


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v2_router, prefix="/api/v2", tags=["Clinical"])
app.include_router(v2_router, prefix="/v2", tags=["Clinical"])


def _connector_base_url() -> str:
    return os.getenv("ASSISTANT_CONNECTOR_URL", "http://localhost:8000")


# ---------------------------------------------------------------------------
# Core endpoints
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse, tags=["Navigation"])
async def health_check():
    """Health check with active LLM provider configuration."""
    return HealthResponse(llm=describe_provider(), tools_available=len(ASSISTANT_TOOLS))


@app.post("/navigate", response_model=NavigateResponse, tags=["Navigation"])
async def navigate(request: NavigateRequest):
    """Main pipeline — triage, hospital routing, referral document."""
    if not request.input or not request.input.strip():
        raise HTTPException(status_code=400, detail="Symptom description is required")

    try:
        location = {"lat": request.location.lat, "lng": request.location.lng}
        result = await run_pipeline(request.input.strip(), location)
        return NavigateResponse(**_pipeline_to_response(result, request.input))
    except Exception as e:
        print(f"[API] Navigate error: {e}")
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {str(e)}")


# ---------------------------------------------------------------------------
# Assistant connector
# ---------------------------------------------------------------------------


@app.post("/assistant/chat", tags=["Assistant"])
async def assistant_chat(request: AssistantTurnRequest):
    """
    **Conversational entry point for any LLM client or chat UI.**

    Returns a message envelope with readable text, a structured result card,
    and machine-readable pipeline data.

    Set `response_format: "json"` for a flat summary, or `"tool"` for a
    tool-call result wrapper.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Message text is required")

    try:
        location = {"lat": request.latitude, "lng": request.longitude}
        result = await run_assistant_turn(
            request.text.strip(),
            conversation_id=request.conversation_id,
            reply_to_id=request.reply_to_id,
            location=location,
            response_format=request.response_format,
        )

        if request.response_format == "json":
            return AssistantChatResponse(**result)

        return JSONResponse(content=result)

    except Exception as e:
        print(f"[API] Assistant error: {e}")
        if request.response_format == "json":
            return AssistantChatResponse(
                type="message",
                text="I'm sorry, I encountered an error. Please try again or call 108 if urgent.",
                disclaimer="LifeRoute AI provides navigation guidance only.",
            )
        return JSONResponse(
            content={
                "type": "message",
                "role": "assistant",
                "text": "I'm sorry, I encountered an error. Please try again or call 108 if urgent.",
                "data": {"error": str(e)},
            }
        )


@app.get("/assistant/tools", response_model=ToolCatalogResponse, tags=["Tools"])
async def list_assistant_tools(
    format: str = Query(
        default="native",
        description="Tool schema dialect: native | openai | anthropic | json-schema",
    )
):
    """
    **Tool catalog for function-calling clients.**

    Pass `?format=openai` or `?format=anthropic` to receive definitions already
    shaped for that provider's tool-calling API.
    """
    try:
        tools = get_tools_in_format(format)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    manifest = {**ASSISTANT_MANIFEST}
    manifest["api"] = {"type": "openapi", "url": f"{_connector_base_url()}/assistant/openapi.json"}
    return ToolCatalogResponse(manifest=manifest, format=format, tools=tools)


@app.post("/assistant/invoke", response_model=ToolInvokeResponse, tags=["Tools"])
async def invoke_assistant_tool(request: ToolInvokeRequest):
    """
    **Invoke a tool by name.**

    Tools: `navigate_care`, `triage_symptoms`, `find_hospital`, `generate_referral`, `list_hospitals`
    """
    result = await invoke_tool(request.tool_name, request.parameters)
    return ToolInvokeResponse(**result)


@app.get("/assistant/manifest", tags=["Tools"])
async def assistant_manifest():
    """Plugin manifest for assistant/agent registration."""
    manifest = {**ASSISTANT_MANIFEST}
    manifest["api"] = {"type": "openapi", "url": f"{_connector_base_url()}/assistant/openapi.json"}
    return manifest


@app.get("/assistant/openapi.json", tags=["Tools"])
async def assistant_openapi_spec():
    """
    **OpenAPI 3.0 spec for the assistant connector.**

    Import this URL into any agent platform that consumes OpenAPI tool specs.
    """
    spec_path = os.path.join(os.path.dirname(__file__), "assistant", "openapi.yaml")
    with open(spec_path, encoding="utf-8") as f:
        spec = yaml.safe_load(f)

    connector_url = os.getenv("ASSISTANT_CONNECTOR_URL")
    if connector_url:
        spec["servers"] = [{"url": connector_url, "description": "Deployed connector"}]

    return JSONResponse(content=spec)


# ---------------------------------------------------------------------------
# Facilities
# ---------------------------------------------------------------------------


@app.get("/hospitals", tags=["Facilities"])
async def list_hospitals(city: str | None = Query(default=None)):
    """Return hospital records, optionally filtered by city."""
    try:
        from db.hospitals import get_all_hospitals

        hospitals = get_all_hospitals() or MOCK_HOSPITALS

        if city:
            hospitals = [h for h in hospitals if h.get("city") == city]
        return {"hospitals": enrich_hospitals(hospitals)}
    except Exception:
        hospitals = MOCK_HOSPITALS
        if city:
            hospitals = [h for h in hospitals if h.get("city") == city]
        return {"hospitals": enrich_hospitals(hospitals)}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _pipeline_to_response(result: dict, fallback_input: str) -> dict:
    selected = result.get("selected_facility", {})
    return {
        "raw_input": result.get("raw_input", fallback_input),
        "language": result.get("language", "en"),
        "structured_symptoms": result.get("structured_symptoms", {}),
        "triage_level": result.get("triage_level", "clinic"),
        "triage_reasoning": result.get("triage_reasoning", ""),
        "matched_facilities": enrich_hospitals(result.get("matched_facilities", [])),
        "selected_facility": enrich_hospital(selected) if selected else {},
        "routing_reason": result.get("routing_reason", ""),
        "referral_doc": result.get("referral_doc", ""),
        "disclaimer": result.get("disclaimer", ""),
        "is_emergency": bool(result.get("is_emergency")),
        "esi_level": result.get("esi_level"),
        "urgency_category": result.get("urgency_category"),
        "immediate_actions": result.get("immediate_actions") or [],
        "referral_id": result.get("referral_id"),
        "fhir_bundle": result.get("fhir_bundle") or {},
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

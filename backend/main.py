"""
LifeRoute AI — FastAPI Application
Main entry point with all API endpoints.
Run: uvicorn main:app --reload --port 8000
"""

import json
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
    CopilotTurnRequest,
    CopilotResponse,
    BotFrameworkInbound,
    ToolInvokeRequest,
    ToolInvokeResponse,
    ToolCatalogResponse,
    HealthResponse,
)
from graph.pipeline import run_pipeline
from graph.mock_data import MOCK_HOSPITALS
from db.hospital_enrich import enrich_hospitals, enrich_hospital
from copilot.tools import COPILOT_TOOLS, COPILOT_PLUGIN_MANIFEST
from copilot.handler import invoke_tool, run_copilot_turn

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="LifeRoute AI",
    description=(
        "Intelligent healthcare navigation platform with **Microsoft Copilot Studio** "
        "integration. Exposes Copilot agent tools, Bot Framework messaging, and "
        "OpenAPI custom connector for M365 Copilot extensibility."
    ),
    version="1.0.0-mvp",
    openapi_tags=[
        {"name": "Navigation", "description": "Core patient navigation pipeline"},
        {"name": "Microsoft Copilot", "description": "Copilot Studio connector & agent tools"},
        {"name": "Bot Framework", "description": "Azure Bot Service messaging endpoint"},
        {"name": "Facilities", "description": "Hospital network data"},
    ],
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Core endpoints
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse, tags=["Navigation"])
async def health_check():
    """Health check with Copilot integration status."""
    return HealthResponse(copilot_tools=len(COPILOT_TOOLS))


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
# Microsoft Copilot integration
# ---------------------------------------------------------------------------


@app.post("/copilot", tags=["Microsoft Copilot"])
async def copilot_connector(request: CopilotTurnRequest):
    """
    **Microsoft Copilot Studio custom connector entry point.**

    Processes a Copilot conversation turn through the LifeRoute AI LangGraph pipeline.
    Returns a Bot Framework Activity (default) with Adaptive Card attachment.

    Set `response_format: "json"` for legacy flat JSON (frontend widget compat).
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Message text is required")

    try:
        location = {"lat": request.latitude, "lng": request.longitude}
        result = await run_copilot_turn(
            request.text.strip(),
            conversation_id=request.conversation_id,
            reply_to_id=request.reply_to_id,
            location=location,
            response_format=request.response_format,
        )

        if request.response_format == "json":
            return CopilotResponse(**result)

        return JSONResponse(content=result)

    except Exception as e:
        print(f"[API] Copilot error: {e}")
        if request.response_format == "json":
            return CopilotResponse(
                type="message",
                text="I'm sorry, I encountered an error. Please try again or call 112 if urgent.",
                disclaimer="LifeRoute AI provides navigation guidance only.",
            )
        return JSONResponse(
            content={
                "type": "message",
                "text": "I'm sorry, I encountered an error. Please try again or call 112 if urgent.",
                "channelData": {"liferoute": {"error": str(e)}},
            }
        )


@app.post("/api/messages", tags=["Bot Framework"])
async def bot_framework_messages(activity: BotFrameworkInbound):
    """
    **Azure Bot Service / Copilot Studio messaging endpoint.**

    Standard Bot Framework protocol — accepts an inbound Activity,
    returns an outbound Activity with LifeRoute assessment + Adaptive Card.
    """
    text = activity.text or activity.channelData.get("text", "")
    if not text.strip():
        return JSONResponse(
            content={
                "type": "message",
                "text": "Please describe your symptoms and I'll help find the right hospital.",
            }
        )

    conversation_id = activity.conversation.get("id", "")
    reply_to_id = activity.id or ""

    result = await run_copilot_turn(
        text.strip(),
        conversation_id=conversation_id,
        reply_to_id=reply_to_id,
        response_format="activity",
    )
    return JSONResponse(content=result)


@app.get("/copilot/tools", response_model=ToolCatalogResponse, tags=["Microsoft Copilot"])
async def list_copilot_tools():
    """
    **Copilot agent tool catalog.**

    Returns declarative tool definitions for Copilot Studio generative orchestration
    and M365 Copilot plugin registration.
    """
    base_url = os.getenv("COPILOT_CONNECTOR_URL", "http://localhost:8000")
    manifest = {**COPILOT_PLUGIN_MANIFEST}
    manifest["api"] = {"type": "openapi", "url": f"{base_url}/copilot/openapi.json"}
    return ToolCatalogResponse(plugin=manifest, tools=COPILOT_TOOLS)


@app.post("/copilot/invoke", response_model=ToolInvokeResponse, tags=["Microsoft Copilot"])
async def invoke_copilot_tool(request: ToolInvokeRequest):
    """
    **Invoke a Copilot agent tool by name.**

    Tools: `navigate_care`, `triage_symptoms`, `find_hospital`, `generate_referral`, `list_hospitals`
    """
    result = await invoke_tool(request.tool_name, request.parameters)
    return ToolInvokeResponse(**result)


@app.get("/copilot/manifest", tags=["Microsoft Copilot"])
async def copilot_plugin_manifest():
    """Copilot plugin manifest for M365 Copilot extensibility registration."""
    base_url = os.getenv("COPILOT_CONNECTOR_URL", "http://localhost:8000")
    manifest = {**COPILOT_PLUGIN_MANIFEST}
    manifest["api"] = {"type": "openapi", "url": f"{base_url}/copilot/openapi.json"}
    return manifest


@app.get("/copilot/openapi.json", tags=["Microsoft Copilot"])
async def copilot_openapi_spec():
    """
    **OpenAPI 3.0 spec for Copilot Studio custom connector import.**

    Import this URL in Power Platform → Custom Connectors → Create from OpenAPI.
    """
    spec_path = os.path.join(os.path.dirname(__file__), "copilot", "openapi.yaml")
    with open(spec_path, encoding="utf-8") as f:
        spec = yaml.safe_load(f)

    connector_url = os.getenv("COPILOT_CONNECTOR_URL")
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
        use_mock = os.getenv("MOCK_MODE", "false").lower() == "true"
        if use_mock:
            hospitals = MOCK_HOSPITALS
        else:
            from db.supabase_client import get_all_hospitals

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
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

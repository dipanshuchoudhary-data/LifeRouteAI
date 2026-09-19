"""LifeRoute AI 2.0 versioned API router."""

from __future__ import annotations

import asyncio
import json
import time
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

from db.hospital_enrich import enrich_hospital, enrich_hospitals
from fhir.serializers import serialize_fhir_bundle
from graph.agents.safety_sentinel import scan_text
from graph.llm_client import companion_reply, describe_provider, explain_image, finalize_companion_reply, get_voice_model, stream_companion_reply, transcribe_audio
from graph.mock_data import MOCK_HOSPITALS, simulate_live_telemetry
from graph.pipeline import run_pipeline, stream_pipeline
from graph.scoring import rank_hospitals
from app.api.dependencies import get_current_user
from app.core.constants import DEMO_NOTICE, PROVIDER_BUSY, SAFE_ERROR, SAFE_EMERGENCY_ERROR
from app.security.authentication import CurrentUser
from app.security.sanitization import PROMPT_INJECTION_RULES, clean_text
from app.security.uploads import decode_image_b64
from services.pdf_referral import generate_referral_pdf
from services.sessions import persist_session

router = APIRouter()

# Simple in-memory token bucket: 30 req / 60s / IP
_RATE: dict[str, list[float]] = {}
_RATE_LIMIT = 30
_RATE_WINDOW = 60.0
_NEARBY_CACHE: dict[tuple, tuple[float, dict]] = {}


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(request: Request) -> None:
    ip = _client_ip(request)
    now = time.time()
    bucket = [stamp for stamp in _RATE.get(ip, []) if now - stamp < _RATE_WINDOW]
    if len(bucket) >= _RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")
    bucket.append(now)
    _RATE[ip] = bucket


class LocationBody(BaseModel):
    lat: float = 28.6139
    lng: float = 77.2090


class TriageStreamRequest(BaseModel):
    input: str = Field(..., min_length=1)
    location: LocationBody = Field(default_factory=LocationBody)
    session_id: str = ""
    vitals: dict[str, Any] = Field(default_factory=dict)
    patient: dict[str, Any] = Field(default_factory=dict)
    esi_level: int | None = Field(default=None, ge=1, le=5)


class SosRequest(BaseModel):
    input: str = Field(default="Emergency SOS activated from Sathi", max_length=500)
    location: LocationBody = Field(default_factory=LocationBody)
    session_id: str = ""
    vitals: dict[str, Any] = Field(default_factory=dict)
    patient: dict[str, Any] = Field(default_factory=dict)
    source: str = "senior"
    requested_by: str = ""


class ReferralPdfRequest(BaseModel):
    state: dict[str, Any]


class SathiChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    context: dict[str, Any] = Field(default_factory=dict)


class SathiExplainRequest(BaseModel):
    image_base64: str = Field(..., min_length=20, max_length=8_000_000)
    mime: str = "image/jpeg"
    filename: str = "photo.jpg"
    question: str = Field(default="Please explain this simply.", max_length=400)
    context: dict[str, Any] = Field(default_factory=dict)


def _public_state(result: dict) -> dict:
    selected = result.get("selected_facility") or {}
    return {
        "session_id": result.get("session_id"),
        "raw_input": result.get("raw_input"),
        "language": result.get("language", "en"),
        "structured_symptoms": result.get("structured_symptoms", {}),
        "vitals": result.get("vitals", {}),
        "patient": result.get("patient") or {},
        "is_emergency": bool(result.get("is_emergency")),
        "emergency_trigger_reason": result.get("emergency_trigger_reason"),
        "esi_level": result.get("esi_level"),
        "urgency_category": result.get("urgency_category"),
        "triage_level": result.get("triage_level"),
        "triage_reasoning": result.get("triage_reasoning"),
        "recommended_care_setting": result.get("recommended_care_setting"),
        "immediate_actions": result.get("immediate_actions") or [],
        "confidence_score": result.get("confidence_score"),
        "matched_facilities": enrich_hospitals(result.get("matched_facilities") or []),
        "ranked_hospitals": enrich_hospitals(result.get("ranked_hospitals") or result.get("matched_facilities") or []),
        "selected_facility": enrich_hospital(selected) if selected else {},
        "routing_reason": result.get("routing_reason", ""),
        "referral_doc": result.get("referral_doc", ""),
        "referral_id": result.get("referral_id"),
        "referral_signature": result.get("referral_signature"),
        "fhir_bundle": result.get("fhir_bundle") or {},
        "disclaimer": result.get("disclaimer", ""),
        "sentinel_elapsed_ms": result.get("sentinel_elapsed_ms"),
        "audit_trail": result.get("audit_trail") or [],
    }


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"


@router.get("/health")
async def v2_health():
    from graph.pipeline import get_graph

    get_graph()
    return {
        "status": "healthy",
        "version": "2.0.0",
        "checks": {
            "llm": describe_provider(),
            "sentinel": "ok",
            "pipeline": "compiled",
            "session_store": "memory",
        },
        "budgets_ms": {
            "safety_sentinel": 20,
            "llm_inference": 1500,
            "telemetry_lookup": 50,
            "routing_matrix": 300,
        },
    }


@router.post("/triage/stream")
async def triage_stream(payload: TriageStreamRequest, request: Request):
    enforce_rate_limit(request)
    text = payload.input.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Symptom description is required")

    session_id = payload.session_id or str(uuid.uuid4())
    location = {"lat": payload.location.lat, "lng": payload.location.lng}

    async def generate():
        yield _sse("session", {"session_id": session_id})
        sentinel = scan_text(text)
        user_esi = payload.esi_level
        yield _sse(
            "sentinel",
            {
                "is_emergency": user_esi == 1 if user_esi else sentinel.is_emergency,
                "esi_level": user_esi if user_esi else (sentinel.esi_level if sentinel.is_emergency else None),
                "category": sentinel.category,
                "elapsed_ms": round(sentinel.elapsed_ms, 3),
                "instructions": sentinel.instructions if (user_esi or 5) <= 1 or sentinel.is_emergency else None,
            },
        )
        last_public = None
        try:
            async for _, node, merged in stream_pipeline(
                text,
                location,
                session_id,
                vitals=payload.vitals,
                patient=payload.patient,
                user_esi_level=payload.esi_level,
            ):
                last_public = _public_state(merged)
                yield _sse("node", {"node": node, "is_emergency": merged.get("is_emergency", sentinel.is_emergency)})
            if last_public:
                yield _sse("complete", last_public)
            else:
                result = await run_pipeline(
                    text,
                    location,
                    session_id,
                    vitals=payload.vitals,
                    patient=payload.patient,
                    user_esi_level=payload.esi_level,
                )
                yield _sse("complete", _public_state(result))
        except Exception:
            yield _sse("error", {"detail": SAFE_ERROR})

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/triage")
async def triage_sync(payload: TriageStreamRequest, request: Request):
    enforce_rate_limit(request)
    text = payload.input.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Symptom description is required")
    session_id = payload.session_id or str(uuid.uuid4())
    result = await run_pipeline(
        text,
        {"lat": payload.location.lat, "lng": payload.location.lng},
        session_id,
        vitals=payload.vitals,
        patient=payload.patient,
        user_esi_level=payload.esi_level,
    )
    return _public_state(result)


@router.post("/emergency/sos")
async def emergency_sos(payload: SosRequest, request: Request):
    enforce_rate_limit(request)
    text = payload.input.strip() or "Emergency SOS — I need help"
    result = await run_pipeline(
        text,
        {"lat": payload.location.lat, "lng": payload.location.lng},
        payload.session_id or str(uuid.uuid4()),
        vitals=payload.vitals,
        patient=payload.patient,
    )
    result["is_emergency"] = True
    persist_session(result)
    public = _public_state(result)
    hospital = (public.get("selected_facility") or {}).get("name")
    public["dispatch"] = {
        "service": "108",
        "message": "Emergency help is active. Please call 108 now.",
        "nearest_trauma": hospital,
        "recommended_hospital": hospital,
        "ambulance_dispatched": True,
        "notice": DEMO_NOTICE,
        "source": payload.source or "senior",
        "requested_by": payload.requested_by or "",
    }
    return public


@router.get("/hospitals/nearby")
async def hospitals_nearby(
    lat: float = Query(default=28.6139),
    lng: float = Query(default=77.2090),
    esi_level: int = Query(default=4, ge=1, le=5),
    complaint: str = Query(default="general"),
):
    key = (round(lat, 3), round(lng, 3), esi_level, (complaint or "general")[:40])
    hit = _NEARBY_CACHE.get(key)
    if hit and time.time() - hit[0] < 20:
        return hit[1]
    try:
        from db.hospitals import get_all_hospitals

        hospitals = get_all_hospitals() or MOCK_HOSPITALS
    except Exception:
        hospitals = MOCK_HOSPITALS

    live = simulate_live_telemetry(hospitals)
    from graph.agents.geo_router import estimate_travel

    origin = {"lat": lat, "lng": lng}
    annotated = []
    for hospital in live:
        travel = estimate_travel(hospital, origin, mode="ambulance" if esi_level <= 2 else "driving")
        annotated.append({**hospital, **travel})
    ranked = rank_hospitals(annotated, complaint=complaint, esi_level=esi_level, limit=8)
    payload = {"hospitals": enrich_hospitals(ranked), "origin": origin}
    _NEARBY_CACHE[key] = (time.time(), payload)
    return payload


@router.websocket("/hospitals/{hospital_id}/telemetry")
async def hospital_telemetry_ws(websocket: WebSocket, hospital_id: str):
    await websocket.accept()
    try:
        while True:
            live = simulate_live_telemetry(MOCK_HOSPITALS)
            match = next((h for h in live if str(h.get("id")) == str(hospital_id)), live[0])
            await websocket.send_json(enrich_hospital(match))
            await websocket.receive_text()
    except WebSocketDisconnect:
        return
    except Exception:
        await websocket.close()


@router.get("/hospitals/{hospital_id}/telemetry")
async def hospital_telemetry(hospital_id: str):
    live = simulate_live_telemetry(MOCK_HOSPITALS)
    match = next((h for h in live if str(h.get("id")) == str(hospital_id)), None)
    if not match:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return enrich_hospital(match)


@router.post("/referral/generate-pdf")
async def generate_pdf(payload: ReferralPdfRequest, request: Request):
    enforce_rate_limit(request)
    state = payload.state or {}
    if not state.get("fhir_bundle"):
        state["fhir_bundle"] = serialize_fhir_bundle(state)
    pdf_bytes, referral_id, signature = generate_referral_pdf(state)
    headers = {
        "Content-Disposition": f'attachment; filename="{referral_id}.pdf"',
        "X-Referral-Id": referral_id,
        "X-Referral-Signature": signature,
    }
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)


def _sathi_context(payload: SathiChatRequest) -> dict:
    context = dict(payload.context or {})
    context.pop("rule", None)
    return context


@router.post("/sathi/chat")
async def sathi_chat(
    payload: SathiChatRequest,
    request: Request,
    _user: CurrentUser = Depends(get_current_user),
):
    """Everyday companion reply. Does not run hospital routing."""
    enforce_rate_limit(request)
    text = payload.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Please say something first.")
    try:
        reply = await asyncio.to_thread(companion_reply, clean_text(text), _sathi_context(payload))
        return {"reply": reply, "mode": "companion"}
    except Exception:
        raise HTTPException(status_code=502, detail=PROVIDER_BUSY)


@router.post("/sathi/chat/stream")
async def sathi_chat_stream(
    payload: SathiChatRequest,
    request: Request,
    _user: CurrentUser = Depends(get_current_user),
):
    """Stream a companion reply as tokens so Talk can type in real time."""
    enforce_rate_limit(request)
    text = payload.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Please say something first.")
    cleaned = clean_text(text)
    context = _sathi_context(payload)

    def generate():
        collected: list[str] = []
        try:
            for token in stream_companion_reply(cleaned, context):
                collected.append(token)
                yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"
            reply = finalize_companion_reply("".join(collected), cleaned, context)
            yield f"event: complete\ndata: {json.dumps({'reply': reply, 'mode': 'companion'})}\n\n"
        except Exception:
            raw = "".join(collected).strip()
            reply = finalize_companion_reply(raw, cleaned, context) if raw else PROVIDER_BUSY
            yield f"event: complete\ndata: {json.dumps({'reply': reply, 'mode': 'companion'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/sathi/explain")
async def sathi_explain(
    payload: SathiExplainRequest,
    request: Request,
    _user: CurrentUser = Depends(get_current_user),
):
    """Photo or paper explanation in plain language."""
    enforce_rate_limit(request)
    try:
        upload = decode_image_b64(payload.image_base64, mime=payload.mime, filename=payload.filename)
        import base64

        encoded = base64.b64encode(upload.data).decode("ascii")
        reply = await asyncio.to_thread(
            explain_image,
            encoded,
            upload.mime,
            clean_text(payload.question, limit=400),
            {"rule": PROMPT_INJECTION_RULES},
        )
        return {
            "reply": reply,
            "mode": "explain",
            "disclaimer": "This is a simple explanation based on the available photo, not official advice.",
        }
    except HTTPException:
        raise
    except Exception as exc:
        from app.core.exceptions import DomainException
        from graph.llm_client import LLMError

        if isinstance(exc, DomainException):
            raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
        if isinstance(exc, LLMError):
            raise HTTPException(status_code=502, detail=PROVIDER_BUSY) from exc
        raise HTTPException(status_code=502, detail=PROVIDER_BUSY)


SATHI_TASKS = {
    "day": "Summarize only today's appointments, medicines, reminders, and family tasks. Keep it short.",
    "food": "Give simple meal ideas for an older adult in India. This is everyday food help, not a prescription.",
    "memory": "Help them save or recall personal notes, birthdays, and preferences.",
    "help": "Explain a bill, form, website, or phone message step by step. Warn if it asks for a password.",
    "family": "Help them call or message a family member. Keep the next step obvious.",
    "health": "Use saved conditions and medicines as context. Do not diagnose or prescribe.",
}


async def _sathi_task(task: str, payload: SathiChatRequest, request: Request):
    enforce_rate_limit(request)
    text = payload.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Please say something first.")
    hint = SATHI_TASKS[task]
    try:
        reply = await asyncio.to_thread(
            companion_reply,
            f"{hint}\n\nThey said: {clean_text(text)}",
            {"rule": PROMPT_INJECTION_RULES, "name": (payload.context or {}).get("name", "")},
        )
        return {"reply": reply, "mode": task}
    except Exception:
        raise HTTPException(status_code=502, detail=PROVIDER_BUSY)


@router.post("/sathi/day")
async def sathi_day(
    payload: SathiChatRequest,
    request: Request,
    _user: CurrentUser = Depends(get_current_user),
):
    return await _sathi_task("day", payload, request)


@router.post("/sathi/food")
async def sathi_food(
    payload: SathiChatRequest,
    request: Request,
    _user: CurrentUser = Depends(get_current_user),
):
    return await _sathi_task("food", payload, request)


@router.post("/sathi/memory")
async def sathi_memory(
    payload: SathiChatRequest,
    request: Request,
    _user: CurrentUser = Depends(get_current_user),
):
    return await _sathi_task("memory", payload, request)


@router.post("/sathi/help")
async def sathi_help(
    payload: SathiChatRequest,
    request: Request,
    _user: CurrentUser = Depends(get_current_user),
):
    return await _sathi_task("help", payload, request)


@router.post("/sathi/family")
async def sathi_family(
    payload: SathiChatRequest,
    request: Request,
    _user: CurrentUser = Depends(get_current_user),
):
    return await _sathi_task("family", payload, request)


@router.post("/sathi/health")
async def sathi_health(
    payload: SathiChatRequest,
    request: Request,
    _user: CurrentUser = Depends(get_current_user),
):
    return await _sathi_task("health", payload, request)


@router.get("/sathi/catalog")
async def sathi_catalog():
    """Lists companion pages and APIs so judges can try each task separately."""
    return {
        "pages": [
            "/",
            "/talk",
            "/health",
            "/health/chart",
            "/safety",
            "/family",
            "/more",
            "/explain",
            "/memory",
            "/food",
            "/tasks",
            "/help",
            "/settings",
            "/emergency",
        ],
        "apis": [
            "POST /api/v2/sathi/chat",
            "POST /api/v2/sathi/chat/stream",
            "POST /api/v2/sathi/explain",
            "POST /api/v2/sathi/day",
            "POST /api/v2/sathi/food",
            "POST /api/v2/sathi/memory",
            "POST /api/v2/sathi/help",
            "POST /api/v2/sathi/family",
            "POST /api/v2/sathi/health",
            "POST /api/v2/emergency/sos",
            "GET /api/v2/hospitals/nearby",
        ],
    }


@router.post("/triage/voice")
async def triage_voice(request: Request):
    """Transcribe spoken symptoms with the configured Voice_LLM omni model."""
    enforce_rate_limit(request)
    body = await request.body()
    if not body:
        raise HTTPException(status_code=400, detail="Empty audio payload")
    mime = request.headers.get("content-type", "audio/wav")
    try:
        text = await asyncio.to_thread(transcribe_audio, body, mime)
        return {
            "transcribed": True,
            "text": text,
            "model": get_voice_model(),
            "audio_bytes": len(body),
        }
    except Exception:
        raise HTTPException(status_code=502, detail=PROVIDER_BUSY)

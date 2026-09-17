"""LifeRoute AI 2.0 versioned API router."""

from __future__ import annotations

import asyncio
import json
import time
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

from db.hospital_enrich import enrich_hospital, enrich_hospitals
from fhir.serializers import serialize_fhir_bundle
from graph.agents.safety_sentinel import scan_text
from graph.llm_client import describe_provider, get_voice_model, transcribe_audio
from graph.mock_data import MOCK_HOSPITALS, simulate_live_telemetry
from graph.pipeline import run_pipeline, stream_pipeline
from graph.scoring import rank_hospitals
from services.pdf_referral import generate_referral_pdf
from services.sessions import digest_text, persist_session

router = APIRouter()

# Simple in-memory token bucket: 30 req / 60s / IP
_RATE: dict[str, list[float]] = {}
_RATE_LIMIT = 30
_RATE_WINDOW = 60.0


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
    input: str = "Emergency SOS activated from LifeRoute"
    location: LocationBody = Field(default_factory=LocationBody)
    session_id: str = ""
    vitals: dict[str, Any] = Field(default_factory=dict)
    patient: dict[str, Any] = Field(default_factory=dict)


class ReferralPdfRequest(BaseModel):
    state: dict[str, Any]


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
        except Exception as exc:
            yield _sse("error", {"detail": str(exc)})

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
    text = payload.input.strip() or "Emergency SOS — critical symptoms, send help"
    sentinel = scan_text(text)
    # Force emergency even if the typed text is vague — SOS is explicit consent to dispatch.
    result = await run_pipeline(
        text if sentinel.is_emergency else f"unconscious not breathing {text}",
        {"lat": payload.location.lat, "lng": payload.location.lng},
        payload.session_id or str(uuid.uuid4()),
        vitals=payload.vitals,
        patient=payload.patient,
    )
    result["is_emergency"] = True
    persist_session(result)
    public = _public_state(result)
    public["dispatch"] = {
        "service": "108",
        "message": "Call 108 immediately. Stay on the line.",
        "nearest_trauma": (public.get("selected_facility") or {}).get("name"),
    }
    return public


@router.get("/hospitals/nearby")
async def hospitals_nearby(
    lat: float = Query(default=28.6139),
    lng: float = Query(default=77.2090),
    esi_level: int = Query(default=4, ge=1, le=5),
    complaint: str = Query(default="general"),
):
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
    return {"hospitals": enrich_hospitals(ranked), "origin": origin}


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
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

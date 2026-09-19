"""Versioned Sathi API. Handlers only parse HTTP and call use cases."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_rate_limit
from app.application.dto import ChatRequest, EmergencyStartRequest, ExplainRequest, FamilyNotifyRequest
from app.application.use_cases import (
    ChatWithSathiUseCase,
    ExplainDocumentUseCase,
    GetEmergencyUseCase,
    GetTodayUseCase,
    NotifyFamilyUseCase,
    ResolveEmergencyUseCase,
    StartSessionUseCase,
    TriggerEmergencyUseCase,
)
from app.infrastructure.database.session import get_db
from app.infrastructure.speech.providers import get_tts_provider
from app.security.authentication import CurrentUser

router = APIRouter()


@router.post("/auth/demo")
def start_demo_session(db: Session = Depends(get_db)):
    return StartSessionUseCase().execute(db)


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)):
    return {"id": user.id, "name": user.name, "role": user.role}


@router.post("/sathi/chat")
def sathi_chat(
    request: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_rate_limit),
):
    return ChatWithSathiUseCase().execute(db, user, request)


@router.post("/sathi/explain")
def sathi_explain(
    request: ExplainRequest,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_rate_limit),
):
    return ExplainDocumentUseCase().execute(db, user, request)


@router.get("/sathi/today")
def sathi_today(
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return GetTodayUseCase().execute(db, user)


@router.post("/family/messages")
def family_message(
    request: FamilyNotifyRequest,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_rate_limit),
):
    return NotifyFamilyUseCase().execute(db, user, request)


@router.post("/emergency")
def create_emergency(
    request: EmergencyStartRequest,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: None = Depends(require_rate_limit),
):
    return TriggerEmergencyUseCase().execute(db, user, request)


@router.get("/emergency/{emergency_id}")
def read_emergency(
    emergency_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return GetEmergencyUseCase().execute(db, user, emergency_id)


@router.post("/emergency/{emergency_id}/resolve")
def close_emergency(
    emergency_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ResolveEmergencyUseCase().execute(db, user, emergency_id)


@router.post("/speech/tts")
def speak(
    request: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
    _: None = Depends(require_rate_limit),
):
    audio = get_tts_provider().speak(request.message)
    return {"text": audio.text, "provider": audio.provider, "simulated": audio.simulated, "note": audio.note}

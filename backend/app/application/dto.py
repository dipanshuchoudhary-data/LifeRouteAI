from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Intent(str, Enum):
    talk = "talk"
    day = "day"
    appointment = "appointment"
    health = "health"
    family = "family"
    memory = "memory"
    food = "food"
    explain = "explain"
    help = "help"
    emergency = "emergency"


class ActionType(str, Enum):
    reply = "reply"
    lookup = "lookup"
    remember = "remember"
    notify_family = "notify_family"
    trigger_emergency = "trigger_emergency"
    navigate = "navigate"


class AssistantAction(BaseModel):
    intent: Intent = Intent.talk
    action: ActionType = ActionType.reply
    parameters: dict[str, Any] = Field(default_factory=dict)
    requires_confirmation: bool = False
    reply: str = ""


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    confirm: bool = False
    confirmation_token: str = ""


class ExplainRequest(BaseModel):
    image_base64: str = Field(..., min_length=20)
    mime: str = "image/jpeg"
    filename: str = "photo.jpg"
    question: str = Field(default="Please explain this simply.", max_length=400)


class FamilyNotifyRequest(BaseModel):
    contact_id: str = ""
    message: str = Field(..., min_length=1, max_length=500)
    confirm: bool = False
    share_health: bool = False


class EmergencyStartRequest(BaseModel):
    input: str = Field(default="I need help", max_length=500)
    source: str = "senior"
    requested_by: str = ""
    lat: float = 28.6139
    lng: float = 77.209
    notify_family: bool = True
    confirm: bool = True


class EmergencyResolveRequest(BaseModel):
    emergency_id: str

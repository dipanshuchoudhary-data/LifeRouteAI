"""
LifeRoute AI — Pydantic Request/Response Models
Vendor-neutral schemas shared by the REST API and assistant connector.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field


class LocationInput(BaseModel):
    lat: float = Field(default=28.6139, description="Latitude")
    lng: float = Field(default=77.2090, description="Longitude")


class NavigateRequest(BaseModel):
    input: str = Field(..., description="Patient symptom description (English or Hindi)")
    location: LocationInput = Field(default_factory=LocationInput)


class NavigateResponse(BaseModel):
    raw_input: str
    language: str
    structured_symptoms: dict
    triage_level: str
    triage_reasoning: str
    matched_facilities: list
    selected_facility: dict
    routing_reason: str
    referral_doc: str
    disclaimer: str
    is_emergency: bool = False
    esi_level: int | None = None
    urgency_category: str | None = None
    immediate_actions: list = Field(default_factory=list)
    referral_id: str | None = None
    fhir_bundle: dict = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Assistant connector
# ---------------------------------------------------------------------------


class AssistantTurnRequest(BaseModel):
    """Request for POST /assistant/chat — one conversational turn."""

    text: str = Field(..., description="User message / symptom description")
    conversation_id: str = Field(default="", description="Client conversation ID for threading")
    reply_to_id: str = Field(default="", description="Message ID this turn replies to")
    latitude: float = Field(default=28.6139, description="Patient latitude")
    longitude: float = Field(default=77.2090, description="Patient longitude")
    response_format: Literal["message", "json", "tool"] = Field(
        default="message",
        description="message=envelope with card, json=flat summary, tool=tool-call result",
    )


class AssistantChatResponse(BaseModel):
    """Flat JSON response (response_format=json)."""

    type: str = "message"
    text: str = ""
    triage_level: str = ""
    selected_facility: str = ""
    disclaimer: str = ""
    tools_used: list[str] = Field(default_factory=lambda: ["navigate_care"])


class ToolInvokeRequest(BaseModel):
    """Request for POST /assistant/invoke — execute a tool by name."""

    tool_name: str = Field(
        ...,
        description="Tool name: navigate_care | triage_symptoms | find_hospital | generate_referral | list_hospitals",
    )
    parameters: dict[str, Any] = Field(default_factory=dict)


class ToolInvokeResponse(BaseModel):
    tool: str
    success: bool
    result: dict[str, Any]


class ToolCatalogResponse(BaseModel):
    manifest: dict
    format: str = "native"
    tools: list[dict]


class HospitalRecord(BaseModel):
    name: str
    city: str
    address: str
    distance_km: float
    specialties: list[str]
    has_icu: bool
    has_cath_lab: bool
    has_trauma_center: bool
    has_neurology_unit: bool
    total_beds: int
    available_beds: int
    current_capacity_percent: int
    emergency_wait_minutes: int
    rating: float
    contact: str


class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "LifeRoute AI"
    version: str = "2.0.0"
    llm: dict = Field(default_factory=dict, description="Active LLM provider configuration")
    tools_available: int = 5

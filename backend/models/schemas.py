"""
LifeRoute AI — Pydantic Request/Response Models
Includes Microsoft Copilot Studio / Bot Framework schemas.
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


# ---------------------------------------------------------------------------
# Microsoft Copilot / Bot Framework
# ---------------------------------------------------------------------------


class CopilotTurnRequest(BaseModel):
    """Request for POST /copilot — Copilot Studio custom connector."""

    text: str = Field(..., description="User message / symptom description")
    conversation_id: str = Field(default="", description="Copilot conversation ID")
    reply_to_id: str = Field(default="", description="Bot Framework activity ID to reply to")
    latitude: float = Field(default=28.6139, description="Patient latitude")
    longitude: float = Field(default=77.2090, description="Patient longitude")
    response_format: Literal["activity", "json", "tool"] = Field(
        default="activity",
        description="activity=Bot Framework, json=legacy flat, tool=structured tool result",
    )


class CopilotRequest(CopilotTurnRequest):
    """Backward-compatible alias."""

    pass


class CopilotResponse(BaseModel):
    """Legacy flat JSON response (response_format=json)."""

    type: str = "message"
    text: str = ""
    triage_level: str = ""
    selected_facility: str = ""
    disclaimer: str = ""
    tools_used: list[str] = Field(default_factory=lambda: ["navigate_care"])


class CopilotActivity(BaseModel):
    type: str = "message"
    text: str = ""


class BotFrameworkInbound(BaseModel):
    """Inbound Bot Framework Activity for POST /api/messages."""

    type: str = Field(default="message")
    text: str = Field(default="")
    conversation: dict = Field(default_factory=dict)
    from_: dict = Field(default_factory=dict, alias="from")
    channelData: dict = Field(default_factory=dict)
    id: str = Field(default="")

    model_config = {"populate_by_name": True}


class ToolInvokeRequest(BaseModel):
    """Request for POST /copilot/invoke — execute a Copilot agent tool."""

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
    plugin: dict
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
    version: str = "1.0.0-mvp"
    copilot_integration: str = "microsoft-copilot-studio"
    copilot_tools: int = 5

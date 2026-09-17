"""
LifeRoute AI — Shared State Schema

v1 LangGraph nodes continue to use PatientState (TypedDict).
v2 adds validated Pydantic models plus optional keys on the graph state.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Any, Literal, TypedDict
import operator

from pydantic import BaseModel, Field


class PatientState(TypedDict, total=False):
    """Shared state object passed through every node in the LangGraph pipeline."""

    # --- Input ---
    raw_input: str
    language: str
    session_id: str
    user_location: dict
    input_hash: str

    # --- Intake ---
    structured_symptoms: dict
    patient: dict
    vitals: dict
    vitals_warnings: list

    # --- Safety / triage ---
    is_emergency: bool
    emergency_trigger_reason: str | None
    esi_level: int | None
    user_esi_level: int | None
    urgency_category: str | None
    triage_level: str
    triage_reasoning: str
    recommended_care_setting: str
    sentinel_elapsed_ms: float
    immediate_actions: list
    confidence_score: float

    # --- Parallel routing fan-out ---
    geo_candidates: list
    capacity_snapshot: list

    # --- Ranking / referral ---
    matched_facilities: list
    ranked_hospitals: list
    selected_facility: dict
    selected_hospital_id: str | None
    routing_reason: str
    referral_doc: str
    fhir_bundle: dict
    signed_referral_pdf_bytes: bytes | None
    referral_id: str
    referral_signature: str

    # --- Disclaimer / audit ---
    disclaimer: str
    audit_trail: Annotated[list, operator.add]


class VitalSignsModel(BaseModel):
    heart_rate: int | None = Field(None, ge=30, le=250)
    systolic_bp: int | None = Field(None, ge=50, le=260)
    diastolic_bp: int | None = Field(None, ge=30, le=160)
    oxygen_saturation: float | None = Field(None, ge=50.0, le=100.0)
    temperature_f: float | None = Field(None, ge=90.0, le=108.0)
    respiratory_rate: int | None = Field(None, ge=6, le=60)


class PatientDemographics(BaseModel):
    age: int | None = Field(None, ge=0, le=125)
    gender: Literal["male", "female", "other", "unknown"] = "unknown"
    pregnant: bool | None = False
    known_allergies: list[str] = Field(default_factory=list)
    chronic_conditions: list[str] = Field(default_factory=list)
    insurance_provider: str | None = None


class TriageAssessment(BaseModel):
    esi_level: Literal[1, 2, 3, 4, 5]
    urgency_category: Literal["RED", "ORANGE", "YELLOW", "GREEN"]
    primary_complaint: str
    clinical_rationale: str
    red_flags_present: list[str] = Field(default_factory=list)
    recommended_care_setting: Literal[
        "ED_TRAUMA", "ED_GENERAL", "URGENT_CARE", "PRIMARY_CLINIC", "HOME_CARE"
    ]
    confidence_score: float = Field(..., ge=0.0, le=1.0)


class HospitalRecommendation(BaseModel):
    id: str
    name: str
    trauma_level: int | None = None
    distance_miles: float = 0.0
    travel_time_minutes: int = 0
    transit_mode: Literal["ambulance", "driving", "transit"] = "driving"
    current_er_wait_minutes: int = 0
    available_general_beds: int = 0
    available_icu_beds: int = 0
    in_network: bool = True
    pediatric_certified: bool = False
    stroke_center_certified: bool = False
    cardiac_catheterization_lab: bool = False
    composite_match_score: float = 0.0


class AuditEntry(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    node_name: str
    agent_action: str
    model_version: str | None = None
    input_hash: str
    output_summary: str


class LifeRouteStateV2(BaseModel):
    session_id: str
    patient: PatientDemographics = Field(default_factory=PatientDemographics)
    vitals: VitalSignsModel = Field(default_factory=VitalSignsModel)
    user_location: dict[str, float] = Field(default_factory=lambda: {"lat": 28.6139, "lng": 77.2090})
    symptom_history: list[str] = Field(default_factory=list)
    chat_history: list[dict[str, str]] = Field(default_factory=list)
    is_emergency: bool = False
    emergency_trigger_reason: str | None = None
    triage: TriageAssessment | None = None
    ranked_hospitals: list[HospitalRecommendation] = Field(default_factory=list)
    selected_hospital_id: str | None = None
    fhir_bundle: dict[str, Any] | None = None
    signed_referral_pdf_url: str | None = None
    audit_trail: list[AuditEntry] = Field(default_factory=list)

    @classmethod
    def from_pipeline(cls, state: dict) -> "LifeRouteStateV2":
        symptoms = state.get("structured_symptoms") or {}
        age_raw = symptoms.get("age")
        try:
            age = int(age_raw) if age_raw not in (None, "", "null") else None
        except (TypeError, ValueError):
            age = None

        gender = (symptoms.get("gender") or "unknown").lower()
        if gender not in ("male", "female", "other", "unknown"):
            gender = "unknown"

        esi = int(state.get("esi_level") or 5)
        esi = esi if esi in (1, 2, 3, 4, 5) else 5
        urgency = state.get("urgency_category") or {1: "RED", 2: "RED", 3: "ORANGE", 4: "YELLOW", 5: "GREEN"}[esi]
        setting_map = {
            1: "ED_TRAUMA",
            2: "ED_GENERAL",
            3: "ED_GENERAL",
            4: "PRIMARY_CLINIC",
            5: "HOME_CARE",
        }
        triage = TriageAssessment(
            esi_level=esi,  # type: ignore[arg-type]
            urgency_category=urgency,  # type: ignore[arg-type]
            primary_complaint=symptoms.get("chief_complaint") or state.get("raw_input") or "",
            clinical_rationale=state.get("triage_reasoning") or "",
            red_flags_present=[state["emergency_trigger_reason"]] if state.get("is_emergency") else [],
            recommended_care_setting=state.get("recommended_care_setting") or setting_map[esi],  # type: ignore[arg-type]
            confidence_score=float(state.get("confidence_score") or (0.99 if state.get("is_emergency") else 0.7)),
        )

        ranked = []
        for hospital in state.get("ranked_hospitals") or state.get("matched_facilities") or []:
            try:
                ranked.append(
                    HospitalRecommendation(
                        id=str(hospital.get("id") or hospital.get("name") or "unknown"),
                        name=hospital.get("name") or "Unknown facility",
                        trauma_level=1 if hospital.get("has_trauma_center") else None,
                        distance_miles=round(float(hospital.get("distance_km") or 0) * 0.621371, 2),
                        travel_time_minutes=int(hospital.get("travel_time_minutes") or hospital.get("emergency_wait_minutes") or 0),
                        transit_mode="ambulance" if state.get("is_emergency") else "driving",
                        current_er_wait_minutes=int(hospital.get("emergency_wait_minutes") or 0),
                        available_general_beds=int(hospital.get("available_beds") or 0),
                        available_icu_beds=int(hospital.get("available_icu_beds") or 0),
                        in_network=bool(hospital.get("in_network", True)),
                        pediatric_certified="pediatr" in " ".join(hospital.get("specialties") or []).lower(),
                        stroke_center_certified=bool(hospital.get("has_neurology_unit")),
                        cardiac_catheterization_lab=bool(hospital.get("has_cath_lab")),
                        composite_match_score=float(hospital.get("composite_match_score") or hospital.get("_score") or 0),
                    )
                )
            except Exception:
                continue

        selected = state.get("selected_facility") or {}
        return cls(
            session_id=state.get("session_id") or "anonymous",
            patient=PatientDemographics(age=age, gender=gender),  # type: ignore[arg-type]
            vitals=VitalSignsModel.model_validate(state.get("vitals") or {}),
            user_location=state.get("user_location") or {"lat": 28.6139, "lng": 77.2090},
            symptom_history=[state.get("raw_input")] if state.get("raw_input") else [],
            is_emergency=bool(state.get("is_emergency")),
            emergency_trigger_reason=state.get("emergency_trigger_reason"),
            triage=triage,
            ranked_hospitals=ranked,
            selected_hospital_id=str(selected.get("id")) if selected.get("id") is not None else None,
            fhir_bundle=state.get("fhir_bundle"),
            audit_trail=[
                AuditEntry(
                    node_name=entry.get("node_name", "unknown"),
                    agent_action=entry.get("agent_action", ""),
                    input_hash=entry.get("input_hash", ""),
                    output_summary=str(entry.get("output_summary", "")),
                    model_version=entry.get("model_version"),
                )
                for entry in (state.get("audit_trail") or [])
                if isinstance(entry, dict)
            ],
        )


def empty_pipeline_state(
    raw_input: str,
    location: dict | None = None,
    session_id: str = "",
    vitals: dict | None = None,
    patient: dict | None = None,
    user_esi_level: int | None = None,
) -> dict:
    return {
        "raw_input": raw_input,
        "language": "",
        "session_id": session_id,
        "user_location": location or {"lat": 28.6139, "lng": 77.2090},
        "structured_symptoms": {},
        "patient": patient or {},
        "vitals": vitals or {},
        "vitals_warnings": [],
        "is_emergency": False,
        "emergency_trigger_reason": None,
        "esi_level": user_esi_level,
        "user_esi_level": user_esi_level,
        "urgency_category": None,
        "triage_level": "",
        "triage_reasoning": "",
        "recommended_care_setting": "",
        "immediate_actions": [],
        "confidence_score": 0.0,
        "geo_candidates": [],
        "capacity_snapshot": [],
        "matched_facilities": [],
        "ranked_hospitals": [],
        "selected_facility": {},
        "selected_hospital_id": None,
        "routing_reason": "",
        "referral_doc": "",
        "fhir_bundle": {},
        "referral_id": "",
        "referral_signature": "",
        "disclaimer": "",
        "audit_trail": [],
        "input_hash": "",
    }

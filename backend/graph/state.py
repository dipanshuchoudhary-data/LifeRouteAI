"""
LifeRoute AI — Shared State Schema
The single source of truth for the entire LangGraph pipeline.
"""

from typing import TypedDict


class PatientState(TypedDict):
    """Shared state object passed through every node in the LangGraph pipeline."""

    # --- Input ---
    raw_input: str  # Original patient input (English or Hindi)
    language: str  # Detected language: "en" or "hi"

    # --- Intake Agent Output ---
    structured_symptoms: dict
    # {
    #   "chief_complaint": str,
    #   "duration": str,
    #   "severity": int (1-10),
    #   "associated_symptoms": list[str],
    #   "age": str | None,
    #   "gender": str | None,
    # }

    # --- Triage Agent Output ---
    triage_level: str  # "self-care" | "clinic" | "emergency" | "icu"
    triage_reasoning: str  # Plain-language explanation (never a diagnosis)

    # --- Routing Agent Output ---
    matched_facilities: list  # Top 3 hospitals as list[dict]
    selected_facility: dict  # The #1 recommended hospital
    routing_reason: str  # Why this hospital over closer ones

    # --- Referral Agent Output ---
    referral_doc: str  # Markdown-formatted referral document

    # --- Disclaimer Node Output ---
    disclaimer: str  # Standard medical disclaimer

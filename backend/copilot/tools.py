"""
LifeRoute AI — Microsoft Copilot Agent Tools
Declarative tool definitions for Copilot Studio / M365 Copilot extensibility.

Each tool maps to a pipeline capability Copilot can invoke autonomously
or via the custom connector OpenAPI spec (backend/copilot/openapi.yaml).
"""

from typing import Any

# ---------------------------------------------------------------------------
# Copilot Agent Tools (declarative schema)
# Used by GET /copilot/tools and POST /copilot/invoke
# ---------------------------------------------------------------------------

COPILOT_TOOLS: list[dict[str, Any]] = [
    {
        "name": "navigate_care",
        "display_name": "Navigate Healthcare",
        "description": (
            "Primary Copilot action. Accepts patient symptoms in English or Hindi, "
            "runs full LifeRoute AI pipeline: triage → hospital routing → referral document. "
            "Use when a user describes symptoms and needs hospital guidance."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "symptoms": {
                    "type": "string",
                    "description": "Patient symptom description (English or Hindi)",
                },
                "latitude": {
                    "type": "number",
                    "description": "Patient latitude (default: Delhi NCR)",
                    "default": 28.6139,
                },
                "longitude": {
                    "type": "number",
                    "description": "Patient longitude (default: Delhi NCR)",
                    "default": 77.2090,
                },
            },
            "required": ["symptoms"],
        },
        "returns": "Triage level, top 3 hospitals, referral summary, and disclaimer",
        "pipeline": "full",
    },
    {
        "name": "triage_symptoms",
        "display_name": "Triage Symptoms",
        "description": (
            "Assess urgency level (self-care / clinic / emergency / ICU) from symptoms. "
            "Rule-based first, LLM fallback. Never diagnoses — only suggests care level."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "symptoms": {
                    "type": "string",
                    "description": "Patient symptom description",
                },
            },
            "required": ["symptoms"],
        },
        "returns": "triage_level, triage_reasoning, structured_symptoms",
        "pipeline": "triage_only",
    },
    {
        "name": "find_hospital",
        "display_name": "Find Best Hospital",
        "description": (
            "Find the best-equipped hospital for a condition using semantic search + "
            "capability filters (ICU, cath lab, trauma). Returns top 3 ranked facilities "
            "with explicit reasons why closer hospitals were rejected."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "symptoms": {
                    "type": "string",
                    "description": "Patient symptoms or chief complaint",
                },
                "triage_level": {
                    "type": "string",
                    "enum": ["self-care", "clinic", "emergency", "icu"],
                    "description": "Urgency level from triage",
                },
            },
            "required": ["symptoms", "triage_level"],
        },
        "returns": "matched_facilities, selected_facility, routing_reason",
        "pipeline": "routing_only",
    },
    {
        "name": "generate_referral",
        "display_name": "Generate Referral Document",
        "description": (
            "Generate a structured markdown referral document for the patient to carry "
            "to the recommended hospital. Includes complaint, triage, facility, next steps."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "symptoms": {
                    "type": "string",
                    "description": "Patient symptom description",
                },
            },
            "required": ["symptoms"],
        },
        "returns": "referral_doc (markdown)",
        "pipeline": "full",
    },
    {
        "name": "list_hospitals",
        "display_name": "List Hospitals",
        "description": (
            "List all available hospitals in the Delhi NCR network with capacity, "
            "specialties, and capability badges. Use for map view or facility lookup."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "Filter by city: Delhi, Noida, or Gurgaon",
                    "enum": ["Delhi", "Noida", "Gurgaon"],
                },
            },
            "required": [],
        },
        "returns": "List of hospital records",
        "pipeline": "list_only",
    },
]

COPILOT_PLUGIN_MANIFEST = {
    "schema_version": "v1",
    "name_for_human": "LifeRoute AI",
    "name_for_model": "liferoute_healthcare_navigation",
    "description_for_human": (
        "Intelligent healthcare navigation — triage symptoms and route to the "
        "right hospital, not just the nearest one."
    ),
    "description_for_model": (
        "LifeRoute AI is a healthcare navigation Copilot plugin. Use navigate_care "
        "when users describe symptoms. Supports English and Hindi. Never diagnose — "
        "only suggest care levels and hospital routing. Always include medical disclaimer."
    ),
    "auth": {"type": "none"},
    "api": {
        "type": "openapi",
        "url": "/copilot/openapi.json",
    },
    "logo_url": "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hospital/3D/hospital_3d.png",
    "contact_email": "support@liferoute.ai",
    "legal_info_url": "https://liferoute.ai/disclaimer",
}


def get_tool_by_name(name: str) -> dict | None:
    for tool in COPILOT_TOOLS:
        if tool["name"] == name:
            return tool
    return None

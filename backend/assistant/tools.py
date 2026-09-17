"""
LifeRoute AI — Assistant Tool Definitions

Vendor-neutral tool (function) declarations for the LifeRoute pipeline.

The canonical definitions below use plain JSON Schema, so they can be handed to
any tool-calling LLM. Helpers convert them into the shapes each provider wants:

    to_openai_tools()     OpenAI / OpenRouter / Groq / Together / vLLM / Ollama
    to_anthropic_tools()  Anthropic Messages API
    to_json_schema_tools() LangChain, LlamaIndex, and other generic runtimes

Any client may also skip tool calling entirely and POST directly to the REST
endpoints documented in assistant/openapi.yaml.
"""

from typing import Any

# ---------------------------------------------------------------------------
# Canonical tool catalog
# Served by GET /assistant/tools, executed by POST /assistant/invoke
# ---------------------------------------------------------------------------

ASSISTANT_TOOLS: list[dict[str, Any]] = [
    {
        "name": "navigate_care",
        "display_name": "Navigate Healthcare",
        "description": (
            "Primary action. Accepts patient symptoms in English or Hindi and runs the "
            "full LifeRoute AI pipeline: triage → hospital routing → referral document. "
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


ASSISTANT_MANIFEST = {
    "schema_version": "v1",
    "name_for_human": "LifeRoute AI",
    "name_for_model": "liferoute_healthcare_navigation",
    "description_for_human": (
        "Intelligent healthcare navigation — triage symptoms and route to the "
        "right hospital, not just the nearest one."
    ),
    "description_for_model": (
        "LifeRoute AI is a healthcare navigation tool provider. Use navigate_care "
        "when users describe symptoms. Supports English and Hindi. Never diagnose — "
        "only suggest care levels and hospital routing. Always include medical disclaimer."
    ),
    "auth": {"type": "none"},
    "api": {"type": "openapi", "url": "/assistant/openapi.json"},
    "contact_email": "support@liferoute.ai",
    "legal_info_url": "https://liferoute.ai/disclaimer",
}


# ---------------------------------------------------------------------------
# Provider format adapters
# ---------------------------------------------------------------------------


def to_openai_tools() -> list[dict[str, Any]]:
    """Tool list for the OpenAI chat-completions `tools` parameter.

    Accepted as-is by OpenRouter, Groq, Together, Fireworks, DeepSeek, Mistral,
    vLLM, and Ollama, since they all mirror the OpenAI schema.
    """
    return [
        {
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["parameters"],
            },
        }
        for tool in ASSISTANT_TOOLS
    ]


def to_anthropic_tools() -> list[dict[str, Any]]:
    """Tool list for the Anthropic Messages API `tools` parameter."""
    return [
        {
            "name": tool["name"],
            "description": tool["description"],
            "input_schema": tool["parameters"],
        }
        for tool in ASSISTANT_TOOLS
    ]


def to_json_schema_tools() -> list[dict[str, Any]]:
    """Generic name/description/schema triples for framework-agnostic runtimes."""
    return [
        {
            "name": tool["name"],
            "description": tool["description"],
            "schema": tool["parameters"],
        }
        for tool in ASSISTANT_TOOLS
    ]


TOOL_FORMATS = {
    "native": lambda: ASSISTANT_TOOLS,
    "openai": to_openai_tools,
    "anthropic": to_anthropic_tools,
    "json-schema": to_json_schema_tools,
}


def get_tools_in_format(fmt: str = "native") -> list[dict[str, Any]]:
    """Return the tool catalog rendered for the requested provider format."""
    builder = TOOL_FORMATS.get(fmt)
    if builder is None:
        raise ValueError(f"Unknown tool format '{fmt}'. Expected one of: {', '.join(TOOL_FORMATS)}")
    return builder()


def get_tool_by_name(name: str) -> dict | None:
    for tool in ASSISTANT_TOOLS:
        if tool["name"] == name:
            return tool
    return None

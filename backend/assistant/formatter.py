"""
LifeRoute AI — Assistant Response Formatter

Shapes pipeline output into renderer-agnostic payloads:

    format_assistant_text()    markdown summary for any chat surface
    build_result_card()        structured card any UI can render
    build_assistant_message()  message envelope (text + card + structured data)
    build_tool_result()        result wrapper for tool/function calling

Nothing here is tied to a specific vendor UI. Clients that want a different
card dialect can map `build_result_card()` output to their own schema.
"""

from typing import Any

SEVERITY_BY_TRIAGE = {
    "self-care": "info",
    "clinic": "warning",
    "emergency": "critical",
    "icu": "critical",
}


def build_result_card(result: dict) -> dict[str, Any]:
    """Build a neutral, structured card describing the assessment."""
    triage = result.get("triage_level", "clinic")
    facility = result.get("selected_facility", {})

    facts = [
        {"label": "Urgency", "value": triage.upper().replace("-", " ")},
        {"label": "Hospital", "value": facility.get("name", "N/A")},
        {"label": "City", "value": facility.get("city", "N/A")},
        {"label": "Available Beds", "value": str(facility.get("available_beds", "—"))},
        {"label": "Wait Time", "value": f"{facility.get('emergency_wait_minutes', '—')} min"},
        {"label": "Contact", "value": facility.get("contact", "N/A")},
    ]

    capabilities = []
    if facility.get("has_icu"):
        capabilities.append("ICU")
    if facility.get("has_cath_lab"):
        capabilities.append("Cath Lab")
    if facility.get("has_trauma_center"):
        capabilities.append("Trauma")
    if capabilities:
        facts.append({"label": "Capabilities", "value": ", ".join(capabilities)})

    actions = []
    address = facility.get("address", "")
    contact = facility.get("contact", "")
    if address:
        actions.append(
            {
                "type": "open_url",
                "label": "Get Directions",
                "url": f"https://www.google.com/maps/search/?api=1&query={address}",
            }
        )
    if contact:
        actions.append(
            {
                "type": "call",
                "label": "Call Hospital",
                "url": f"tel:{contact.replace(' ', '')}",
            }
        )

    return {
        "title": "LifeRoute AI Assessment",
        "severity": SEVERITY_BY_TRIAGE.get(triage, "info"),
        "summary": result.get("triage_reasoning", ""),
        "facts": facts,
        "footnotes": [
            note
            for note in (result.get("routing_reason", ""), result.get("disclaimer", ""))
            if note
        ],
        "actions": actions,
    }


def format_assistant_text(result: dict) -> str:
    """Markdown summary suitable for any chat surface."""
    triage = result.get("triage_level", "clinic").upper()
    reasoning = result.get("triage_reasoning", "")
    facility = result.get("selected_facility", {})
    facility_name = facility.get("name", "")
    facility_contact = facility.get("contact", "")
    routing = result.get("routing_reason", "")
    disclaimer = result.get("disclaimer", "")

    return f"""**LifeRoute AI Assessment**

**Urgency Level:** {triage}
{reasoning}

**Recommended Hospital:** {facility_name}
{facility_contact}
{routing}

---
_{disclaimer}_"""


def build_assistant_message(
    result: dict,
    *,
    conversation_id: str = "",
    reply_to_id: str = "",
    include_card: bool = True,
) -> dict[str, Any]:
    """Build a chat message envelope: readable text plus machine-readable data."""
    message: dict[str, Any] = {
        "type": "message",
        "role": "assistant",
        "text": format_assistant_text(result),
        "data": {
            "triage_level": result.get("triage_level"),
            "selected_facility": result.get("selected_facility", {}),
            "matched_facilities": result.get("matched_facilities", []),
            "referral_doc": result.get("referral_doc", ""),
            "language": result.get("language", "en"),
            "disclaimer": result.get("disclaimer", ""),
        },
    }

    if conversation_id:
        message["conversation_id"] = conversation_id
    if reply_to_id:
        message["reply_to_id"] = reply_to_id

    if include_card and result.get("selected_facility"):
        message["card"] = build_result_card(result)

    return message


def build_tool_result(tool_name: str, result: Any, success: bool = True) -> dict:
    """Structured tool invocation result for agent orchestration."""
    return {
        "tool": tool_name,
        "success": success,
        "result": result,
    }

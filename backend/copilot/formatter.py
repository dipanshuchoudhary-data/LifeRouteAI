"""
LifeRoute AI — Copilot Response Formatter
Builds Microsoft Bot Framework Activity payloads and Adaptive Cards.
"""

from typing import Any


def build_adaptive_card(result: dict) -> dict:
    """Build an Adaptive Card for rich Copilot / Teams rendering."""
    triage = result.get("triage_level", "clinic")
    facility = result.get("selected_facility", {})
    triage_colors = {
        "self-care": "Good",
        "clinic": "Warning",
        "emergency": "Attention",
        "icu": "Attention",
    }

    facts = [
        {"title": "Urgency", "value": triage.upper().replace("-", " ")},
        {"title": "Hospital", "value": facility.get("name", "N/A")},
        {"title": "City", "value": facility.get("city", "N/A")},
        {"title": "Available Beds", "value": str(facility.get("available_beds", "—"))},
        {"title": "Wait Time", "value": f"{facility.get('emergency_wait_minutes', '—')} min"},
        {"title": "Contact", "value": facility.get("contact", "N/A")},
    ]

    capabilities = []
    if facility.get("has_icu"):
        capabilities.append("ICU")
    if facility.get("has_cath_lab"):
        capabilities.append("Cath Lab")
    if facility.get("has_trauma_center"):
        capabilities.append("Trauma")
    if capabilities:
        facts.append({"title": "Capabilities", "value": ", ".join(capabilities)})

    body = [
        {
            "type": "TextBlock",
            "text": "LifeRoute AI Assessment",
            "weight": "Bolder",
            "size": "Medium",
            "color": "Accent",
        },
        {
            "type": "TextBlock",
            "text": result.get("triage_reasoning", ""),
            "wrap": True,
            "spacing": "Small",
        },
        {"type": "FactSet", "facts": facts, "spacing": "Medium"},
        {
            "type": "TextBlock",
            "text": result.get("routing_reason", ""),
            "wrap": True,
            "size": "Small",
            "isSubtle": True,
            "spacing": "Medium",
        },
        {
            "type": "TextBlock",
            "text": result.get("disclaimer", ""),
            "wrap": True,
            "size": "Small",
            "isSubtle": True,
            "spacing": "Small",
        },
    ]

    actions = []
    address = facility.get("address", "")
    contact = facility.get("contact", "")
    if address:
        actions.append(
            {
                "type": "Action.OpenUrl",
                "title": "Get Directions",
                "url": f"https://www.google.com/maps/search/?api=1&query={address}",
            }
        )
    if contact:
        actions.append(
            {
                "type": "Action.OpenUrl",
                "title": "Call Hospital",
                "url": f"tel:{contact.replace(' ', '')}",
            }
        )

    return {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.5",
        "body": body,
        "actions": actions,
        "msteams": {"width": "Full"},
    }


def format_copilot_text(result: dict) -> str:
    """Plain-text response for Copilot chat surfaces."""
    triage = result.get("triage_level", "clinic").upper()
    reasoning = result.get("triage_reasoning", "")
    facility = result.get("selected_facility", {})
    facility_name = facility.get("name", "")
    facility_contact = facility.get("contact", "")
    routing = result.get("routing_reason", "")
    disclaimer = result.get("disclaimer", "")

    return f"""🏥 **LifeRoute AI Assessment**

**Urgency Level:** {triage}
{reasoning}

**Recommended Hospital:** {facility_name}
📞 {facility_contact}
{routing}

---
_{disclaimer}_"""


def build_bot_activity(
    result: dict,
    *,
    conversation_id: str = "",
    reply_to_id: str = "",
    include_card: bool = True,
) -> dict[str, Any]:
    """
    Build a Bot Framework Activity response for Copilot Studio / Teams.
    https://learn.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-send-and-receive-messages
    """
    activity: dict[str, Any] = {
        "type": "message",
        "text": format_copilot_text(result),
        "channelData": {
            "liferoute": {
                "triage_level": result.get("triage_level"),
                "selected_facility": result.get("selected_facility", {}),
                "matched_facilities": result.get("matched_facilities", []),
                "referral_doc": result.get("referral_doc", ""),
                "language": result.get("language", "en"),
                "disclaimer": result.get("disclaimer", ""),
            }
        },
    }

    if conversation_id:
        activity["conversation"] = {"id": conversation_id}
    if reply_to_id:
        activity["replyToId"] = reply_to_id

    if include_card and result.get("selected_facility"):
        activity["attachments"] = [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": build_adaptive_card(result),
            }
        ]

    return activity


def build_tool_result(tool_name: str, result: Any, success: bool = True) -> dict:
    """Structured tool invocation result for Copilot agent orchestration."""
    return {
        "tool": tool_name,
        "success": success,
        "result": result,
    }

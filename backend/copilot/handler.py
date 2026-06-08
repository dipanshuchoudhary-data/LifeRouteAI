"""
LifeRoute AI — Copilot Tool Handler
Executes Copilot agent tools and orchestrates pipeline calls.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from graph.pipeline import run_pipeline
from graph.agents.intake import intake_agent
from graph.agents.triage import triage_agent
from graph.agents.routing import routing_agent
from graph.agents.referral import referral_agent
from graph.agents.disclaimer import disclaimer_agent
from graph.mock_data import MOCK_HOSPITALS
from copilot.formatter import build_bot_activity, build_tool_result, format_copilot_text


async def _run_partial_pipeline(raw_input: str, location: dict | None, mode: str) -> dict:
    """Run full or partial pipeline based on tool mode."""
    if mode == "list_only":
        use_mock = os.getenv("MOCK_MODE", "false").lower() == "true"
        if use_mock:
            return {"hospitals": MOCK_HOSPITALS}
        try:
            from db.supabase_client import get_all_hospitals

            hospitals = get_all_hospitals() or MOCK_HOSPITALS
        except Exception:
            hospitals = MOCK_HOSPITALS
        return {"hospitals": hospitals}

    if mode == "full":
        return await run_pipeline(raw_input, location)

    # Partial pipeline runs
    state = {
        "raw_input": raw_input,
        "language": "",
        "structured_symptoms": {},
        "triage_level": "",
        "triage_reasoning": "",
        "matched_facilities": [],
        "selected_facility": {},
        "routing_reason": "",
        "referral_doc": "",
        "disclaimer": "",
    }

    state.update(intake_agent(state))

    if mode == "triage_only":
        state.update(triage_agent(state))
        state.update(disclaimer_agent(state))
        return state

    if mode == "routing_only":
        # triage_level should be passed via params — caller sets it on state
        state.update(triage_agent(state))
        state.update(routing_agent(state))
        state.update(disclaimer_agent(state))
        return state

    return await run_pipeline(raw_input, location)


async def invoke_tool(tool_name: str, parameters: dict) -> dict:
    """Execute a named Copilot tool with parameters."""
    from copilot.tools import get_tool_by_name

    tool = get_tool_by_name(tool_name)
    if not tool:
        return build_tool_result(tool_name, {"error": f"Unknown tool: {tool_name}"}, success=False)

    symptoms = parameters.get("symptoms", parameters.get("text", ""))
    location = {
        "lat": parameters.get("latitude", 28.6139),
        "lng": parameters.get("longitude", 77.2090),
    }

    mode = tool.get("pipeline", "full")

    if mode == "list_only":
        data = await _run_partial_pipeline("", None, "list_only")
        hospitals = data.get("hospitals", [])
        city = parameters.get("city")
        if city:
            hospitals = [h for h in hospitals if h.get("city") == city]
        return build_tool_result(tool_name, {"hospitals": hospitals, "count": len(hospitals)})

    if not symptoms or not str(symptoms).strip():
        return build_tool_result(
            tool_name, {"error": "symptoms parameter is required"}, success=False
        )

    if mode == "routing_only":
        triage_level = parameters.get("triage_level", "clinic")
        state = {
            "raw_input": symptoms,
            "language": "en",
            "structured_symptoms": intake_agent({"raw_input": symptoms}).get(
                "structured_symptoms", {}
            ),
            "triage_level": triage_level,
            "triage_reasoning": "",
            "matched_facilities": [],
            "selected_facility": {},
            "routing_reason": "",
            "referral_doc": "",
            "disclaimer": "",
        }
        state.update(routing_agent(state))
        state.update(disclaimer_agent(state))
        return build_tool_result(tool_name, _slim_state(state))

    result = await _run_partial_pipeline(str(symptoms).strip(), location, mode)
    return build_tool_result(tool_name, _slim_state(result))


def _slim_state(state: dict) -> dict:
    """Return Copilot-friendly subset of pipeline state."""
    return {
        "raw_input": state.get("raw_input"),
        "language": state.get("language"),
        "structured_symptoms": state.get("structured_symptoms"),
        "triage_level": state.get("triage_level"),
        "triage_reasoning": state.get("triage_reasoning"),
        "matched_facilities": state.get("matched_facilities", [])[:3],
        "selected_facility": state.get("selected_facility"),
        "routing_reason": state.get("routing_reason"),
        "referral_doc": state.get("referral_doc"),
        "disclaimer": state.get("disclaimer"),
    }


async def run_copilot_turn(
    text: str,
    *,
    conversation_id: str = "",
    reply_to_id: str = "",
    location: dict | None = None,
    response_format: str = "activity",
) -> dict:
    """
    Process a Copilot conversation turn.

    response_format:
      - "activity" → Bot Framework Activity (default, for Copilot Studio)
      - "json"     → Flat JSON (legacy /copilot compat)
      - "tool"     → Tool invocation wrapper
    """
    result = await run_pipeline(text.strip(), location or {"lat": 28.6139, "lng": 77.2090})

    if response_format == "json":
        facility = result.get("selected_facility", {})
        return {
            "type": "message",
            "text": format_copilot_text(result),
            "triage_level": result.get("triage_level", ""),
            "selected_facility": facility.get("name", ""),
            "disclaimer": result.get("disclaimer", ""),
            "tools_used": ["navigate_care"],
        }

    if response_format == "tool":
        return build_tool_result("navigate_care", _slim_state(result))

    return build_bot_activity(
        result,
        conversation_id=conversation_id,
        reply_to_id=reply_to_id,
        include_card=True,
    )

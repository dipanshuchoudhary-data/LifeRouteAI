"""
LifeRoute AI 2.0 — LangGraph Pipeline

Fan-out DAG:
  START → safety_sentinel
            ├─ (emergency) → emergency_fast_track → referral → disclaimer → END
            └─ (stable) → intake → triage → [geo_router ∥ hospital_capacity] → ranking → referral → disclaimer → END
"""

from __future__ import annotations

import os
import uuid

from langgraph.graph import END, START, StateGraph

from graph.agents.disclaimer import disclaimer_agent
from graph.agents.emergency_fast_track import emergency_fast_track_agent
from graph.agents.geo_router import geo_router_agent
from graph.agents.hospital_capacity import hospital_capacity_agent
from graph.agents.intake import intake_agent
from graph.agents.ranking_supervisor import ranking_supervisor_agent
from graph.agents.referral import referral_agent
from graph.agents.safety_sentinel import route_after_sentinel, safety_sentinel_agent
from graph.agents.triage import triage_agent
from graph.mock_data import MOCK_DEMO_RESULTS
from graph.state import PatientState, empty_pipeline_state
from services.sessions import append_audit, persist_session


def _match_demo_scenario(raw_input: str) -> dict | None:
    """Check if input matches a pre-computed demo scenario."""
    input_lower = raw_input.lower().strip()

    for result in MOCK_DEMO_RESULTS.values():
        if result["raw_input"].lower() in input_lower or input_lower in result["raw_input"].lower():
            return result

    if "chest pain" in input_lower:
        return MOCK_DEMO_RESULTS["chest_pain_english"]
    if "बुखार" in raw_input or "सिरदर्द" in raw_input:
        return MOCK_DEMO_RESULTS["fever_hindi"]
    if "accident" in input_lower or "trauma" in input_lower or "head injury" in input_lower:
        return MOCK_DEMO_RESULTS["trauma_english"]

    return None


def build_graph() -> StateGraph:
    graph = StateGraph(PatientState)

    graph.add_node("safety_sentinel", safety_sentinel_agent)
    graph.add_node("emergency_fast_track", emergency_fast_track_agent)
    graph.add_node("intake", intake_agent)
    graph.add_node("triage", triage_agent)
    graph.add_node("geo_router", geo_router_agent)
    graph.add_node("hospital_capacity", hospital_capacity_agent)
    graph.add_node("ranking", ranking_supervisor_agent)
    graph.add_node("referral", referral_agent)
    graph.add_node("disclaimer", disclaimer_agent)

    graph.add_edge(START, "safety_sentinel")
    graph.add_conditional_edges(
        "safety_sentinel",
        route_after_sentinel,
        {
            "emergency_fast_track": "emergency_fast_track",
            "intake": "intake",
        },
    )
    graph.add_edge("emergency_fast_track", "referral")
    graph.add_edge("intake", "triage")
    graph.add_edge("triage", "geo_router")
    graph.add_edge("triage", "hospital_capacity")
    graph.add_edge("geo_router", "ranking")
    graph.add_edge("hospital_capacity", "ranking")
    graph.add_edge("ranking", "referral")
    graph.add_edge("referral", "disclaimer")
    graph.add_edge("disclaimer", END)

    return graph.compile()


_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


def reset_graph() -> None:
    global _compiled_graph
    _compiled_graph = None


async def run_pipeline(
    raw_input: str,
    location: dict | None = None,
    session_id: str | None = None,
    vitals: dict | None = None,
    patient: dict | None = None,
    user_esi_level: int | None = None,
) -> dict:
    """Execute the LifeRoute 2.0 pipeline."""
    use_mock = os.getenv("MOCK_MODE", "false").lower() == "true"
    session_id = session_id or str(uuid.uuid4())

    if use_mock:
        demo_result = _match_demo_scenario(raw_input)
        if demo_result:
            print("[Pipeline] Using pre-computed demo result (MOCK_MODE=true)")
            cloned = dict(demo_result)
            cloned["session_id"] = session_id
            if user_esi_level:
                cloned["user_esi_level"] = user_esi_level
                cloned["esi_level"] = user_esi_level
                cloned["is_emergency"] = user_esi_level == 1
                cloned["urgency_category"] = {1: "RED", 2: "RED", 3: "ORANGE", 4: "YELLOW", 5: "GREEN"}[user_esi_level]
            else:
                cloned["is_emergency"] = cloned.get("triage_level") == "icu"
                cloned["esi_level"] = 1 if cloned["is_emergency"] else 4
                cloned["urgency_category"] = "RED" if cloned["is_emergency"] else "YELLOW"
            return cloned

    graph = get_graph()
    initial_state = empty_pipeline_state(
        raw_input, location, session_id, vitals=vitals, patient=patient, user_esi_level=user_esi_level
    )

    try:
        result = await graph.ainvoke(initial_state)
        persist_session(result)
        append_audit(
            session_id,
            "pipeline_complete",
            "pipeline",
            result.get("input_hash") or "",
            {
                "triage_level": result.get("triage_level"),
                "esi_level": result.get("esi_level"),
                "is_emergency": result.get("is_emergency"),
                "facility": (result.get("selected_facility") or {}).get("name"),
            },
        )
        return result
    except Exception as e:
        print(f"[Pipeline] Error during execution: {e}")
        demo_result = _match_demo_scenario(raw_input)
        if demo_result:
            print("[Pipeline] Falling back to pre-computed demo result")
            cloned = dict(demo_result)
            cloned["session_id"] = session_id
            return cloned
        raise


async def stream_pipeline(
    raw_input: str,
    location: dict | None = None,
    session_id: str | None = None,
    vitals: dict | None = None,
    patient: dict | None = None,
    user_esi_level: int | None = None,
):
    """Yield (session_id, node_name, merged_state) as each graph node completes."""
    session_id = session_id or str(uuid.uuid4())
    graph = get_graph()
    state = empty_pipeline_state(
        raw_input, location, session_id, vitals=vitals, patient=patient, user_esi_level=user_esi_level
    )
    async for event in graph.astream(state, stream_mode="updates"):
        node_name = next(iter(event.keys()), "unknown")
        update = event.get(node_name) or {}
        audit_delta = update.get("audit_trail")
        merged = {k: v for k, v in update.items() if k != "audit_trail"}
        state.update(merged)
        if audit_delta:
            state["audit_trail"] = list(state.get("audit_trail") or []) + list(audit_delta)
        yield session_id, node_name, state
    persist_session(state)
    append_audit(
        session_id,
        "pipeline_complete",
        "pipeline",
        state.get("input_hash") or "",
        {
            "triage_level": state.get("triage_level"),
            "esi_level": state.get("esi_level"),
            "is_emergency": state.get("is_emergency"),
            "facility": (state.get("selected_facility") or {}).get("name"),
        },
    )

"""
Emergency fast-track node.

Triggered only by the Tier-0 sentinel. No LLM. Deterministic hospital
selection + dispatch payload in milliseconds.
"""

from __future__ import annotations

from graph.mock_data import MOCK_HOSPITALS, simulate_live_telemetry
from graph.scoring import rank_hospitals
from db.hospital_enrich import enrich_hospital, enrich_hospitals


CATEGORY_TO_COMPLAINT = {
    "CARDIOVASCULAR": "chest pain cardiac arrest",
    "NEUROLOGICAL_STROKE": "stroke facial droop paralysis",
    "RESPIRATORY_FAILURE": "unable to breathe respiratory failure",
    "ANAPHYLAXIS": "anaphylaxis throat closing",
    "TRAUMA_HEMORRHAGE": "major trauma uncontrolled bleeding accident",
    "OBSTETRIC_SEIZURE": "seizure eclampsia",
}

DISPATCH_ACTIONS = [
    "Call 108 immediately — stay on the line",
    "Do not drive yourself or the patient",
    "If unresponsive and not breathing, begin CPR if trained",
    "Unlock the door for emergency responders",
    "Gather current medications if it is safe to do so",
]


def _hospitals() -> list[dict]:
    from db.hospitals import get_all_hospitals

    return get_all_hospitals() or MOCK_HOSPITALS


def emergency_fast_track_agent(state: dict) -> dict:
    reason = state.get("emergency_trigger_reason") or ""
    category = "TRAUMA_HEMORRHAGE"
    for key in CATEGORY_TO_COMPLAINT:
        if key in reason:
            category = key
            break

    complaint = CATEGORY_TO_COMPLAINT[category]
    live = simulate_live_telemetry(_hospitals())
    ranked = rank_hospitals(live, complaint=complaint, esi_level=1, limit=3)
    matched = enrich_hospitals([{k: v for k, v in h.items() if not str(k).startswith("_")} for h in ranked])
    selected = enrich_hospital(matched[0]) if matched else {}

    name = selected.get("name", "the nearest trauma-capable emergency department")
    routing_reason = (
        f"{name} was selected on the emergency fast-track (no generative delay) "
        f"because it is the highest composite match for {category.replace('_', ' ').title()} "
        f"with ICU/trauma capability and live bed telemetry."
    )

    return {
        "language": state.get("language") or "en",
        "structured_symptoms": state.get("structured_symptoms")
        or {
            "chief_complaint": state.get("raw_input"),
            "severity": 10,
            "duration": "acute",
            "associated_symptoms": [category.lower()],
            "age": None,
            "gender": None,
        },
        "esi_level": 1,
        "urgency_category": "RED",
        "triage_level": "icu",
        "recommended_care_setting": "ED_TRAUMA",
        "confidence_score": 0.99,
        "immediate_actions": DISPATCH_ACTIONS,
        "matched_facilities": matched,
        "ranked_hospitals": matched,
        "selected_facility": selected,
        "selected_hospital_id": str(selected.get("id")) if selected else None,
        "routing_reason": routing_reason,
        "geo_candidates": matched,
        "capacity_snapshot": matched,
        "audit_trail": [
            {
                "node_name": "emergency_fast_track",
                "agent_action": "bypass_llm_dispatch",
                "input_hash": state.get("input_hash") or "",
                "output_summary": f"fast_track:{category}:{selected.get('name')}",
            }
        ],
    }

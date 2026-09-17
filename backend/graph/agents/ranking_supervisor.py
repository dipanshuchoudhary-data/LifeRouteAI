"""Fan-in ranking supervisor — merges geo + capacity into a scored shortlist."""

from __future__ import annotations

from graph.scoring import rank_hospitals
from db.hospital_enrich import enrich_hospital, enrich_hospitals


def _index_by_name(rows: list[dict]) -> dict[str, dict]:
    return {str(row.get("name")): row for row in rows if row.get("name")}


def ranking_supervisor_agent(state: dict) -> dict:
    geo = _index_by_name(state.get("geo_candidates") or [])
    cap = _index_by_name(state.get("capacity_snapshot") or [])
    names = list(dict.fromkeys([*geo.keys(), *cap.keys()]))
    merged = []
    for name in names:
        row = {**cap.get(name, {}), **geo.get(name, {})}
        merged.append(row)

    if not merged:
        from graph.mock_data import MOCK_HOSPITALS, simulate_live_telemetry

        merged = simulate_live_telemetry(MOCK_HOSPITALS)

    symptoms = state.get("structured_symptoms") or {}
    complaint = symptoms.get("chief_complaint") or state.get("raw_input") or ""
    esi = int(state.get("esi_level") or 4)
    age_raw = symptoms.get("age")
    try:
        age = int(age_raw) if age_raw not in (None, "", "null") else None
    except (TypeError, ValueError):
        age = None

    travel_lookup = {
        str(h.get("name")): float(h.get("travel_time_minutes") or (h.get("distance_km") or 8) * 3.2)
        for h in merged
    }
    ranked = rank_hospitals(
        merged,
        complaint=complaint,
        esi_level=esi,
        travel_lookup=travel_lookup,
        age=age,
        limit=3,
    )
    matched = enrich_hospitals([{k: v for k, v in h.items() if not str(k).startswith("_")} for h in ranked])
    selected = enrich_hospital(matched[0]) if matched else {}

    rejected = [h.get("name") for h in merged if h.get("name") not in {m.get("name") for m in matched}]
    routing_reason = (
        f"{selected.get('name', 'Selected hospital')} scored {selected.get('composite_match_score', 0)} "
        f"on travel time, live ER wait, open beds, and specialty match for ESI-{esi}."
    )
    if rejected:
        routing_reason += f" Other nearby facilities were deprioritized: {', '.join(rejected[:3])}."

    return {
        "matched_facilities": matched,
        "ranked_hospitals": matched,
        "selected_facility": selected,
        "selected_hospital_id": str(selected.get("id")) if selected else None,
        "routing_reason": routing_reason,
        "audit_trail": [
            {
                "node_name": "ranking_supervisor",
                "agent_action": "composite_rank",
                "input_hash": state.get("input_hash") or "",
                "output_summary": selected.get("name") or "none",
            }
        ],
    }

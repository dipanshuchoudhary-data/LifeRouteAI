"""Hospital capacity telemetry agent — live beds, wait, divert status."""

from __future__ import annotations

from graph.mock_data import MOCK_HOSPITALS, simulate_live_telemetry
from db.hospital_enrich import enrich_hospitals


def hospital_capacity_agent(state: dict) -> dict:
    from db.hospitals import get_all_hospitals

    hospitals = get_all_hospitals() or MOCK_HOSPITALS

    snapshot = enrich_hospitals(simulate_live_telemetry(hospitals))
    return {
        "capacity_snapshot": snapshot,
        "audit_trail": [
            {
                "node_name": "hospital_capacity",
                "agent_action": "telemetry_snapshot",
                "input_hash": state.get("input_hash") or "",
                "output_summary": f"facilities={len(snapshot)}",
            }
        ],
    }

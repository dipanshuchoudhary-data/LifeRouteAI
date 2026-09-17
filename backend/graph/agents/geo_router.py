"""Geospatial routing agent — travel-time estimates for candidate hospitals."""

from __future__ import annotations

from math import asin, cos, radians, sin, sqrt

from db.hospital_enrich import HOSPITAL_COORDS, DEFAULT_COORD, enrich_hospitals
from graph.mock_data import MOCK_HOSPITALS, simulate_live_telemetry


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * r * asin(sqrt(a))


def _coords_for(hospital: dict) -> tuple[float, float]:
    if hospital.get("lat") and hospital.get("lng"):
        return float(hospital["lat"]), float(hospital["lng"])
    return HOSPITAL_COORDS.get(hospital.get("name", ""), DEFAULT_COORD)


def estimate_travel(hospital: dict, origin: dict, mode: str = "driving") -> dict:
    lat, lng = _coords_for(hospital)
    origin_lat = float(origin.get("lat") or 28.6139)
    origin_lng = float(origin.get("lng") or 77.2090)
    km = _haversine_km(origin_lat, origin_lng, lat, lng)
    # Mixed Delhi NCR speeds: ambulance slightly faster than private car
    speed_kmh = 42.0 if mode == "ambulance" else 28.0
    minutes = max(4, int(round((km / speed_kmh) * 60)))
    return {
        "distance_km": round(km, 2),
        "travel_time_minutes": minutes,
        "transit_mode": mode,
        "lat": lat,
        "lng": lng,
    }


def geo_router_agent(state: dict) -> dict:
    origin = state.get("user_location") or {"lat": 28.6139, "lng": 77.2090}
    mode = "ambulance" if state.get("is_emergency") or state.get("triage_level") in ("icu", "emergency") else "driving"

    from db.hospitals import get_all_hospitals

    hospitals = get_all_hospitals() or MOCK_HOSPITALS

    live = simulate_live_telemetry(hospitals)
    candidates = []
    for hospital in live:
        travel = estimate_travel(hospital, origin, mode=mode)
        item = {**hospital, **travel}
        candidates.append(item)

    candidates.sort(key=lambda h: h["travel_time_minutes"])
    return {
        "geo_candidates": enrich_hospitals(candidates),
        "audit_trail": [
            {
                "node_name": "geo_router",
                "agent_action": "travel_matrix",
                "input_hash": state.get("input_hash") or "",
                "output_summary": f"candidates={len(candidates)} mode={mode}",
            }
        ],
    }

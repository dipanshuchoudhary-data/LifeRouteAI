"""
Composite clinical hospital match score.

S_c = w1·T(travel) + w2·W(ER wait) + w3·B(beds) + w4·C(specialty) + w5·I(network)

ESI 1–2 bypass wait-time weight in favor of trauma / specialty capability.
"""

from __future__ import annotations

from math import exp

WEIGHTS = {
    "travel": 0.28,
    "wait": 0.18,
    "beds": 0.16,
    "specialty": 0.28,
    "network": 0.10,
}

ESI1_WEIGHTS = {
    "travel": 0.35,
    "wait": 0.0,
    "beds": 0.10,
    "specialty": 0.50,
    "network": 0.05,
}

COMPLAINT_CAPABILITY = {
    "chest": {"has_cath_lab": 50, "has_icu": 20},
    "heart": {"has_cath_lab": 50, "has_icu": 20},
    "cardiac": {"has_cath_lab": 50, "has_icu": 20},
    "stroke": {"has_neurology_unit": 45, "has_icu": 15},
    "paralysis": {"has_neurology_unit": 45, "has_icu": 15},
    "trauma": {"has_trauma_center": 50, "has_icu": 15},
    "accident": {"has_trauma_center": 50, "has_icu": 15},
    "bleed": {"has_trauma_center": 35, "has_icu": 15},
    "child": {"pediatric": 40},
    "pediatric": {"pediatric": 40},
    "breath": {"has_icu": 25},
}


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def travel_score(travel_minutes: float) -> float:
    """Higher is better. 0 min → 100, ~45 min → ~37."""
    return _clamp(100 * exp(-float(travel_minutes) / 40.0))


def wait_score(wait_minutes: float, esi_level: int) -> float:
    if esi_level <= 2:
        return 100.0  # wait is irrelevant for resuscitation
    return _clamp(100 * exp(-float(wait_minutes) / 50.0))


def bed_score(available_beds: int, capacity_percent: int, divert: bool = False) -> float:
    if divert:
        return 0.0
    occupancy_penalty = _clamp(100 - float(capacity_percent))
    availability = _clamp(min(available_beds, 80) / 80 * 100)
    return 0.6 * occupancy_penalty + 0.4 * availability


def specialty_score(hospital: dict, complaint: str, esi_level: int, age: int | None = None) -> float:
    score = 20.0  # baseline capability
    text = " ".join(
        [
            complaint.lower(),
            " ".join(hospital.get("specialties") or []),
        ]
    )
    for keyword, caps in COMPLAINT_CAPABILITY.items():
        if keyword not in complaint.lower() and keyword not in text:
            continue
        for cap, points in caps.items():
            if cap == "pediatric":
                specialties = " ".join(hospital.get("specialties") or []).lower()
                if "pediatr" in specialties or (age is not None and age < 16):
                    score += points
            elif hospital.get(cap):
                score += points

    if esi_level <= 2 and hospital.get("has_icu"):
        score += 15
    if hospital.get("has_trauma_center") and esi_level == 1:
        score += 40

    score = _clamp(score)
    lowered = complaint.lower()
    if esi_level <= 2:
        if any(token in lowered for token in ("trauma", "accident", "bleed", "gunshot", "stab")):
            score = _clamp(score + 30 if hospital.get("has_trauma_center") else score - 40)
        if any(token in lowered for token in ("chest", "heart", "cardiac", "stemi")):
            score = _clamp(score + 30 if hospital.get("has_cath_lab") else score - 40)
        if any(token in lowered for token in ("stroke", "paralysis", "facial")):
            score = _clamp(score + 30 if hospital.get("has_neurology_unit") else score - 40)
    return score


def network_score(in_network: bool, esi_level: int) -> float:
    if esi_level <= 2:
        return 50.0  # network is not a factor in true emergency
    return 100.0 if in_network else 25.0


def composite_score(
    hospital: dict,
    *,
    complaint: str,
    esi_level: int,
    travel_minutes: float | None = None,
    age: int | None = None,
    in_network: bool | None = None,
) -> float:
    weights = ESI1_WEIGHTS if esi_level <= 2 else WEIGHTS
    travel = travel_minutes
    if travel is None:
        # Approximate: 3.2 minutes per km in Delhi NCR mixed traffic
        travel = float(hospital.get("distance_km") or 8) * 3.2

    wait = float(hospital.get("emergency_wait_minutes") or 20)
    available = int(hospital.get("available_beds") or 0)
    capacity = int(hospital.get("current_capacity_percent") or 80)
    divert = bool(hospital.get("ambulance_divert_status"))
    networked = True if in_network is None else in_network
    if "in_network" in hospital:
        networked = bool(hospital["in_network"])

    raw = (
        weights["travel"] * travel_score(travel)
        + weights["wait"] * wait_score(wait, esi_level)
        + weights["beds"] * bed_score(available, capacity, divert)
        + weights["specialty"] * specialty_score(hospital, complaint, esi_level, age)
        + weights["network"] * network_score(networked, esi_level)
    )
    return round(raw, 2)


def rank_hospitals(
    hospitals: list[dict],
    *,
    complaint: str,
    esi_level: int,
    travel_lookup: dict[str, float] | None = None,
    age: int | None = None,
    limit: int = 3,
) -> list[dict]:
    ranked = []
    for hospital in hospitals:
        item = dict(hospital)
        name = str(item.get("name") or "")
        travel = None
        if travel_lookup and name in travel_lookup:
            travel = travel_lookup[name]
        elif travel_lookup and str(item.get("id")) in travel_lookup:
            travel = travel_lookup[str(item["id"])]
        score = composite_score(
            item,
            complaint=complaint,
            esi_level=esi_level,
            travel_minutes=travel,
            age=age,
        )
        item["composite_match_score"] = score
        item["_score"] = score
        if travel is not None:
            item["travel_time_minutes"] = int(round(travel))
        ranked.append(item)
    ranked.sort(key=lambda h: h["composite_match_score"], reverse=True)
    return ranked[:limit]

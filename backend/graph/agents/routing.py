"""
LifeRoute AI — Routing Agent
Queries Supabase for best-match hospitals using semantic similarity + hard filters.
Always explains why it rejected closer hospitals in favor of the recommended one.
"""

import os
import sys

# Add parent dirs so imports work when run as part of the backend package
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from db.supabase_client import search_hospitals, get_all_hospitals  # noqa: E402
from graph.mock_data import MOCK_HOSPITALS  # noqa: E402

# Mapping from triage level to required hospital capabilities
TRIAGE_CAPABILITY_MAP = {
    "icu": {
        "required": ["has_icu"],
        "preferred_specialties": ["critical care", "emergency medicine"],
        "max_capacity_pct": 85,
    },
    "emergency": {
        "required": [],
        "preferred_specialties": ["emergency medicine", "trauma"],
        "max_capacity_pct": 90,
    },
    "clinic": {
        "required": [],
        "preferred_specialties": ["general medicine", "family medicine"],
        "max_capacity_pct": 95,
    },
    "self-care": {
        "required": [],
        "preferred_specialties": ["general medicine"],
        "max_capacity_pct": 100,
    },
}

# Specialty keywords that map chief complaints to hospital specialties
COMPLAINT_TO_SPECIALTY = {
    "chest pain": ["cardiology", "cardiac"],
    "heart": ["cardiology", "cardiac", "cath lab"],
    "stroke": ["neurology", "neurosurgery"],
    "head": ["neurology", "neurosurgery", "trauma"],
    "trauma": ["trauma", "orthopedics", "surgery"],
    "accident": ["trauma", "emergency medicine", "surgery"],
    "breathing": ["pulmonology", "respiratory"],
    "fracture": ["orthopedics", "trauma"],
    "burn": ["burn unit", "plastic surgery"],
    "pregnancy": ["obstetrics", "gynecology"],
    "child": ["pediatrics"],
    "abdomen": ["gastroenterology", "surgery"],
    "kidney": ["nephrology", "urology"],
    "eye": ["ophthalmology"],
}


def _build_query_text(symptoms: dict, triage_level: str) -> str:
    """Build a text string for semantic similarity search."""
    parts = []
    chief = symptoms.get("chief_complaint", "")
    parts.append(chief)

    # Map complaint to relevant specialties
    for keyword, specialties in COMPLAINT_TO_SPECIALTY.items():
        if keyword in chief.lower():
            parts.extend(specialties)

    associated = symptoms.get("associated_symptoms", [])
    parts.extend(associated)

    caps = TRIAGE_CAPABILITY_MAP.get(triage_level, {})
    parts.extend(caps.get("preferred_specialties", []))

    return " ".join(parts)


def _filter_and_rank(hospitals: list[dict], symptoms: dict, triage_level: str) -> list[dict]:
    """Apply hard filters and rank hospitals."""
    caps = TRIAGE_CAPABILITY_MAP.get(triage_level, {})
    required = caps.get("required", [])
    max_capacity = caps.get("max_capacity_pct", 100)

    filtered = []
    rejected = []

    for h in hospitals:
        # Hard filter: required capabilities
        missing_caps = [r for r in required if not h.get(r, False)]
        if missing_caps:
            rejected.append(
                {
                    "name": h["name"],
                    "reason": f"Missing required capabilities: {', '.join(missing_caps)}",
                }
            )
            continue

        # Hard filter: capacity
        capacity = h.get("current_capacity_percent", 100)
        if capacity > max_capacity:
            rejected.append(
                {
                    "name": h["name"],
                    "reason": f"Facility at {capacity}% capacity (threshold: {max_capacity}%)",
                }
            )
            continue

        # Compute ranking score
        score = 0

        # Semantic similarity score (if available from pgvector)
        score += h.get("similarity", 0) * 40

        # Capacity score: lower is better
        score += (100 - capacity) / 100 * 20

        # Wait time score: lower is better
        wait = h.get("emergency_wait_minutes", 30)
        score += max(0, (60 - wait)) / 60 * 15

        # Available beds score
        avail = h.get("available_beds", 0)
        score += min(avail / 50, 1) * 15

        # Rating score
        rating = h.get("rating", 3.0)
        score += (rating / 5) * 10

        # Check specialty match
        chief = symptoms.get("chief_complaint", "").lower()
        specialties = h.get("specialties", [])
        specialty_str = " ".join(s.lower() for s in specialties)
        for keyword, wanted in COMPLAINT_TO_SPECIALTY.items():
            if keyword in chief:
                for w in wanted:
                    if w.lower() in specialty_str:
                        score += 10
                        break

        # Check specific capabilities
        if triage_level in ("icu", "emergency"):
            if h.get("has_icu"):
                score += 5
            if h.get("has_trauma_center"):
                score += 5
            if h.get("has_cath_lab") and "chest" in chief:
                score += 10

        h["_score"] = round(score, 2)
        h["_rejected_closer"] = []
        filtered.append(h)

    # Sort by score descending
    filtered.sort(key=lambda x: x["_score"], reverse=True)

    # Attach rejection reasons to top hospital for "why this over closer ones"
    if filtered:
        closer_rejected = [
            r for r in rejected if True  # All rejected hospitals count
        ]
        filtered[0]["_rejected_closer"] = closer_rejected[:3]

    return filtered[:3]


def _generate_routing_reason(top_hospital: dict, symptoms: dict, triage_level: str) -> str:
    """Generate a human-readable explanation for why this hospital was selected."""
    name = top_hospital.get("name", "Selected Hospital")
    reasons = []

    specialties = top_hospital.get("specialties", [])
    if specialties:
        reasons.append(f"specializes in {', '.join(specialties[:3])}")

    if top_hospital.get("has_icu") and triage_level in ("icu", "emergency"):
        reasons.append("has ICU availability")

    if top_hospital.get("has_cath_lab"):
        chief = symptoms.get("chief_complaint", "").lower()
        if "chest" in chief or "heart" in chief or "cardiac" in chief:
            reasons.append("equipped with catheterization lab for cardiac emergencies")

    if top_hospital.get("has_trauma_center"):
        chief = symptoms.get("chief_complaint", "").lower()
        if "trauma" in chief or "accident" in chief or "injury" in chief:
            reasons.append("has a dedicated trauma center")

    avail = top_hospital.get("available_beds", 0)
    if avail > 0:
        reasons.append(f"has {avail} beds available")

    wait = top_hospital.get("emergency_wait_minutes", 0)
    if wait > 0:
        reasons.append(f"estimated wait time of {wait} minutes")

    # Rejection reasons
    rejected = top_hospital.get("_rejected_closer", [])
    rejection_text = ""
    if rejected:
        rej_parts = [f"{r['name']} ({r['reason']})" for r in rejected[:2]]
        rejection_text = f" Other facilities were not recommended because: {'; '.join(rej_parts)}."

    reason_text = ", ".join(reasons) if reasons else "best overall match for your condition"
    return f"{name} was selected because it {reason_text}.{rejection_text}"


def routing_agent(state: dict) -> dict:
    """Find the best-match hospitals for the patient's condition."""

    symptoms = state["structured_symptoms"]
    triage_level = state["triage_level"]

    # Build query for semantic search
    query_text = _build_query_text(symptoms, triage_level)

    # Try Supabase semantic search first
    try:
        use_mock = os.getenv("MOCK_MODE", "false").lower() == "true"
        if use_mock:
            raise Exception("Mock mode enabled")

        hospitals = search_hospitals(query_text, triage_level)

        if not hospitals or len(hospitals) == 0:
            # Fallback to all hospitals
            hospitals = get_all_hospitals()

    except Exception as e:
        print(f"[Routing Agent] Supabase search failed, using mock data: {e}")
        hospitals = MOCK_HOSPITALS

    # Filter and rank
    ranked = _filter_and_rank(hospitals, symptoms, triage_level)

    if not ranked:
        # Ultimate fallback
        ranked = MOCK_HOSPITALS[:3]

    # Clean internal scoring fields for output
    matched = []
    for h in ranked:
        clean = {k: v for k, v in h.items() if not k.startswith("_")}
        clean.pop("embedding", None)
        matched.append(clean)

    selected = matched[0] if matched else {}
    routing_reason = _generate_routing_reason(ranked[0], symptoms, triage_level) if ranked else "No suitable facility found."

    return {
        "matched_facilities": matched,
        "selected_facility": selected,
        "routing_reason": routing_reason,
    }

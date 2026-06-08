"""
Enrich hospital records with coordinates, ambulance fleet, and review metadata.
Used by /hospitals and navigation responses for the frontend UI.
"""

# Approximate coordinates for Delhi NCR hospitals (demo)
HOSPITAL_COORDS = {
    "AIIMS Trauma Centre": (28.5672, 77.2100),
    "Fortis Escorts Heart Institute": (28.5621, 77.2754),
    "Max Super Speciality Hospital": (28.5276, 77.2190),
    "Sir Ganga Ram Hospital": (28.6389, 77.1895),
    "Safdarjung Hospital": (28.5665, 77.2075),
    "Medanta - The Medicity": (28.4392, 77.0415),
    "Artemis Hospital": (28.4215, 77.0712),
    "Fortis Memorial Research Institute": (28.4501, 77.0823),
    "Paras Hospital": (28.4134, 77.0489),
    "Columbia Asia Hospital": (28.4598, 77.0265),
    "Jaypee Hospital": (28.3521, 77.3278),
    "Fortis Hospital Noida": (28.6245, 77.3641),
    "Max Super Speciality Hospital Noida": (28.5842, 77.3265),
    "Yatharth Super Speciality Hospital": (28.5356, 77.3910),
    "Kailash Hospital & Heart Institute": (28.5789, 77.3312),
}

DEFAULT_COORD = (28.6139, 77.2090)


def enrich_hospital(hospital: dict) -> dict:
    """Add UI fields without mutating the original."""
    h = dict(hospital)
    name = h.get("name", "")
    hid = h.get("id") or hash(name) % 1000

    lat, lng = HOSPITAL_COORDS.get(name, DEFAULT_COORD)
    h["lat"] = lat
    h["lng"] = lng

    # Deterministic demo fleet data from hospital id
    base = int(hid) if isinstance(hid, int) else abs(hid) % 100
    h["ambulances_available"] = max(1, (base % 6) + 2)
    h["ambulances_total"] = h["ambulances_available"] + (base % 3) + 1
    h["ambulance_eta_minutes"] = max(5, h.get("emergency_wait_minutes", 15) // 2)
    h["review_count"] = 800 + (base * 137) % 4200
    h["maps_url"] = f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
    h["embed_maps_url"] = (
        f"https://maps.google.com/maps?q={lat},{lng}&z=14&output=embed"
    )

    return h


def enrich_hospitals(hospitals: list[dict]) -> list[dict]:
    return [enrich_hospital(h) for h in hospitals]

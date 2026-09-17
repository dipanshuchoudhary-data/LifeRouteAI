from graph.scoring import bed_score, composite_score, rank_hospitals, travel_score, wait_score


CATH_HOSPITAL = {
    "name": "Fortis Escorts Heart Institute",
    "distance_km": 6.5,
    "specialties": ["cardiology", "cardiac surgery"],
    "has_icu": True,
    "has_cath_lab": True,
    "has_trauma_center": False,
    "has_neurology_unit": False,
    "available_beds": 55,
    "current_capacity_percent": 82,
    "emergency_wait_minutes": 10,
    "in_network": True,
}

TRAUMA_HOSPITAL = {
    "name": "AIIMS Trauma Centre",
    "distance_km": 8.2,
    "specialties": ["trauma", "neurosurgery"],
    "has_icu": True,
    "has_cath_lab": False,
    "has_trauma_center": True,
    "has_neurology_unit": True,
    "available_beds": 42,
    "current_capacity_percent": 88,
    "emergency_wait_minutes": 15,
    "in_network": True,
}

CLINIC_HOSPITAL = {
    "name": "Neighborhood Clinic",
    "distance_km": 2.0,
    "specialties": ["general medicine"],
    "has_icu": False,
    "has_cath_lab": False,
    "has_trauma_center": False,
    "has_neurology_unit": False,
    "available_beds": 8,
    "current_capacity_percent": 60,
    "emergency_wait_minutes": 5,
    "in_network": False,
}


def test_travel_score_decreases_with_time():
    assert travel_score(5) > travel_score(40)


def test_wait_score_bypassed_for_esi1():
    assert wait_score(90, esi_level=1) == 100.0
    assert wait_score(5, esi_level=4) > wait_score(60, esi_level=4)


def test_divert_zeros_bed_score():
    assert bed_score(10, 50, divert=True) == 0.0


def test_stemi_prefers_cath_lab():
    cardiac = composite_score(CATH_HOSPITAL, complaint="chest pain", esi_level=1)
    trauma = composite_score(TRAUMA_HOSPITAL, complaint="chest pain", esi_level=1)
    assert cardiac > trauma


def test_trauma_prefers_trauma_center():
    trauma = composite_score(TRAUMA_HOSPITAL, complaint="road accident trauma", esi_level=1)
    cardiac = composite_score(CATH_HOSPITAL, complaint="road accident trauma", esi_level=1)
    assert trauma > cardiac


def test_rank_hospitals_limit_and_score_field():
    ranked = rank_hospitals(
        [CLINIC_HOSPITAL, CATH_HOSPITAL, TRAUMA_HOSPITAL],
        complaint="chest pain heart",
        esi_level=1,
        limit=2,
    )
    assert len(ranked) == 2
    assert ranked[0]["name"] == "Fortis Escorts Heart Institute"
    assert ranked[0]["composite_match_score"] >= ranked[1]["composite_match_score"]


def test_network_matters_only_for_non_emergent():
    in_net = dict(CLINIC_HOSPITAL, in_network=True)
    out_net = dict(CLINIC_HOSPITAL, in_network=False)
    assert composite_score(in_net, complaint="fever", esi_level=5) > composite_score(out_net, complaint="fever", esi_level=5)

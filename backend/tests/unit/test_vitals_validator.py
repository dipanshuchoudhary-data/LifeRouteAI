from graph.agents.vitals_validator import validate_vitals, vitals_suggest_emergency, VitalSigns


def test_accepts_in_range_vitals():
    clean, warnings = validate_vitals(
        {"heart_rate": 88, "systolic_bp": 120, "diastolic_bp": 80, "oxygen_saturation": 97, "temperature_f": 98.6, "respiratory_rate": 16}
    )
    assert warnings == []
    assert clean["heart_rate"] == 88
    assert clean["oxygen_saturation"] == 97


def test_drops_out_of_range_heart_rate():
    clean, warnings = validate_vitals({"heart_rate": 400})
    assert "heart_rate" not in clean
    assert warnings


def test_drops_impossible_spo2():
    clean, warnings = validate_vitals({"oxygen_saturation": 12})
    assert "oxygen_saturation" not in clean
    assert warnings


def test_diastolic_cannot_exceed_systolic():
    clean, warnings = validate_vitals({"systolic_bp": 90, "diastolic_bp": 110})
    assert clean["systolic_bp"] == 90
    assert "diastolic_bp" not in clean
    assert warnings


def test_empty_values_are_ignored():
    clean, warnings = validate_vitals({"heart_rate": None, "systolic_bp": "", "oxygen_saturation": "null"})
    assert clean == {}
    assert warnings == []


def test_model_bounds():
    VitalSigns(heart_rate=30, systolic_bp=50, oxygen_saturation=50, temperature_f=90, respiratory_rate=6)
    VitalSigns(heart_rate=250, systolic_bp=260, oxygen_saturation=100, temperature_f=108, respiratory_rate=60)


def test_critical_overrides():
    assert vitals_suggest_emergency({"heart_rate": 32})
    assert vitals_suggest_emergency({"oxygen_saturation": 80})
    assert vitals_suggest_emergency({"systolic_bp": 70})
    assert vitals_suggest_emergency({"respiratory_rate": 6})
    assert vitals_suggest_emergency({"temperature_f": 107})
    assert vitals_suggest_emergency({"heart_rate": 80}) is None

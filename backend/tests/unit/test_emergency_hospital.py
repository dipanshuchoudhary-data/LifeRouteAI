from app.services.emergency_service import choose_hospital_name


def test_provided_hospital_skips_router(monkeypatch):
    def boom(*_args, **_kwargs):
        raise AssertionError("hospital router should not run again")

    monkeypatch.setattr("app.services.emergency_service._sync_hospital", boom)
    assert choose_hospital_name("I need help", {"lat": 28.6, "lng": 77.2}, "AIIMS Trauma") == "AIIMS Trauma"


def test_empty_hospital_uses_router(monkeypatch):
    monkeypatch.setattr("app.services.emergency_service._sync_hospital", lambda *_args, **_kwargs: "Safdarjung")
    assert choose_hospital_name("I need help", {"lat": 28.6, "lng": 77.2}, "  ") == "Safdarjung"

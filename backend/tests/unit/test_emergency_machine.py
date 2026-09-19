from app.core.exceptions import ValidationException
from app.domain.emergency.machine import EmergencyState, EmergencyStateMachine
from app.domain.emergency.passport import build_health_passport


class FakeUser:
    name = "Mr. Sharma"
    blood_type = "B+"
    allergies_json = '[{"substance": "Penicillin"}]'
    conditions_json = '[{"name": "Hypertension"}]'
    medications_json = '[{"name": "Amlodipine", "dose": "5 mg"}]'


class FakeContact:
    name = "Priya"
    relation = "Daughter"
    phone = "98100"
    can_emergency = True


def test_standard_path_notifies_family():
    machine = EmergencyStateMachine()
    trail = machine.run_standard_path(notify_family=True)
    assert trail[-1] is EmergencyState.ASSISTANCE_ACTIVE
    assert EmergencyState.FAMILY_NOTIFIED in trail


def test_standard_path_can_skip_family():
    machine = EmergencyStateMachine()
    trail = machine.run_standard_path(notify_family=False)
    assert EmergencyState.FAMILY_NOTIFIED not in trail
    assert machine.state is EmergencyState.ASSISTANCE_ACTIVE


def test_llm_cannot_jump_to_resolved_from_normal():
    machine = EmergencyStateMachine()
    try:
        machine.move(EmergencyState.RESOLVED)
        assert False, "expected invalid transition"
    except ValidationException:
        assert machine.state is EmergencyState.NORMAL


def test_passport_is_concise():
    card = build_health_passport(FakeUser(), contacts=[FakeContact()], location={"lat": 1, "lng": 2})
    assert card["name"] == "Mr. Sharma"
    assert card["blood_group"] == "B+"
    assert "Penicillin" in card["allergies"]
    assert card["emergency_contact"]["name"] == "Priya"
    assert "full_chart" not in card

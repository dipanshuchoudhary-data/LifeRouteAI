from fastapi.testclient import TestClient

from app.infrastructure.database.session import init_db
from main import app

init_db()
client = TestClient(app)


def _session():
    response = client.post("/api/v1/auth/demo")
    assert response.status_code == 200
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_demo_session_and_me():
    headers = _session()
    me = client.get("api/v1/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["id"]


def test_today_is_owned_lookup():
    headers = _session()
    today = client.get("/api/v1/sathi/today", headers=headers)
    assert today.status_code == 200
    assert "items" in today.json()


def test_family_notify_requires_confirm():
    headers = _session()
    denied = client.post(
        "/api/v1/family/messages",
        headers=headers,
        json={"contact_id": "demo-priya", "message": "I am home", "confirm": False},
    )
    assert denied.status_code == 403
    ok = client.post(
        "/api/v1/family/messages",
        headers=headers,
        json={"contact_id": "demo-priya", "message": "I am home", "confirm": True},
    )
    assert ok.status_code == 200
    body = ok.json()
    assert body["simulated"] is True
    assert "family" in body["notice"].lower()


def test_emergency_state_machine_and_ownership():
    headers = _session()
    created = client.post("/api/v1/emergency", headers=headers, json={"input": "I need help", "confirm": True})
    assert created.status_code == 200
    body = created.json()
    assert body["state"] == "ASSISTANCE_ACTIVE"
    assert body["actions"]["ambulance_dispatched"] is False
    assert body["passport"]["name"]
    stolen = client.get("/api/v1/emergency/not-your-case", headers=headers)
    assert stolen.status_code == 404
    resolved = client.post(f"/api/v1/emergency/{body['id']}/resolve", headers=headers)
    assert resolved.status_code == 200
    assert resolved.json()["state"] == "RESOLVED"


def test_chat_appointment_does_not_require_auth_leak():
    denied = client.post("/api/v1/sathi/chat", json={"message": "What do I have today?"})
    assert denied.status_code == 403


def test_safe_error_shape():
    headers = _session()
    response = client.post(
        "/api/v1/sathi/explain",
        headers=headers,
        json={"image_base64": "not-a-real-image-payload-at-all", "mime": "image/jpeg"},
    )
    assert response.status_code in {400, 502}
    payload = response.json()
    text = str(payload)
    assert "sqlalchemy" not in text.lower()
    assert "traceback" not in text.lower()

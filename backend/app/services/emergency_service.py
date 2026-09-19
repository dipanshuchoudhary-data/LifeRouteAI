"""Emergency use-case logic. State changes stay in the machine."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.constants import DEMO_NOTICE
from app.core.exceptions import NotFoundException
from app.domain.emergency.machine import EmergencyState, EmergencyStateMachine
from app.domain.emergency.passport import build_health_passport
from app.infrastructure.database.models import EmergencyCase
from app.infrastructure.notifications import get_notification_provider
from app.infrastructure.repositories import CompanionRepository, EmergencyRepository
from app.security.authentication import CurrentUser
from app.security.consent import ConsentAction, record_consent
from app.security.permissions import require_emergency_permission
from app.security.sanitization import clean_text


def _now() -> datetime:
    return datetime.now(timezone.utc)


def start_emergency(
    db: Session,
    user: CurrentUser,
    *,
    text: str,
    source: str = "senior",
    requested_by: str = "",
    lat: float = 28.6139,
    lng: float = 77.209,
    notify_family: bool = True,
    confirm: bool = True,
    hospital_name: str = "",
) -> dict:
    require_emergency_permission(user)
    if confirm:
        record_consent(db, user.id, ConsentAction.EMERGENCY, True)

    companion = CompanionRepository(db)
    record = companion.get_user(user.id)
    contacts = companion.contacts(user.id)
    location = {"lat": lat, "lng": lng}
    passport = build_health_passport(record, contacts=contacts, location=location) if record else {}

    machine = EmergencyStateMachine()
    machine.run_standard_path(notify_family=notify_family and bool(contacts))

    summary = clean_text(text, limit=240) or "Help requested"
    hospital_name = choose_hospital_name(text, location, hospital_name)

    family_notice = None
    if notify_family and contacts:
        person = next((row for row in contacts if row.can_emergency), contacts[0])
        family_notice = get_notification_provider().notify_family(
            recipient=person.name,
            message="Emergency help was requested.",
        )
        companion.add_message(
            user.id,
            contact_id=person.id,
            to_name=person.name,
            text="Emergency request prepared. Family notification simulated in this demo.",
        )

    case = EmergencyCase(
        user_id=user.id,
        state=machine.state.value,
        source=source,
        raw_input=clean_text(text, limit=500),
        summary=summary,
        lat=lat,
        lng=lng,
        passport_json=json.dumps(passport),
        hospital_name=hospital_name,
    )
    EmergencyRepository(db).save(case)
    return public_emergency(case, family_notice=family_notice, requested_by=requested_by)


def choose_hospital_name(text: str, location: dict, provided: str = "") -> str:
    """Reuse a hospital already chosen by the SOS pipeline. Do not route twice."""
    if (provided or "").strip():
        return provided.strip()
    return _sync_hospital(text, location)


def _sync_hospital(text: str, location: dict) -> str:
    try:
        from graph.agents.emergency_fast_track import emergency_fast_track_agent

        result = emergency_fast_track_agent({
            "raw_input": text,
            "emergency_trigger_reason": "SOS",
            "location": location,
        })
        return (result.get("selected_facility") or {}).get("name") or ""
    except Exception:
        return ""


def resolve_emergency(db: Session, user: CurrentUser, emergency_id: str) -> dict:
    repo = EmergencyRepository(db)
    case = repo.get(emergency_id)
    if case is None or case.user_id != user.id:
        raise NotFoundException("Emergency request not found.")
    machine = EmergencyStateMachine(case.state)
    if machine.state != EmergencyState.RESOLVED:
        machine.move(EmergencyState.RESOLVED)
    case.state = machine.state.value
    case.resolved_at = _now()
    case.updated_at = _now()
    repo.save(case)
    return public_emergency(case)


def get_emergency(db: Session, user: CurrentUser, emergency_id: str | None = None) -> dict | None:
    repo = EmergencyRepository(db)
    case = repo.get(emergency_id) if emergency_id else repo.active_for(user.id)
    if case is None:
        if emergency_id:
            raise NotFoundException("Emergency request not found.")
        return None
    if case.user_id != user.id:
        raise NotFoundException("Emergency request not found.")
    return public_emergency(case)


def public_emergency(case: EmergencyCase, family_notice=None, requested_by: str = "") -> dict:
    try:
        passport = json.loads(case.passport_json or "{}")
    except json.JSONDecodeError:
        passport = {}
    return {
        "id": case.id,
        "state": case.state,
        "summary": case.summary,
        "passport": passport,
        "recommended_hospital": case.hospital_name or None,
        "location": {"lat": case.lat, "lng": case.lng},
        "source": case.source,
        "requested_by": requested_by,
        "notice": DEMO_NOTICE,
        "family_notification": {
            "simulated": True,
            "message": family_notice.message if family_notice else "Family notification simulated in this demo.",
        } if case.state in {"FAMILY_NOTIFIED", "ASSISTANCE_ACTIVE", "RESOLVED"} else None,
        "actions": {
            "call_108": True,
            "ambulance_dispatched": False,
        },
    }

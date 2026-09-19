"""Explicit consent records for high-impact actions."""

from __future__ import annotations

from enum import Enum

from sqlalchemy.orm import Session

from app.core.exceptions import AuthorizationException
from app.infrastructure.database.models import Consent


class ConsentAction(str, Enum):
    NOTIFY_FAMILY = "notify_family"
    SHARE_HEALTH = "share_health"
    CALL_FAMILY = "call_family"
    EMERGENCY = "emergency"


def record_consent(db: Session, user_id: str, action: ConsentAction, granted: bool) -> Consent:
    row = Consent(user_id=user_id, action=action.value, granted=granted)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def require_consent(db: Session, user_id: str, action: ConsentAction, confirmed: bool) -> Consent:
    if not confirmed:
        raise AuthorizationException("Please confirm before Sathi does this.")
    return record_consent(db, user_id, action, True)

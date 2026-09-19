"""Device-session authentication. Identity comes from the server, never the client."""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AuthorizationException
from app.infrastructure.database.models import AuthSession, User
from app.infrastructure.repositories import CompanionRepository


@dataclass(frozen=True)
class CurrentUser:
    id: str
    name: str
    role: str


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_demo_session(db: Session) -> tuple[str, CurrentUser]:
    repo = CompanionRepository(db)
    user = repo.ensure_demo_user()
    token = secrets.token_urlsafe(32)
    expires = _utcnow() + timedelta(hours=settings.session_hours)
    db.add(AuthSession(token=token, user_id=user.id, expires_at=expires))
    db.commit()
    return token, CurrentUser(id=user.id, name=user.name, role=user.role)


def resolve_session(db: Session, token: str | None) -> CurrentUser:
    if not token:
        raise AuthorizationException("Please start a session first.")
    row = db.get(AuthSession, token)
    if row is None:
        raise AuthorizationException("Your session is not valid.")
    expires = row.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < _utcnow():
        raise AuthorizationException("Your session has expired.")
    user = db.get(User, row.user_id)
    if user is None:
        raise AuthorizationException("Your session is not valid.")
    return CurrentUser(id=user.id, name=user.name, role=user.role)

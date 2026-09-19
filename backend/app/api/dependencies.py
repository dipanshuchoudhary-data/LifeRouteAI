from __future__ import annotations

from fastapi import Depends, Header, Request
from sqlalchemy.orm import Session

from app.core.exceptions import AuthorizationException
from app.infrastructure.database.session import get_db
from app.security.authentication import CurrentUser, resolve_session
from app.security.rate_limit import enforce_rate_limit


def _token_from_headers(authorization: str | None, x_sathi_session: str | None) -> str | None:
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    return token or x_sathi_session


def get_current_user(
    authorization: str | None = Header(default=None),
    x_sathi_session: str | None = Header(default=None, alias="X-Sathi-Session"),
    db: Session = Depends(get_db),
) -> CurrentUser:
    return resolve_session(db, _token_from_headers(authorization, x_sathi_session))


def get_optional_user(
    authorization: str | None = Header(default=None),
    x_sathi_session: str | None = Header(default=None, alias="X-Sathi-Session"),
    db: Session = Depends(get_db),
) -> CurrentUser | None:
    token = _token_from_headers(authorization, x_sathi_session)
    if not token:
        return None
    try:
        return resolve_session(db, token)
    except AuthorizationException:
        return None


def require_rate_limit(request: Request) -> None:
    enforce_rate_limit(request)

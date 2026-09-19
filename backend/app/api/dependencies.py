from __future__ import annotations

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.infrastructure.database.session import get_db
from app.security.authentication import CurrentUser, resolve_session


def get_current_user(
    authorization: str | None = Header(default=None),
    x_sathi_session: str | None = Header(default=None, alias="X-Sathi-Session"),
    db: Session = Depends(get_db),
) -> CurrentUser:
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    token = token or x_sathi_session
    return resolve_session(db, token)

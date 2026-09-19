"""Ownership checks. Never trust a client-supplied user_id."""

from __future__ import annotations

from app.core.exceptions import AuthorizationException, NotFoundException
from app.security.authentication import CurrentUser


def require_owner(user: CurrentUser, owner_id: str | None, *, missing: str = "Not found.") -> None:
    if not owner_id:
        raise NotFoundException(missing)
    if owner_id != user.id:
        raise AuthorizationException("You can only use your own information.")

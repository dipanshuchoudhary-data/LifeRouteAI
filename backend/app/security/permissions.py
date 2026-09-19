"""Small role map. Seniors and family are not interchangeable."""

from __future__ import annotations

from app.core.exceptions import AuthorizationException
from app.security.authentication import CurrentUser

ROLE_SENIOR = "senior"
ROLE_FAMILY = "family"
ROLE_DEMO = "demo"


def can_trigger_emergency(user: CurrentUser) -> bool:
    return user.role in {ROLE_SENIOR, ROLE_FAMILY, ROLE_DEMO}


def require_emergency_permission(user: CurrentUser) -> None:
    if not can_trigger_emergency(user):
        raise AuthorizationException("Emergency help is not available for this account.")

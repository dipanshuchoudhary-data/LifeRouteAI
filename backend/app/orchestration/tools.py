"""Controlled tool registry. The model proposes a name; the backend decides."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.orm import Session

from app.core.exceptions import ValidationException
from app.infrastructure.repositories import CompanionRepository
from app.security.authentication import CurrentUser
from app.security.consent import ConsentAction, require_consent
from app.security.permissions import require_emergency_permission


class EmptyArgs(BaseModel):
    pass


class RememberArgs(BaseModel):
    text: str = Field(..., min_length=1, max_length=400)


class NotifyFamilyArgs(BaseModel):
    contact_id: str = ""
    message: str = Field(..., min_length=1, max_length=400)
    confirm: bool = False


class EmergencyArgs(BaseModel):
    input: str = Field(default="I need help", max_length=400)
    confirm: bool = True


@dataclass(frozen=True)
class ToolSpec:
    name: str
    description: str
    args_model: type[BaseModel]
    requires_consent: ConsentAction | None
    handler: Callable[..., dict[str, Any]]


def _todays_tasks(db: Session, user: CurrentUser, _args: EmptyArgs) -> dict[str, Any]:
    repo = CompanionRepository(db)
    rows = repo.tasks_for_day(user.id)
    return {
        "items": [{"title": row.title, "time": row.time, "kind": row.kind, "done": row.done} for row in rows],
        "source": "database",
    }


def _health_summary(db: Session, user: CurrentUser, _args: EmptyArgs) -> dict[str, Any]:
    repo = CompanionRepository(db)
    record = repo.get_user(user.id)
    if record is None:
        raise ValidationException("Profile not found.")
    import json

    return {
        "medications": [row.get("name") for row in json.loads(record.medications_json or "[]")],
        "conditions": [row.get("name") for row in json.loads(record.conditions_json or "[]")],
        "allergies": [row.get("substance") for row in json.loads(record.allergies_json or "[]")],
        "disclaimer": "This is saved information, not a diagnosis.",
        "source": "database",
    }


def _remember(db: Session, user: CurrentUser, args: RememberArgs) -> dict[str, Any]:
    repo = CompanionRepository(db)
    note = repo.add_memory(user.id, args.text)
    return {"saved": True, "text": note.text, "source": "database"}


def _family_contacts(db: Session, user: CurrentUser, _args: EmptyArgs) -> dict[str, Any]:
    repo = CompanionRepository(db)
    return {
        "contacts": [{"id": row.id, "name": row.name, "relation": row.relation} for row in repo.contacts(user.id)],
        "source": "database",
    }


def _notify_family(db: Session, user: CurrentUser, args: NotifyFamilyArgs) -> dict[str, Any]:
    from app.services.family_service import notify_family

    return notify_family(db, user, contact_id=args.contact_id, message=args.message, confirm=args.confirm)


def _trigger_emergency(db: Session, user: CurrentUser, args: EmergencyArgs) -> dict[str, Any]:
    require_emergency_permission(user)
    from app.services.emergency_service import start_emergency

    return start_emergency(db, user, text=args.input, source="assistant", notify_family=True, confirm=args.confirm)


REGISTRY: dict[str, ToolSpec] = {
    "get_todays_tasks": ToolSpec("get_todays_tasks", "Today's saved appointments and reminders", EmptyArgs, None, _todays_tasks),
    "get_health_summary": ToolSpec("get_health_summary", "Saved medicines, conditions, allergies", EmptyArgs, None, _health_summary),
    "remember_note": ToolSpec("remember_note", "Save a personal note", RememberArgs, None, _remember),
    "list_family": ToolSpec("list_family", "Trusted family names", EmptyArgs, None, _family_contacts),
    "notify_family": ToolSpec("notify_family", "Simulate a family message after confirmation", NotifyFamilyArgs, ConsentAction.NOTIFY_FAMILY, _notify_family),
    "trigger_emergency": ToolSpec("trigger_emergency", "Start the emergency state machine", EmergencyArgs, ConsentAction.EMERGENCY, _trigger_emergency),
}


def execute_tool(db: Session, user: CurrentUser, name: str, raw_args: dict[str, Any] | None = None) -> dict[str, Any]:
    spec = REGISTRY.get(name)
    if spec is None:
        raise ValidationException("That action is not available.")
    try:
        args = spec.args_model.model_validate(raw_args or {})
    except ValidationError as exc:
        raise ValidationException("That action could not be understood.") from exc
    if spec.requires_consent is not None:
        confirmed = bool(getattr(args, "confirm", False))
        require_consent(db, user.id, spec.requires_consent, confirmed)
    return spec.handler(db, user, args)


def authorized_tool_names() -> list[str]:
    return list(REGISTRY)

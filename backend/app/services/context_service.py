"""Select only the facts a turn needs. Never send the whole record to the model."""

from __future__ import annotations

import json
from typing import Any

from app.infrastructure.database.models import User
from app.infrastructure.repositories import CompanionRepository

INTENT_FIELDS = {
    "appointment": ("name", "tasks"),
    "day": ("name", "tasks"),
    "health": ("name", "medications", "conditions", "allergies"),
    "family": ("name", "family_names"),
    "memory": ("name", "memories"),
    "food": ("name", "conditions", "meals"),
    "explain": ("name",),
    "help": ("name",),
    "talk": ("name", "city"),
    "emergency": ("name", "blood_type", "allergies", "conditions", "medications", "family_names"),
}


def select_context(repo: CompanionRepository, user: User, intent: str) -> dict[str, Any]:
    wanted = INTENT_FIELDS.get(intent, INTENT_FIELDS["talk"])
    ctx: dict[str, Any] = {}
    if "name" in wanted:
        ctx["name"] = user.name
    if "city" in wanted:
        ctx["city"] = user.city
    if "blood_type" in wanted:
        ctx["blood_type"] = user.blood_type
    if "allergies" in wanted:
        ctx["allergies"] = [row.get("substance") for row in json.loads(user.allergies_json or "[]") if row.get("substance")]
    if "conditions" in wanted:
        ctx["conditions"] = [row.get("name") for row in json.loads(user.conditions_json or "[]") if row.get("name")]
    if "medications" in wanted:
        ctx["medications"] = [row.get("name") for row in json.loads(user.medications_json or "[]") if row.get("name")]
    if "tasks" in wanted:
        ctx["today"] = [f"{row.time} {row.title}".strip() for row in repo.tasks_for_day(user.id)]
    if "memories" in wanted:
        ctx["memories"] = [row.text for row in repo.memories(user.id, limit=6)]
    if "family_names" in wanted:
        ctx["family"] = [{"name": row.name, "relation": row.relation} for row in repo.contacts(user.id)]
    if "meals" in wanted:
        ctx["meals"] = {"note": "Use simple Indian home food. Estimates only."}
    return ctx

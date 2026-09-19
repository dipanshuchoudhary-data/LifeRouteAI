"""Concise emergency profile — never a full chart dump."""

from __future__ import annotations

import json
from typing import Any


def _names(items: list[Any], key: str) -> list[str]:
    out: list[str] = []
    for item in items or []:
        if isinstance(item, dict):
            value = item.get(key) or item.get("substance") or item.get("name")
        else:
            value = str(item)
        if value:
            out.append(str(value))
    return out[:6]


def build_health_passport(user: Any, *, contacts: list[Any], location: dict | None = None) -> dict:
    allergies = json.loads(getattr(user, "allergies_json", "[]") or "[]")
    conditions = json.loads(getattr(user, "conditions_json", "[]") or "[]")
    medications = json.loads(getattr(user, "medications_json", "[]") or "[]")
    emergency_contact = next((c for c in contacts if getattr(c, "can_emergency", True)), contacts[0] if contacts else None)
    return {
        "name": getattr(user, "name", ""),
        "blood_group": getattr(user, "blood_type", "") or None,
        "allergies": _names(allergies, "substance"),
        "important_conditions": _names(conditions, "name"),
        "current_medications": [
            f"{item.get('name', '')} {item.get('dose', '')}".strip()
            for item in medications[:4]
            if isinstance(item, dict) and item.get("name")
        ],
        "emergency_contact": {
            "name": getattr(emergency_contact, "name", ""),
            "relation": getattr(emergency_contact, "relation", ""),
            "phone": getattr(emergency_contact, "phone", ""),
        } if emergency_contact else None,
        "current_location": location or {},
    }

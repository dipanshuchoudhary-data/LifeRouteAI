"""In-memory clinical session + audit ledger (Supabase optional)."""

from __future__ import annotations

import hashlib
import threading
import uuid
from datetime import datetime, timezone

_LOCK = threading.Lock()
_SESSIONS: dict[str, dict] = {}
_AUDIT: list[dict] = []


def new_session_id() -> str:
    return str(uuid.uuid4())


def digest_text(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8", errors="ignore")).hexdigest()


def persist_session(state: dict) -> str:
    session_id = state.get("session_id") or new_session_id()
    record = {
        "id": session_id,
        "session_token": session_id,
        "triage_esi_level": state.get("esi_level"),
        "urgency_category": state.get("urgency_category"),
        "is_emergency": bool(state.get("is_emergency")),
        "assigned_hospital": (state.get("selected_facility") or {}).get("name"),
        "input_digest": state.get("input_hash") or digest_text(state.get("raw_input") or ""),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        # Never store raw PHI in the in-memory ledger — digest only.
        "encrypted_patient_data": None,
    }
    with _LOCK:
        _SESSIONS[session_id] = record
    return session_id


def append_audit(session_id: str, event_type: str, agent_name: str, input_digest: str, output_summary: dict, model_metadata: dict | None = None) -> None:
    entry = {
        "session_id": session_id,
        "event_type": event_type,
        "agent_name": agent_name,
        "input_digest": input_digest,
        "output_summary": output_summary,
        "model_metadata": model_metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    with _LOCK:
        _AUDIT.append(entry)
        if len(_AUDIT) > 5000:
            del _AUDIT[:1000]


def get_session(session_id: str) -> dict | None:
    with _LOCK:
        return _SESSIONS.get(session_id)


def list_audit(session_id: str | None = None) -> list[dict]:
    with _LOCK:
        if session_id:
            return [row for row in _AUDIT if row["session_id"] == session_id]
        return list(_AUDIT[-100:])

"""Structured logging without secrets or health-record dumps."""

from __future__ import annotations

import json
import logging
import time
from typing import Any

_SAFE_KEYS = frozenset({
    "request_id", "operation", "latency_ms", "status", "error_category",
    "provider", "model", "workflow", "node", "success", "user_id",
    "intent", "tool", "emergency_state", "token_usage",
})
_REDACT = frozenset({
    "password", "token", "api_key", "authorization", "secret", "cookie",
    "llm_api_key", "openrouter",
})


def get_logger(name: str = "sathi") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(message)s"))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger


def safe_log(operation: str, **fields: Any) -> None:
    payload: dict[str, Any] = {"operation": operation, "ts": int(time.time())}
    for key, value in fields.items():
        lowered = key.lower()
        if any(part in lowered for part in _REDACT):
            continue
        if key in _SAFE_KEYS or key.endswith("_ms") or key.endswith("_count"):
            payload[key] = value
    get_logger().info(json.dumps(payload, default=str))

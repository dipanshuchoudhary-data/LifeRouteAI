"""Shared in-process rate limit. One bucket per IP across v1 and v2."""

from __future__ import annotations

import time

from fastapi import HTTPException, Request

_RATE: dict[str, list[float]] = {}
_RATE_LIMIT = 30
_RATE_WINDOW = 60.0


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(request: Request) -> None:
    ip = client_ip(request)
    now = time.time()
    bucket = [stamp for stamp in _RATE.get(ip, []) if now - stamp < _RATE_WINDOW]
    if len(bucket) >= _RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")
    bucket.append(now)
    _RATE[ip] = bucket


def reset_rate_limit() -> None:
    _RATE.clear()

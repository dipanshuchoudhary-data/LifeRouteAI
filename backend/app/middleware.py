from __future__ import annotations

import time
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.constants import SAFE_ERROR
from app.core.exceptions import DomainException
from app.core.logging import safe_log


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
        request.state.request_id = request_id
        started = time.perf_counter()
        response = await call_next(request)
        latency = round((time.perf_counter() - started) * 1000, 2)
        response.headers["X-Request-Id"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(self), microphone=(self), geolocation=(self)"
        safe_log(
            "http",
            request_id=request_id,
            status=response.status_code,
            latency_ms=latency,
        )
        return response


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainException)
    async def domain_handler(request: Request, exc: DomainException):
        safe_log(
            "domain_error",
            request_id=getattr(request.state, "request_id", ""),
            error_category=exc.code,
            status=exc.status_code,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message, "code": exc.code},
        )

    @app.exception_handler(Exception)
    async def unknown_handler(request: Request, exc: Exception):
        if isinstance(exc, (HTTPException, StarletteHTTPException, DomainException)):
            raise exc
        safe_log(
            "unhandled_error",
            request_id=getattr(request.state, "request_id", ""),
            error_category=type(exc).__name__,
            status=500,
        )
        return JSONResponse(status_code=500, content={"error": SAFE_ERROR, "code": "internal_error"})

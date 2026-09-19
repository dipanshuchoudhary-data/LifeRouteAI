"""Environment-backed settings. Secrets never live in source."""

from __future__ import annotations

import os
from functools import lru_cache


def _bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    app_name: str
    database_url: str
    session_hours: int
    demo_auth_enabled: bool
    max_upload_bytes: int
    max_request_bytes: int
    cors_origins: list[str]
    mock_mode: bool

    def __init__(self) -> None:
        self.app_name = os.getenv("LLM_APP_NAME", "Sathi AI")
        default_db = "sqlite:///./data/sathi.db"
        self.database_url = os.getenv("DATABASE_URL", default_db).strip() or default_db
        self.session_hours = int(os.getenv("SATHI_SESSION_HOURS", "72"))
        self.demo_auth_enabled = _bool("SATHI_DEMO_AUTH", True)
        self.max_upload_bytes = int(os.getenv("SATHI_MAX_UPLOAD_BYTES", str(12_000_000)))
        self.max_request_bytes = int(os.getenv("SATHI_MAX_REQUEST_BYTES", str(16_000_000)))
        extra = os.getenv("CORS_ORIGINS", "")
        origins = [
            os.getenv("FRONTEND_URL", "http://localhost:5173"),
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost",
            "http://127.0.0.1",
        ]
        origins.extend(item.strip() for item in extra.split(",") if item.strip())
        self.cors_origins = list(dict.fromkeys(origins))
        self.mock_mode = _bool("MOCK_MODE", False)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

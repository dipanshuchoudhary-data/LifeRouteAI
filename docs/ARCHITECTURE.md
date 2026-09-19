# Sathi AI architecture

Sathi is a **modular monolith**. LifeRoute hospital matching stays in `backend/graph/`. Companion identity, consent, tools, and the emergency policy live in `backend/app/`.

```
Frontend (React)
    ↓
API / Presentation   backend/main.py + app/api + api/v2
    ↓
Application          app/application/use_cases.py
    ↓
AI orchestration     app/orchestration + graph/pipeline.py
    ↓
Domain               app/domain/emergency
    ↓
Services             context, family, emergency, notifications
    ↓
Infrastructure       SQLAlchemy repos, OpenRouter, speech providers
    ↓
SQLite (default) / PostgreSQL via DATABASE_URL
```

## Why each layer exists

| Layer | Responsibility | Why it is not empty |
|-------|----------------|---------------------|
| API | HTTP, auth header, status codes | Routes call use cases only |
| Use cases | One user action each | Chat, explain, emergency, family notify |
| Domain | Emergency state machine + passport | LLM cannot pick transitions |
| Orchestration | Intent → context → plan → tools | Companion is not a raw chatbot |
| Services | Context selection, family, notifications | Shared by graph and HTTP |
| Infrastructure | DB, LLM, speech, storage | Swappable providers |
| Security | Session, ownership, consent, uploads | Health data boundary |

## Frontend

- `features/sathi/` — companion screens
- `lib/api.js` — HTTP + session token
- `lib/sathiTalk.js` — local shortcuts before the server
- Zustand — profile, companion lists, UI text size
- Emergency hospital results stay in `useLifeRouteStore` (server-derived, not duplicated as a second appointment database)

## Data

Default store is SQLite at `backend/data/sathi.db` so the app runs without Docker Postgres. Set `DATABASE_URL` to a PostgreSQL URL when you have one. Hospital catalog remains the LifeRoute in-memory Delhi NCR set — that catalog is not a patient database.

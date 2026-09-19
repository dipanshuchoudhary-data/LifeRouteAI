# Testing

## Backend

```bash
cd backend
python -m pytest
```

| Area | File |
|------|------|
| Emergency transitions + passport | `tests/unit/test_emergency_machine.py` |
| Upload magic bytes / names | `tests/unit/test_uploads.py` |
| AssistantAction schema + injection wrapper | `tests/unit/test_assistant_schema.py` |
| Tool allowlist | `tests/unit/test_tools.py` |
| Auth, consent, ownership, emergency API | `tests/integration/test_sathi_api.py` |
| LifeRoute sentinel / scoring / FHIR | existing `tests/unit` and `tests/integration` |

AI tests check **schema, routing, authorization, and fallbacks**. They do not assert one exact LLM sentence.

## Frontend

```bash
cd frontend
npm test
```

Covers navigation (`pathFor` settings fix) and voice intent routing.

## Manual flows

See the README critical-flow list: Talk, Explain, appointment lookup, Family confirm, Emergency, Food.

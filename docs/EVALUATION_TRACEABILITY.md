# Evaluation traceability

| Criterion | Implementation | Evidence in code | User benefit |
|-----------|----------------|------------------|--------------|
| Code Quality | Layered app + thin routes | `backend/app/application/use_cases.py`, `app/api/routes/v1.py` | Maintainable companion logic |
| Code Quality | Controlled tools | `backend/app/orchestration/tools.py` | No arbitrary LLM function calls |
| Problem Alignment | Voice, Explain, Family, Emergency, Food, Day | `frontend/src/features/sathi/`, `docs/PROBLEM_ALIGNMENT.md` | Features map to senior barriers |
| Security | Session + ownership | `app/security/authentication.py`, emergency GET 404 | Personal records stay per session |
| Security | Upload + prompt rules | `app/security/uploads.py`, `sanitization.py` | Untrusted photos cannot steer the system |
| Security | Consent | `app/security/consent.py`, family `confirm` | High-impact actions are explicit |
| Efficiency | Selective context + DB lookups | `app/services/context_service.py`, day/health shortcuts | Fewer tokens, faster “what’s today?” |
| Testing | SM, tools, API, intents | `backend/tests/`, `frontend/src/lib/*.test.js` | Regressions on the risky paths |
| Accessibility | Labels, focus, skip link, text scale, reduced motion | `sathi.css`, Settings, Family labels | Easier for older adults and keyboard users |

## Architecture walk (evaluation narrative)

1. **Problem** — older adults need understand → simplify → plan → act → confirm → remember.
2. **Product** — Sathi companion screens, not a hospital ops console as the home.
3. **Frontend** — `features/sathi` renders; `lib/api` and `sathiTalk` carry operations.
4. **API** — `/api/v1/*` use cases; `/api/v2/*` LifeRoute clinical engine.
5. **Use cases** — one class per action.
6. **Domain** — emergency state machine + passport.
7. **AI** — LangGraph companion workflow + LifeRoute DAG.
8. **Tools** — registry, schema, consent.
9. **Security** — session identity, not client user ids.
10. **Database** — SQLite/Postgres-ready tables for users, emergencies, consents.
11. **Tests** — listed above.
12. **Failures** — safe errors, demo labels, call 108.

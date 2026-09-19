# Sathi AI — Evaluation Audit

**Date:** 19 September 2026  
**Scope:** Complete existing repository (`frontend/`, `backend/`, docs, deploy config). No files were replaced.  
**Method:** Source-level inspection of routes, stores, agents, APIs, tests, env, and senior-facing UX.

This audit is the baseline. Later documents describe what was then implemented.

---

## Current architecture

Sathi is a **modular monolith** that grew on top of LifeRoute, an India-first emergency hospital-navigation product.

```
React (Vite)  →  FastAPI  →  LangGraph (LifeRoute triage DAG)
                    ↓
              OpenRouter LLM / Voice
                    ↓
         In-memory mocks + localStorage
```

### Frontend

- React 19 + Vite + React Router 7 + Zustand 5 + Leaflet.
- All senior screens live under `SathiLayout` (`/`, `/talk`, `/health`, `/safety`, `/family`, `/explain`, `/food`, `/memory`, `/tasks`, `/help`, `/settings`, `/emergency`).
- Companion data (`memories`, `tasks`, `meals`, `talk`, family messages) is **client-authoritative** in `useCompanionStore` (localStorage).
- Medical chart lives in `useProfileStore` (localStorage), defaulting to demo patient “Mr. Sharma”.
- Emergency / triage results live in `useLifeRouteStore` (not persisted).
- **No TanStack Query.** No frontend tests.

### Backend

- FastAPI entry: `backend/main.py`.
- LifeRoute clinical API: `backend/api/v2/router.py` (also mounted at `/v2` for the Vite proxy rewrite).
- LangGraph hospital DAG: sentinel → emergency fast-track **or** intake → triage → geo ∥ capacity → ranking → referral → disclaimer.
- Thin Sathi LLM wrappers: `POST /api/v2/sathi/{chat,explain,day,food,memory,help,family,health}`.
- Hospitals, telemetry, and sessions are **in-memory mocks**. SQL migrations exist but are not executed.
- **No authentication, no PostgreSQL/SQLite at runtime, no ownership model.**

### What already works (do not discard)

| Capability | Evidence |
|------------|----------|
| Voice-first home + Talk | `CompanionHome`, `TalkSathi`, `useAudioCapture`, `/api/v2/triage/voice` |
| Local intent shortcuts | `sathiIntent.js` / `sathiTalk.js` (help, family, memory, day) |
| Explain a photo | `ExplainPhoto` → `/api/v2/sathi/explain` (vision) |
| Food / digital help LLM | `/api/v2/sathi/food`, `/help` |
| Deterministic emergency sentinel | `graph/agents/safety_sentinel.py` (<20 ms, no LLM) |
| Hospital matching + FHIR/PDF | LifeRoute pipeline, `fhir/`, `pdf_referral.py` |
| Wearable ask-then-family flow | `SafetyCheckModal` (copy already avoids claiming an ambulance) |
| Rate limit on some v2 routes | 30 req / 60s / IP |
| Existing unit/integration tests | sentinel, scorer, vitals, FHIR, pipeline, voice |

---

## Current strengths

1. **Real problem, not a chatbot skin.** Voice, explain-photo, family calling, and SOS already map to senior barriers.
2. **Safety sentinel before generative AI** is the correct emergency architecture.
3. **LifeRoute hospital scoring** is a genuine capability (travel, wait, beds, specialty, network).
4. **Companion UI is simpler than the ops console** — cards, large buttons, short copy.
5. **LLM keys stay on the server.** Frontend `.env.production` has no secrets.
6. **MOCK_MODE** and local Talk fallbacks keep the demo usable without paid APIs.

---

## Current weaknesses

1. **Two products in one chrome.** Header, title, and emergency page still say LifeRoute / LIVE ops.
2. **Sathi backend is a prompt proxy.** No persistence, no tools, no selective context, no consent.
3. **Family “send” and “family told” are local logs.** Easy to read as real notifications.
4. **Emergency UI implies ambulance dispatch** (`En route`, `Connected`, `Hospital accepted`) even when nothing left the device.
5. **No identity or ownership.** Client-supplied `patient` / `context` / PDF `state` are trusted.
6. **Settings is the 444-line ops medical chart**, and More → Settings is broken (`profile` is not a path).
7. **Prompt injection surface:** user text and uploaded documents are interpolated into prompts.
8. **PostgreSQL schema is fiction at runtime.**

---

## Code quality issues

| Issue | Priority | Criterion |
|-------|----------|-----------|
| Route handlers contain pipeline + SOS + Sathi LLM calls | HIGH | Code Quality |
| No application / domain / repository boundary for Sathi | HIGH | Code Quality |
| `MedicalProfile.jsx` (~444 lines) reused as Settings | HIGH | Code Quality |
| `EmergencyTrack.jsx` (~324 lines) is an ops console | HIGH | Code Quality |
| Dual routing systems (`routing.py` vs `ranking_supervisor`) | MEDIUM | Code Quality |
| v2 models defined inline in the router | MEDIUM | Code Quality |
| Vite `/api` rewrite strips prefix; dual mount hides the inconsistency | MEDIUM | Code Quality |
| Large unrouted LifeRoute pages still in the bundle | MEDIUM | Efficiency / Quality |
| `print()` instead of structured logging | LOW | Code Quality |
| No frontend feature/hooks/services split for Sathi API | MEDIUM | Code Quality |

---

## Security issues

| Issue | Priority | Criterion |
|-------|----------|-----------|
| Zero authentication on SOS, tools, PDF, Sathi, triage | CRITICAL | Security |
| Unauthenticated SOS can force emergency + LLM cost | CRITICAL | Security |
| Client `context` injected into Sathi prompts | CRITICAL | Security / AI |
| Raw user / document text in prompts (prompt injection) | CRITICAL | Security |
| Client-supplied referral PDF state | HIGH | Security |
| Exception strings returned to clients | HIGH | Security |
| Explain image has min length but no max size / MIME allowlist | HIGH | Security |
| CORS credentials + localhost defaults | MEDIUM | Security |
| nginx `Permissions-Policy: camera=()` blocks Explain in production | HIGH | Security / Product |
| PII + base64 photos in localStorage | MEDIUM | Security |
| Rate limit is in-memory, v1 routes unprotected | MEDIUM | Security |
| `.gitignore` ignores `.env` but not `.env.*` | MEDIUM | Security |

---

## Efficiency issues

| Issue | Priority | Criterion |
|-------|----------|-----------|
| Everyday questions (“what time is my appointment?”) still hit the LLM when local intent misses | HIGH | Efficiency |
| Full profile + family phones + memories sent on every chat | HIGH | Efficiency / Security |
| Stable triage can call the LLM up to three times | MEDIUM | Efficiency |
| Nearby hospitals + telemetry recomputed every poll | MEDIUM | Efficiency |
| No server-state cache (TanStack Query) | MEDIUM | Efficiency |
| Dead LifeRoute pages increase bundle weight | LOW | Efficiency |

---

## Testing gaps

| Gap | Priority | Criterion |
|-----|----------|-----------|
| No API TestClient tests (auth, SOS, Sathi) | HIGH | Testing |
| No ownership / consent / upload tests | HIGH | Testing |
| No emergency state-machine tests (machine does not exist yet) | HIGH | Testing |
| No structured-output / tool-authorization tests | MEDIUM | Testing |
| No frontend tests at all | MEDIUM | Testing |
| No prompt-injection regression tests | MEDIUM | Testing |

Existing tests are strong for **LifeRoute rules** (sentinel, scoring, FHIR). They do not cover Sathi as a product.

---

## Accessibility gaps

| Gap | Priority | Criterion |
|-----|----------|-----------|
| Many inputs are placeholder-only (Family, Memory, Food, Help) | HIGH | Accessibility |
| No `:focus-visible` styles in `sathi.css` | HIGH | Accessibility |
| Safety modal has no focus trap / `aria-labelledby` | HIGH | Accessibility |
| Mic buttons lack `aria-pressed` | MEDIUM | Accessibility |
| Fixed `px` type; kicker at 11px | MEDIUM | Accessibility |
| No `prefers-reduced-motion` for SOS pulse / live dot | MEDIUM | Accessibility |
| Nav links lack `aria-current` | LOW | Accessibility |
| Emergency ops density is hard for older adults | HIGH | Accessibility / Alignment |

---

## Problem-alignment gaps

| Senior problem | Product claim | Actual gap |
|----------------|---------------|------------|
| Hard to use technology | Voice companion | Overlay/header still hospital-ops; Settings is a clinical chart |
| Hard to read bills / messages | Explain Anything | Works if API is up; upload not hardened; camera blocked in nginx |
| Emergency is too many steps | One SOS button | SOS is real matching, but UI **overclaims** dispatch |
| Family should know | Family Bridge | Call (`tel:`) is real; messages/alerts are local only and not labeled as demo |
| Nutrition is confusing | Food photo / meals | Text LLM only; no photo-food pipeline; language can overclaim |
| Remember appointments | My day | Local list; no recurrence; LLM used when a query would do |
| Health literacy | Health page | Read-only summary is good; edit path dumps users into ops UI |

---

## UX / product gaps

- Branding: `index.html`, logo, SOS button still “LifeRoute AI”.
- More → Settings navigates home (`pathFor('more', 'profile')`).
- Emergency page and companion pages do not feel like one product.
- Demo/judge controls (“Judge demo location”, “Load demo patient”) sit on the senior Safety screen.
- Empty / loading / error states are inconsistent.
- Food and health copy must stay estimated / non-diagnostic (partially already true).

---

## Recommended improvements

| # | Improvement | Priority | Criteria |
|---|-------------|----------|----------|
| 1 | Add a **Sathi application layer** (use cases, DTOs, repos) without deleting LifeRoute | CRITICAL | Code Quality |
| 2 | **Device session auth** + ownership from the session, never from client `user_id` | CRITICAL | Security |
| 3 | **Deterministic emergency state machine** + concise health passport | CRITICAL | Alignment / Security |
| 4 | **Honest emergency language** (prepared / simulated — never “dispatched”) | CRITICAL | Alignment |
| 5 | **Controlled tool registry** with schema, auth, consent | CRITICAL | Code Quality / Security / AI |
| 6 | **Selective context** + skip LLM for lookups | HIGH | Efficiency / AI |
| 7 | **Structured AssistantAction** validation before any side effect | HIGH | Security / AI |
| 8 | **Prompt-injection boundaries** for chat and Explain | HIGH | Security |
| 9 | **Upload validation** (size, MIME, magic bytes, filename) | HIGH | Security |
| 10 | **Consent records** for family notify / health share | HIGH | Security / Alignment |
| 11 | Safe errors + request-id logging (no PHI dumps) | HIGH | Security |
| 12 | Fix Settings path; add a **simple senior Settings** page | HIGH | Alignment / A11y |
| 13 | Rebrand chrome to Sathi; keep LifeRoute as emergency engine | HIGH | Alignment / UX |
| 14 | Senior **Emergency Assist** screen; keep ops track as details | HIGH | Alignment / UX |
| 15 | Label family notify as **demo/simulation** | HIGH | Alignment |
| 16 | SQLite (Postgres-ready) for users, emergencies, consent, memories | HIGH | Code Quality / DB |
| 17 | Accessibility: labels, focus, reduced motion, text scale | MEDIUM | Accessibility |
| 18 | Speech provider interfaces (OpenRouter + mock; browser TTS) | MEDIUM | Code Quality |
| 19 | Tests for auth, SM, tools, uploads, schema, a few UI flows | MEDIUM | Testing |
| 20 | Fix nginx camera policy; `.gitignore` for `.env.*` | MEDIUM | Security |
| 21 | TanStack Query for emergency/hospital server state | LOW | Efficiency |
| 22 | Do **not** add Redis, vector DB, or microservices | — | Efficiency |

---

## Implementation principle

Keep LifeRoute’s hospital DAG. Put Sathi’s companion, consent, emergency policy, and tools in a real application layer. Prefer **honest, testable, senior-usable** behavior over a folder-only “enterprise” rewrite.

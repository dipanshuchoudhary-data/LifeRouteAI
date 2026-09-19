# Final evaluation report

Honest account of what was implemented on the existing Sathi/LifeRoute repository. Nothing here claims a live ambulance network or a production IdP.

### Code Quality

- Added `backend/app/` with API, use cases, domain emergency, services, orchestration, infrastructure, and security.
- Existing LifeRoute `graph/` pipeline was **kept**, not rewritten into empty folders.
- v2 SOS no longer injects fake “unconscious not breathing” text.
- Route handlers for new Sathi v1 endpoints delegate to use cases.
- Frontend: Settings path fixed; senior Settings page added; emergency home is `EmergencyAssist` instead of the ops console.

### Security

- Demo device sessions (`/api/v1/auth/demo`) and Bearer/session headers.
- Ownership on emergency records.
- Consent rows for family notify, health share, and emergency.
- Image magic-byte validation, size limits, filename sanitization.
- Prompt-injection wrappers and tighter Sathi/Explain system prompts.
- Safe error bodies; request-id + security headers; `.gitignore` for `.env.*`.
- nginx camera policy now allows `self` so Explain can use the camera.
- **Not claimed:** OAuth, hospital-network SSO, or encryption-at-rest beyond SQLite file permissions.

### Efficiency

- Appointment/day and saved-health answers can come from the database without an LLM.
- Context selector sends only intent-relevant fields (no full chart / phone dump by default).
- Companion `context` on legacy v2 chat is no longer forwarded wholesale into the prompt.
- Vite `/api` proxy no longer strips the prefix (matches production nginx).
- TanStack Query was **not** added. Server emergency/hospital state remains in the existing store; companion lists stay client-persisted. Adding a second cache layer would have duplicated those lists.

### Testing

- New: emergency machine, uploads, AssistantAction, tool allowlist, Sathi API (auth, consent, ownership, safe errors).
- Existing LifeRoute tests remain.
- Frontend: `pathFor` and intent tests (Vitest).
- **Not claimed:** full Playwright coverage of every screen.

### Accessibility

- Skip link, `:focus-visible`, `aria-current`, `aria-pressed` on mics, `aria-labelledby` on the safety dialog.
- Labels on Family / Memory / Food / Help / Explain file input.
- Text size control in Settings (`html[data-sathi-scale]`).
- `prefers-reduced-motion` disables pulse/animation.
- Emergency page is large-type companion copy first; ops map is opt-in details.

### Problem Alignment

See `docs/PROBLEM_ALIGNMENT.md`. The product is a daily companion with an honest emergency path, not a chatbot skin and not a fake ambulance dispatcher.

### Architecture

See `docs/ARCHITECTURE.md`. Layers exist only where they have code. Hospitals stay on the LifeRoute catalog; people/emergencies/consents are relational.

### AI Architecture

See `docs/AI_ARCHITECTURE.md`. Companion graph: intent → selective context → optional structured plan → registry tools. LifeRoute DAG still ranks hospitals after a non-LLM sentinel.

### Emergency Architecture

See `docs/EMERGENCY_FLOW.md`. Deterministic states, concise passport, simulated family notice, **call 108**. UI must not say an ambulance was dispatched.

### Known Limitations

- Demo session auth, not national digital identity.
- Family SMS/push is **simulated** and labeled as such.
- Ambulance / 108 integration is **not connected**.
- Hospital beds/telemetry are **simulated** LifeRoute overlays.
- Wearable alerts are a **browser simulation**.
- Food photo calories are not a lab measurement; copy says estimated / not a prescription.
- Explain quality depends on the configured vision model and lighting.
- SQLite is the default store; PostgreSQL is supported via `DATABASE_URL` but not required to run.
- Large unrouted LifeRoute marketing pages still exist in the repo; they are not the Sathi routes.

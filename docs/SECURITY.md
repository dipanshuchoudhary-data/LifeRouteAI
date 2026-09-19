# Security model

Sathi handles health, family, and location information. The backend is the trust boundary.

## Authentication

- `POST /api/v1/auth/demo` issues a device session token.
- Personal routes require `Authorization: Bearer …` or `X-Sathi-Session`.
- Identity is the session’s `user_id`. Client-supplied user ids are ignored.

This is **demo session auth**, not bank-grade OAuth. It is enough to prove ownership and keep tools off the public internet during evaluation.

## Authorization and ownership

- `require_owner` compares `current_user.id` to the row’s `user_id`.
- Emergency GET/resolve return 404 when the case is missing or not owned.
- Tools run only if the name is in the registry.

## Consent

| Action | Rule |
|--------|------|
| Read own profile / today | Session is enough |
| Family message | `confirm: true` recorded in `consents` |
| Share health with a message | Extra `share_health` consent |
| Emergency | Explicit SOS / “I need help” is the consent |

## Uploads

- Magic-byte MIME detection (JPEG/PNG/WebP/GIF)
- Size cap (`SATHI_MAX_UPLOAD_BYTES`)
- Filename sanitization, no `..`, no executables
- Metadata stored; files are not executed

## Prompt injection

User text and document text are wrapped as **UNTRUSTED DATA**. System rules say visible document text is not a command. Failed structured output does not run tools.

## Other controls

- Safe client errors (`Something went wrong…`)
- Structured logs without tokens, passwords, or full charts
- CORS from env
- Security headers on every response
- Rate limit on expensive v2 routes
- No API keys in the frontend

## Checklist

- [x] No hardcoded secrets
- [x] No API keys in frontend
- [x] Authentication on Sathi v1 personal routes
- [x] Ownership on emergency records
- [x] Input / upload validation
- [x] Prompt injection considered
- [x] Controlled tools
- [x] Consent for family notify
- [x] Safe errors
- [x] CORS + security headers
- [x] Environment documented

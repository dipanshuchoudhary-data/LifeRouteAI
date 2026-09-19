# Production environment (Vercel + Render)

Replace **only** `https://YOUR-BACKEND-HOST` with your real API URL  
(example: `https://sathi-api.onrender.com`).  
Do not add a trailing slash.

Frontend (already known):

```
https://life-route-ai.vercel.app
```

---

## 1. Render — API service (`backend`)

Paste these into **Environment → Environment Variables**.  
LLM keys stay **only** on the backend.

```env
# --- Public URLs ---
FRONTEND_URL=https://life-route-ai.vercel.app
CORS_ORIGINS=https://life-route-ai.vercel.app,http://localhost:5173,http://127.0.0.1:5173
ASSISTANT_CONNECTOR_URL=https://YOUR-BACKEND-HOST

# --- LLM (backend only) ---
LLM_API_KEY=sk-or-v1-your-openrouter-key-here
LLM_MODEL=nvidia/nemotron-3-super-120b-a12b:free
Voice_LLM=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
LLM_SITE_URL=https://life-route-ai.vercel.app
LLM_APP_NAME=Sathi AI
LLM_BASE_URL=https://openrouter.ai/api/v1

# --- App ---
MOCK_MODE=false
SATHI_DEMO_AUTH=true
SATHI_SESSION_HOURS=72
SATHI_MAX_UPLOAD_BYTES=4000000
SATHI_MAX_REQUEST_BYTES=6000000
DATABASE_URL=sqlite:///./data/sathi.db

# Optional. Leave empty if unused.
ELEVENLABS_API_KEY=
```

What each URL field does:

| Variable | Value | Purpose |
|----------|--------|---------|
| `FRONTEND_URL` | `https://life-route-ai.vercel.app` | Allowed browser origin (no trailing `/`) |
| `CORS_ORIGINS` | Vercel + local Vite | Extra allowed Origins, comma-separated |
| `ASSISTANT_CONNECTOR_URL` | your Render API URL | Public API origin in OpenAPI / connector |
| `LLM_*` | OpenRouter | Chat, explain, voice — never sent to Vercel |

After you know the Render URL, `ASSISTANT_CONNECTOR_URL` should match it exactly, for example:

```env
ASSISTANT_CONNECTOR_URL=https://sathi-api.onrender.com
```

---

## 2. Vercel — frontend (`frontend`)

Paste these into **Settings → Environment Variables**  
(Production, Preview, and Development).

**Do not add** `LLM_API_KEY`, `Voice_LLM`, `ELEVENLABS_API_KEY`, or any secret.

If Vercel says *“Remove the public framework prefix… If that’s safe, change the variable to Config”*:

1. Keep the name **`VITE_API_URL`**. Do not rename it. Vite only exposes `VITE_*` to the browser, and the site needs that URL for `fetch`.
2. Change the variable **type** from Secret / Sensitive to **Config**.
3. Save. The warning goes away because this value is not a secret — it is only your public API origin.

```env
VITE_API_URL=https://YOUR-BACKEND-HOST
```

Example after you have the API host:

```env
VITE_API_URL=https://sathi-api.onrender.com
```

That is the only frontend env var this app reads. The browser will call:

- `https://YOUR-BACKEND-HOST/api/v1/...`
- `https://YOUR-BACKEND-HOST/api/v2/...`

Redeploy the Vercel project after you set `VITE_API_URL` (Vite bakes it in at **build** time).

---

## 3. Checklist

On Render (backend):

- [ ] `FRONTEND_URL=https://life-route-ai.vercel.app` (no `/` at the end)
- [ ] `CORS_ORIGINS` includes that same origin
- [ ] `ASSISTANT_CONNECTOR_URL` is your Render URL
- [ ] `LLM_API_KEY` is set here only

On Vercel (frontend):

- [ ] `VITE_API_URL` is your Render URL (no `/` at the end)
- [ ] No LLM keys

If the site loads but Talk / Explain / Emergency fail with a network or CORS error, the Origin is wrong (trailing slash) or `VITE_API_URL` still points at `localhost`.

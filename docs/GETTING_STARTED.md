# Getting started

Run the API and the ops console on your machine. The Vite dev server proxies `/api`, `/navigate`, `/health`, `/hospitals`, and `/assistant` to the backend so the browser can use same-origin URLs.

## Requirements

| Tool | Version |
|------|---------|
| Python | 3.12 or newer |
| Node.js | 18 or newer |
| OpenRouter key | [openrouter.ai/keys](https://openrouter.ai/keys) — optional if `MOCK_MODE=true` |

## 1. Clone and env

```bash
git clone <this-repo>
cd hack
cp .env.example .env
```

Minimum `.env` fields:

| Variable | Purpose |
|----------|---------|
| `LLM_API_KEY` | OpenRouter key (`sk-or-v1-…`) |
| `LLM_MODEL` | Chat model slug (default Nemotron Super free) |
| `Voice_LLM` | Audio / omni model for Home mic transcription |
| `MOCK_MODE` | `true` skips live LLM and uses pre-computed Delhi NCR cases |
| `FRONTEND_URL` | CORS origin, usually `http://localhost:5173` |
| `VITE_API_URL` | Leave empty locally so the Vite proxy is used |

Never commit `.env`. `.env.example` is the safe template.

## 2. Backend

Default port in code and the Vite proxy is **8000**. If that port is already taken on your machine, start uvicorn on another port and change `frontend/vite.config.js` `server.proxy` targets to match.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) and interactive docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

## 3. Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

## 4. Smoke test

```bash
curl.exe http://127.0.0.1:8000/health
curl.exe -X POST http://127.0.0.1:8000/api/v2/emergency/sos ^
  -H "Content-Type: application/json" ^
  -d "{\"input\":\"unconscious not breathing\",\"location\":{\"lat\":28.6139,\"lng\":77.209}}"
```

On Home: describe a problem, pick E1–E5. E1 and E2 should open the live incident board.

## Tests

```bash
cd backend
python -m pytest
```

Coverage includes the safety sentinel, vitals, hospital scorer, FHIR serialization, voice client, and the LangGraph pipeline.

```bash
cd frontend
npm run build
```

## If something fails

| Symptom | What to check |
|---------|----------------|
| UI loads, triage never finishes | Backend not on the port Vite proxies (8000) |
| `/health` works, voice fails | `Voice_LLM` and `LLM_API_KEY` |
| Pipeline errors, UI still usable | Set `MOCK_MODE=true` for local walkthrough without a live model |
| CORS errors from another origin | Add it to `CORS_ORIGINS` or `FRONTEND_URL` |
| Chart “did not stick” | Profile must be **Saved**; unsaved drafts are not used for dispatch |

See [Deployment](DEPLOYMENT.md) for production proxy and secrets.

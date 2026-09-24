# Deployment

Live hackathon URLs are in [HACKATHON.md](HACKATHON.md).

| What | URL |
|------|-----|
| Frontend | https://life-route-ai.vercel.app |
| Backend | https://liferouteai.onrender.com |

## Secrets

| Keep server-side | Safe to expose |
|------------------|----------------|
| `LLM_API_KEY` | `LLM_MODEL` slug, `LLM_APP_NAME` |
| Any future DB passwords | `FRONTEND_URL`, public map tiles |

Copy `.env.example` → `.env` on the API host. Do not commit `.env`. Frontend production can leave `VITE_API_URL` empty when nginx (or similar) reverse-proxies `/api` and `/assistant` to FastAPI.

## Local vs production URLs

| Mode | Frontend | API | How they connect |
|------|----------|-----|------------------|
| Local Vite | `http://127.0.0.1:5173` | `http://127.0.0.1:8000` | `vite.config.js` proxy |
| Same-origin prod | `https://your.domain` | same host | nginx routes `/api`, `/navigate`, `/health`, `/hospitals`, `/assistant` |

`frontend/nginx.conf` is the production static + proxy pattern. `ASSISTANT_CONNECTOR_URL` should be the public origin so `/assistant/openapi.json` lists the right server.

## Ports

- **5173** — Vite ops console  
- **8000** — uvicorn (`main:app`), what the Vite proxy expects  

If 8000 is occupied, pick another port and update both uvicorn and the Vite `server.proxy` targets. CORS uses `FRONTEND_URL` plus `CORS_ORIGINS`.

## Mock mode

`MOCK_MODE=true` skips live OpenRouter calls and can return pre-computed Delhi NCR cases for known phrases (chest pain, Hindi fever, trauma). Use it for:

- Walkthroughs without a key or when the provider is busy  
- CI or laptops that should not spend tokens  

The UI is the same. Do not describe the product to end users as “a demo.”

## Hospitals

The default catalog is **local** (Noida / Gurugram / Delhi NCR coordinates and specialties). Capacity and fleet fields are enriched in-process. There is no required cloud hospital database for a working console.

## Frontend build

```bash
cd frontend
npm ci
npm run build
```

Serve `frontend/dist` behind nginx (or any static host) with API proxy rules as in `frontend/nginx.conf`.

## Backend process

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Health check: `GET /health`.

## Maps

The live board uses public **OSRM** and Carto / Esri tiles. If OSRM is blocked, the client still draws a fallback path. No map API key is required for the default setup.

## Checklist

- [ ] `.env` on the server only; `.env.example` in git  
- [ ] `FRONTEND_URL` / `CORS_ORIGINS` include the real website  
- [ ] Proxy `/api` (or `/v2`) to uvicorn  
- [ ] `LLM_API_KEY` set, or `MOCK_MODE=true`  
- [ ] Confirm SOS still says call **108**

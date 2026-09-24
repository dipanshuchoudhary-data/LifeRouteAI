# Hackathon — live links

Use these URLs for judging and walkthroughs. Emergency help is **108**. LifeRoute does not dispatch an ambulance.

| What | URL |
|------|-----|
| **Frontend** (ops console) | https://life-route-ai.vercel.app |
| **Backend** (API) | https://liferouteai.onrender.com |
| API health | https://liferouteai.onrender.com/health |
| API docs (Swagger) | https://liferouteai.onrender.com/docs |

## How they connect

- Site is on **Vercel**.
- API is on **Render**.
- The frontend should call the API with `VITE_API_URL=https://liferouteai.onrender.com` (no trailing slash).
- Render CORS should allow `https://life-route-ai.vercel.app`.

If the first API request is slow, the Render free tier may be waking up. Refresh once and try again.

## Walkthrough

1. Open the [frontend](https://life-route-ai.vercel.app).
2. Describe a problem (or use voice). Pick **E1** or **E2**.
3. Confirm Live Ops, map, **Call 108**, and family.
4. Optional check: [health](https://liferouteai.onrender.com/health) shows `LifeRoute AI`.

Local run: [Getting started](GETTING_STARTED.md).

# LifeRoute frontend

React 19 + Vite ops console: Home intake, Live Ops map, hospitals, ambulance, blood donors, ICU, and medical chart.

Local run and environment: **[docs/GETTING_STARTED.md](../docs/GETTING_STARTED.md)**.

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Vite proxies `/api`, `/navigate`, `/health`, `/hospitals`, and `/assistant` to `http://127.0.0.1:8000`. Start the FastAPI app on that port first.

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server on 5173 |
| `npm run build` | Production bundle in `dist/` |
| `npm run preview` | Serve the production build |

# LifeRoute documentation

LifeRoute is an India-first **emergency navigation console**. It helps a dispatcher or family member describe a problem, choose how serious it is (ESI E1–E5), match a capable hospital, and keep **108**, family, maps, and a referral in one place.

This folder explains how the product works and how to run it. The root [README](../README.md) is the public overview. Use these pages when you need detail.

| Document | What it covers |
|----------|----------------|
| [Product](PRODUCT.md) | Problem, who it is for, screens, and what LifeRoute does **not** claim |
| [Getting started](GETTING_STARTED.md) | Local setup, environment, demo flow |
| [Architecture](ARCHITECTURE.md) | Client, FastAPI, LangGraph fan-out, data |
| [ESI and scoring](ESI_AND_SCORING.md) | E1–E5 paths and the five-factor hospital score |
| [API](API.md) | HTTP, SSE, voice, nearby hospitals, FHIR PDF |
| [Safety](SAFETY.md) | Sentinel, 108, chart Save, disclaimers |
| [Deployment](DEPLOYMENT.md) | Ports, proxy, mock mode, secrets |

Emergency number throughout the product is **108** (India). LifeRoute is a navigation aid, not a medical device and not an ambulance dispatcher.

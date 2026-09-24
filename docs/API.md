# API

Interactive OpenAPI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) when the backend is running.

The clinical router is mounted at **`/api/v2`** and **`/v2`**. Local Vite strips the `/api` prefix and forwards to port 8000, so the browser can call `/api/v2/...` and still hit `/v2/...` on the server.

## Clinical

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v2/health` | Clinical router liveness |
| `POST` | `/api/v2/triage/stream` | SSE triage; honour `esi_level` |
| `POST` | `/api/v2/triage` | Same pipeline, one JSON response |
| `POST` | `/api/v2/emergency/sos` | Fast-track emergency path |
| `POST` | `/api/v2/triage/voice` | Audio → transcript (`Voice_LLM`) |
| `GET` | `/api/v2/hospitals/nearby` | Geo-ranked hospitals |
| `GET` | `/api/v2/hospitals/{id}/telemetry` | Latest overlay for one facility |
| `WS` | `/api/v2/hospitals/{id}/telemetry` | Telemetry stream |
| `POST` | `/api/v2/referral/generate-pdf` | Signed PDF bytes |

## Compat / connector

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness + LLM provider label |
| `POST` | `/navigate` | Full pipeline (older clients) |
| `GET` | `/hospitals` | Network list, optional `?city=` |
| `POST` | `/assistant/chat` | Connector turn for any LLM client |
| `POST` | `/assistant/invoke` | One tool by name |
| `GET` | `/assistant/tools` | `native` \| `openai` \| `anthropic` \| `json-schema` |
| `GET` | `/assistant/manifest` | Plugin manifest |
| `GET` | `/assistant/openapi.json` | OpenAPI for the connector |

Assistant tools: `navigate_care`, `triage_symptoms`, `find_hospital`, `generate_referral`, `list_hospitals`.

## Typical triage body

```json
{
  "input": "I can't breathe, gasping for air",
  "location": { "lat": 28.6139, "lng": 77.2090 },
  "esi_level": 2,
  "session_id": "",
  "vitals": {},
  "patient": {}
}
```

`patient` should be the **saved** chart (name, age, blood type, allergies, contacts) so ranking and the referral can use it.

## SOS

`POST /api/v2/emergency/sos` runs the pipeline on the emergency path. The public payload includes the matched facility and a **108** message. It does not mean an ambulance was sent.

## Streaming triage

`POST /api/v2/triage/stream` is Server-Sent Events. The console uses node names (`safety_sentinel`, `intake`, `ranking`, …) to drive the processing overlay and then the live board.

## Nearby hospitals

```
GET /api/v2/hospitals/nearby?lat=28.6139&lng=77.2090&esi_level=4&complaint=general
```

Returns enriched hospitals with travel estimates. `esi_level` 1–2 uses ambulance-style travel; higher ESI uses driving.

## Voice

`POST /api/v2/triage/voice` accepts recorded audio. The server transcribes with `Voice_LLM` via OpenRouter. The Home mic can also use the browser speech API when available.

## Referral PDF

`POST /api/v2/referral/generate-pdf` takes pipeline state and returns `application/pdf` plus a signature header. Pair with the FHIR bundle on the triage result for the receiving facility.

## Errors

Prefer safe, short messages for operators. Pipeline failures may fall back to a pre-computed NCR scenario when `MOCK_MODE` is on or a matching demo case exists. That keeps the board usable; it is not a live hospital booking.

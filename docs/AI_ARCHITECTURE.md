# AI architecture

Sathi is not a single chat completion over the whole user record.

```
User request
  → Intent detection (deterministic first)
  → Selective context
  → Plan (structured AssistantAction when an LLM is needed)
  → Permission / consent
  → Tool execution (registry only)
  → Validation
  → Reply
```

## When the model is used

| Task | LLM? |
|------|------|
| Today / appointments | No — database |
| Saved medicines | No — database |
| Remember this | No — insert note |
| Emergency state change | No — state machine |
| Hospital fast-track | No — LifeRoute rules |
| Everyday talk | Yes |
| Explain a photo | Yes (vision) |
| Food ideas | Yes, with “estimate / not a diet” language |

## Controlled tools

The model may **propose** `notify_family` or `trigger_emergency`. The backend:

1. Checks the name against `REGISTRY`
2. Validates arguments with Pydantic
3. Checks consent
4. Executes the Python handler
5. Returns a result the model did not run itself

There is no “call any function” path.

## LifeRoute DAG (unchanged role)

`graph/pipeline.py` still ranks hospitals after the safety sentinel. Sathi uses that as **assistance**, not as proof that an ambulance moved.

## Tracing

If LangSmith env vars are set on the host, LangGraph can emit traces. Application logs record model/provider/latency only — not prompt bodies or charts.

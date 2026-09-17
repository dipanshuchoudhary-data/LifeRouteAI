"""
LifeRoute AI — Intake Agent
Detects language and extracts structured symptoms from raw patient input.
Uses OpenRouter (Claude via OpenAI-compatible API).
"""

from graph.llm_client import chat_completion, parse_json_response
from graph.agents.vitals_validator import validate_vitals, vitals_suggest_emergency

INTAKE_PROMPT = """You are a medical intake assistant for LifeRoute AI. Your job is to extract structured symptom information from a patient's description.

IMPORTANT RULES:
- Detect the language of the input ("en" for English, "hi" for Hindi)
- Extract symptoms even if the input is in Hindi — translate to English for the structured fields
- If information is not provided, use null
- Do NOT diagnose. Only extract what the patient reports.
- Severity should be estimated 1-10 based on described intensity

Respond ONLY with valid JSON in this exact format:
{
  "language": "en" or "hi",
  "chief_complaint": "primary symptom described",
  "duration": "how long symptoms have lasted (e.g., '2 days', 'few hours') or null",
  "severity": 1-10 integer estimate,
  "associated_symptoms": ["list", "of", "other", "symptoms"],
  "age": "patient age if mentioned or null",
  "gender": "male" or "female" or "other" or "unknown",
  "vitals": {
    "heart_rate": integer or null,
    "systolic_bp": integer or null,
    "diastolic_bp": integer or null,
    "oxygen_saturation": number or null,
    "temperature_f": number or null,
    "respiratory_rate": integer or null
  }
}"""


def intake_agent(state: dict) -> dict:
    """Extract structured symptoms from raw patient input."""

    raw_input = state["raw_input"]

    try:
        result_text = chat_completion(
            f"{INTAKE_PROMPT}\n\nPatient input: \"{raw_input}\"",
            max_tokens=500,
        )
        parsed = parse_json_response(result_text)
        extracted, warnings = validate_vitals(parsed.get("vitals") or {})
        seed, seed_warnings = validate_vitals(state.get("vitals") or {})
        vitals = {**seed, **{key: value for key, value in extracted.items() if value is not None}}
        warnings = seed_warnings + warnings
        vital_emergency = vitals_suggest_emergency(vitals)
        update = {
            "language": parsed.get("language", "en"),
            "structured_symptoms": {
                "chief_complaint": parsed.get("chief_complaint", raw_input),
                "duration": parsed.get("duration"),
                "severity": parsed.get("severity", 5),
                "associated_symptoms": parsed.get("associated_symptoms", []),
                "age": parsed.get("age"),
                "gender": parsed.get("gender") or "unknown",
            },
            "vitals": vitals,
            "vitals_warnings": warnings,
        }
        if vital_emergency and not state.get("is_emergency"):
            update.update(
                {
                    "is_emergency": True,
                    "emergency_trigger_reason": vital_emergency,
                    "esi_level": 1,
                    "urgency_category": "RED",
                    "triage_level": "icu",
                }
            )
        return update

    except Exception as e:
        print(f"[Intake Agent] Error: {e}")
        return {
            "language": "en",
            "structured_symptoms": {
                "chief_complaint": raw_input,
                "duration": None,
                "severity": 5,
                "associated_symptoms": [],
                "age": None,
                "gender": "unknown",
            },
            "vitals": {},
            "vitals_warnings": [],
        }

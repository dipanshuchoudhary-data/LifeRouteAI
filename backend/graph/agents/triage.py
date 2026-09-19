"""
LifeRoute AI — Triage Agent
Rule-based scoring first, LLM fallback (OpenRouter) for uncertain cases.
NEVER states a diagnosis — only "symptoms may suggest..." language.
"""

import json

from graph.llm_client import chat_completion, parse_json_response
from graph.agents.safety_sentinel import ESI_TO_LEGACY, ESI_TO_URGENCY, LEGACY_TO_ESI

CARE_SETTING = {
    1: "ED_TRAUMA",
    2: "ED_GENERAL",
    3: "ED_GENERAL",
    4: "PRIMARY_CLINIC",
    5: "HOME_CARE",
}

# ---------------------------------------------------------------------------
# Rule-based triage engine
# Each rule: (conditions_fn, triage_level, reasoning, confidence)
# ---------------------------------------------------------------------------

TRIAGE_RULES = [
    # ---- ICU / Critical ----
    {
        "keywords": ["chest pain", "heart attack", "cardiac arrest", "unconscious", "not breathing"],
        "associated": ["shortness of breath", "sweating", "radiating pain", "jaw pain", "arm pain"],
        "min_severity": 7,
        "level": "icu",
        "reasoning": "Symptoms may suggest a critical cardiac event. Immediate intensive care is recommended.",
        "confidence": 0.9,
    },
    {
        "keywords": ["stroke", "paralysis", "slurred speech", "face drooping", "sudden numbness"],
        "associated": ["confusion", "vision loss", "severe headache"],
        "min_severity": 7,
        "level": "icu",
        "reasoning": "Symptoms are consistent with a possible cerebrovascular event. Immediate neurological intervention may be needed.",
        "confidence": 0.9,
    },
    {
        "keywords": ["severe bleeding", "major trauma", "head injury", "accident"],
        "associated": ["unconscious", "fracture", "open wound", "not responding"],
        "min_severity": 7,
        "level": "icu",
        "reasoning": "Indicators suggest major trauma requiring immediate critical care and surgical assessment.",
        "confidence": 0.85,
    },
    # ---- Emergency ----
    {
        "keywords": ["chest pain", "breathing difficulty", "shortness of breath"],
        "associated": ["dizziness", "nausea", "palpitations"],
        "min_severity": 5,
        "level": "emergency",
        "reasoning": "Symptoms may indicate a cardiovascular or respiratory emergency. Urgent evaluation is recommended.",
        "confidence": 0.85,
    },
    {
        "keywords": ["high fever", "severe headache", "neck stiffness"],
        "associated": ["sensitivity to light", "confusion", "rash", "vomiting"],
        "min_severity": 6,
        "level": "emergency",
        "reasoning": "This combination of symptoms may suggest a serious infection such as meningitis. Emergency evaluation is strongly recommended.",
        "confidence": 0.85,
    },
    {
        "keywords": ["severe abdominal pain", "appendicitis", "vomiting blood"],
        "associated": ["fever", "rigid abdomen", "nausea"],
        "min_severity": 6,
        "level": "emergency",
        "reasoning": "Symptoms are consistent with an acute abdominal condition requiring emergency evaluation.",
        "confidence": 0.8,
    },
    {
        "keywords": ["allergic reaction", "swelling", "difficulty breathing", "anaphylaxis"],
        "associated": ["hives", "throat tightening", "wheezing"],
        "min_severity": 5,
        "level": "emergency",
        "reasoning": "Symptoms may suggest a severe allergic reaction. Immediate medical attention is advised.",
        "confidence": 0.85,
    },
    {
        "keywords": ["seizure", "convulsion", "fitting"],
        "associated": ["unconscious", "confusion", "foaming"],
        "min_severity": 6,
        "level": "emergency",
        "reasoning": "Seizure activity requires urgent medical evaluation to determine the underlying cause.",
        "confidence": 0.85,
    },
    # ---- Clinic ----
    {
        "keywords": ["fever", "cold", "cough", "flu", "sore throat"],
        "associated": ["runny nose", "body ache", "fatigue", "mild headache"],
        "min_severity": 1,
        "level": "clinic",
        "reasoning": "Symptoms are consistent with a common viral illness. A clinic visit is recommended for proper evaluation and symptom management.",
        "confidence": 0.8,
    },
    {
        "keywords": ["mild headache", "tension headache", "stress headache"],
        "associated": ["fatigue", "eye strain"],
        "min_severity": 1,
        "level": "clinic",
        "reasoning": "Mild headache symptoms suggest a non-urgent condition that can be evaluated at a clinic.",
        "confidence": 0.75,
    },
    {
        "keywords": ["back pain", "joint pain", "muscle pain", "sprain"],
        "associated": ["stiffness", "swelling", "limited movement"],
        "min_severity": 1,
        "level": "clinic",
        "reasoning": "Musculoskeletal symptoms suggest a non-emergency condition suitable for clinic evaluation.",
        "confidence": 0.75,
    },
    {
        "keywords": ["skin rash", "itching", "minor burn", "minor cut"],
        "associated": ["redness", "swelling", "mild pain"],
        "min_severity": 1,
        "level": "clinic",
        "reasoning": "Minor dermatological or skin symptoms can be effectively assessed at a clinic.",
        "confidence": 0.8,
    },
    # ---- Self-care ----
    {
        "keywords": ["mild cold", "runny nose", "sneezing"],
        "associated": [],
        "min_severity": 1,
        "level": "self-care",
        "reasoning": "Mild symptoms suggest a common cold that can typically be managed with rest, fluids, and over-the-counter remedies.",
        "confidence": 0.8,
    },
    {
        "keywords": ["mild headache"],
        "associated": [],
        "min_severity": 1,
        "level": "self-care",
        "reasoning": "A mild headache without other concerning symptoms can often be managed with rest and hydration.",
        "confidence": 0.7,
    },
]


def _normalize(text: str | None) -> str:
    return str(text or "").lower().strip()


def _rule_based_triage(symptoms: dict) -> tuple[str, str, float] | None:
    """
    Attempt rule-based triage. Returns (level, reasoning, confidence) or None.
    """
    chief = _normalize(symptoms.get("chief_complaint"))
    associated = [_normalize(s) for s in (symptoms.get("associated_symptoms") or [])]
    severity = symptoms.get("severity", 5)
    all_text = chief + " " + " ".join(associated)

    best_match = None
    best_score = 0

    for rule in TRIAGE_RULES:
        # Count keyword matches
        keyword_hits = sum(1 for kw in rule["keywords"] if kw in all_text)
        if keyword_hits == 0:
            continue

        # Count associated symptom matches
        assoc_hits = sum(1 for a in rule["associated"] if a in all_text)

        # Severity check
        if severity < rule["min_severity"]:
            continue

        # Score: keyword matches + bonus for associated symptoms
        score = keyword_hits + (assoc_hits * 0.5) + (severity / 10)

        if score > best_score:
            best_score = score
            best_match = (rule["level"], rule["reasoning"], rule["confidence"])

    return best_match


# ---------------------------------------------------------------------------
# LLM fallback prompt
# ---------------------------------------------------------------------------

TRIAGE_LLM_PROMPT = """You are a medical triage assistant for LifeRoute AI. Based on the patient's structured symptoms, determine the appropriate triage level.

CRITICAL RULES:
- NEVER state a diagnosis. Use language like "symptoms may suggest...", "consistent with...", "consider seeking care for..."
- Be conservative: when in doubt, escalate to a higher urgency level
- Respond ONLY with valid JSON

Triage levels (choose one):
- "self-care": Mild symptoms manageable at home with rest and OTC remedies
- "clinic": Non-urgent symptoms requiring professional evaluation within 24-48 hours
- "emergency": Urgent symptoms requiring immediate ER evaluation
- "icu": Critical, life-threatening symptoms requiring intensive care

Respond in this JSON format:
{
  "triage_level": "self-care" | "clinic" | "emergency" | "icu",
  "reasoning": "Plain-language explanation using cautious medical language. Never diagnose."
}"""


def _with_esi(level: str, reasoning: str, confidence: float = 0.8, esi: int | None = None) -> dict:
    resolved = esi if esi else LEGACY_TO_ESI.get(level, 4)
    return {
        "triage_level": level,
        "triage_reasoning": reasoning,
        "esi_level": resolved,
        "urgency_category": ESI_TO_URGENCY.get(resolved, "YELLOW"),
        "recommended_care_setting": CARE_SETTING.get(resolved, "PRIMARY_CLINIC"),
        "confidence_score": confidence,
    }


def triage_agent(state: dict) -> dict:
    """Triage patient symptoms using rules first, LLM fallback second."""

    user_esi = state.get("user_esi_level")
    if user_esi:
        esi = int(user_esi)
        level = ESI_TO_LEGACY.get(esi, "clinic")
        reasons = {
            1: "You marked this as life-threatening. Immediate resuscitation-level care is being arranged.",
            2: "You selected E2 Emergent. Matching a capable ER and ambulance without delay.",
            3: "You selected E3 Urgent. Matching a hospital ER for care as soon as capacity allows.",
            4: "You selected E4 Less urgent. Matching a clinic or OPD rather than emergency dispatch.",
            5: "You selected E5 Non-urgent. Advising self-care and a nearby clinic if symptoms persist.",
        }
        return _with_esi(level, reasons.get(esi, "Matching care for the selected ESI stage."), 0.95, esi=esi)

    if state.get("is_emergency"):
        return _with_esi(
            "icu",
            state.get("triage_reasoning")
            or "Critical vitals or a sentinel red flag require immediate emergency care.",
            confidence=0.99,
        )

    symptoms = state.get("structured_symptoms") or {}

    rule_result = _rule_based_triage(symptoms)

    if rule_result and rule_result[2] >= 0.7:
        level, reasoning, confidence = rule_result
        return _with_esi(level, reasoning, confidence)

    try:
        symptoms_text = json.dumps(symptoms, indent=2)
        result_text = chat_completion(
            f"{TRIAGE_LLM_PROMPT}\n\nPatient symptoms:\n{symptoms_text}",
            max_tokens=400,
        )
        parsed = parse_json_response(result_text)
        level = parsed.get("triage_level", "clinic")
        if level not in ("self-care", "clinic", "emergency", "icu"):
            level = "clinic"
        return _with_esi(
            level,
            parsed.get(
                "reasoning",
                "Based on the reported symptoms, a clinical evaluation is recommended.",
            ),
            confidence=0.65,
        )

    except Exception as e:
        print(f"[Triage Agent] LLM fallback error: {e}")
        return _with_esi(
            "clinic",
            "Unable to fully assess symptoms automatically. A clinic visit is recommended for proper professional evaluation.",
            confidence=0.4,
        )

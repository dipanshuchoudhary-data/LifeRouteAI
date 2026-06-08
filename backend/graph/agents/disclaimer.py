"""
LifeRoute AI — Disclaimer Node
Deterministic node (no LLM call). Appends standard medical disclaimer.
Also validates that triage output doesn't contain diagnosis-like statements.
"""

DISCLAIMER_TEXT = (
    "LifeRoute AI provides navigation guidance only. "
    "It is not a substitute for professional medical advice, diagnosis, or treatment. "
    "Always consult a qualified healthcare provider for medical concerns. "
    "In case of a life-threatening emergency, call 112 (India) immediately."
)

# Words that should NOT appear in triage reasoning (diagnosis-like language)
FORBIDDEN_PHRASES = [
    "you have",
    "you are suffering from",
    "diagnosis is",
    "diagnosed with",
    "you are experiencing",
    "this is a case of",
    "confirmed",
    "definitely",
    "certainly",
]


def _sanitize_reasoning(reasoning: str) -> str:
    """Remove any diagnosis-like statements from triage reasoning."""
    sanitized = reasoning
    for phrase in FORBIDDEN_PHRASES:
        if phrase.lower() in sanitized.lower():
            # Replace with cautious language
            sanitized = sanitized.replace(phrase, "symptoms may suggest")
            sanitized = sanitized.replace(phrase.capitalize(), "Symptoms may suggest")
            sanitized = sanitized.replace(phrase.upper(), "SYMPTOMS MAY SUGGEST")
    return sanitized


def disclaimer_agent(state: dict) -> dict:
    """Append medical disclaimer and sanitize any diagnosis-like statements."""

    # Sanitize triage reasoning if present
    triage_reasoning = state.get("triage_reasoning", "")
    sanitized_reasoning = _sanitize_reasoning(triage_reasoning)

    result = {"disclaimer": DISCLAIMER_TEXT}

    # Only update triage_reasoning if it was actually changed
    if sanitized_reasoning != triage_reasoning:
        result["triage_reasoning"] = sanitized_reasoning

    return result

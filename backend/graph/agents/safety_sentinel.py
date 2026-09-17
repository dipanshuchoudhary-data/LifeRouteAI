"""
LifeRoute AI 2.0 — Tier-0 Deterministic Safety Sentinel

Runs synchronously in-process BEFORE any LLM call.
Budget: < 20ms. Zero network I/O.

Matches ESI-1 / AHA STEMI / Cincinnati Prehospital Stroke Scale
red-flag language (English + Hindi) using compiled regex.
"""

from __future__ import annotations

import hashlib
import re
import time
from dataclasses import dataclass, field
from typing import Literal

TriageLevel = Literal["self-care", "clinic", "emergency", "icu"]

RED_FLAG_CATEGORIES: dict[str, list[str]] = {
    "CARDIOVASCULAR": [
        r"\bcrushing\s+(chest\s+)?(pain|pressure)\b",
        r"\bchest\s+(pain|pressure|tightness)\s+(radiat|spread)\w*\s+(to\s+)?(left\s+)?(arm|jaw|neck|shoulder)\b",
        r"\b(heart\s+attack|cardiac\s+arrest|myocardial|stemi)\b",
        r"\b(severe|crushing|heavy)\s+chest\s+(pain|pressure|tightness)\b",
        r"\bchest\s+(pain|pressure|tightness).{0,50}\b(breath|sweat|arm|jaw|nausea|faint)\w*\b",
        r"\b(pain|pressure)\s+(in\s+)?(my\s+)?chest\b.{0,40}\b(arm|jaw|sweat|breath)",
        r"\bsudden\s+onset\s+(racing\s+heart|palpitations?).{0,30}\b(faint|blackout|syncope|collapse)\b",
        r"\b(heart\s+attack|cardiac\s+arrest|not\s+breathing|no\s+pulse)\b",
        r"\bstemi\b",
        r"छाती\s*(में|का)?\s*(दर्द|दबाव)",
        r"दिल\s*(का\s*)?(दौरा|दर्द)",
    ],
    "NEUROLOGICAL_STROKE": [
        r"\b(sudden|acute)\s+(facial\s+droop|slurred\s+speech|loss\s+of\s+speech|face\s+drooping)\b",
        r"\bloss\s+of\s+speech\b",
        r"\b(one[- ]sided|unilateral)\s+(weakness|numbness|paralysis)\b",
        r"\b(face|facial)\s+(droop|drooping|uneven|asymm)\w*\b",
        r"\bslurr(ed)?\s+speech\b",
        r"\bworst\s+headache\s+of\s+(my\s+)?life\b",
        r"\b(stroke|brain\s+attack|cerebrovascular)\b",
        r"\b(sudden\s+)?(paralysis|can't\s+move\s+(arm|leg|one\s+side))\b",
        r"\bsudden\s+(vision\s+loss|blindness|confusion)\b",
        r"लकवा|फालिज|बोलने\s*में\s*तकलीफ|चेहरा\s*टेढ़ा",
    ],
    "RESPIRATORY_FAILURE": [
        r"\b(can'?t|cannot|unable\s+to|not)\s+breath(e|ing)?\b",
        r"\bturning\s+(blue|cyanotic|purple)\b",
        r"\bcyanotic\b",
        r"\b(severe\s+)?stridor\b",
        r"\bgasp(ing)?(\s+(for\s+air|to\s+breathe))?\b",
        r"\b(choking|airway\s+(closed|blocked)|no\s+air)\b",
        r"\b(severe\s+)?(breathing\s+difficulty|respiratory\s+distress|short(ness)?\s+of\s+breath).{0,20}\b(blue|cyanotic|unconscious|collapse)\b",
        r"सांस\s*नहीं\s*(आ\s*)?(रही|रहा)",
        r"दम\s*(घुट|घोंट)",
    ],
    "ANAPHYLAXIS": [
        r"\bthroat\s+(is\s+)?(closing|swelling|tightening)\b",
        r"\b(throat|airway)\s+(closing|swelling).{0,40}\b(bee|peanut|food|sting|medication|allergy|nut)\b",
        r"\bhives?\s+with\s+(difficulty\s+breathing|wheezing|throat)\b",
        r"\b(anaphylaxis|anaphylactic|severe\s+allergic\s+reaction)\b",
        r"\b(epipen|epi[- ]pen)\b",
        r"एलर्जी.{0,20}(सांस|गला)",
    ],
    "TRAUMA_HEMORRHAGE": [
        r"\buncontrolled\s+bleed(ing)?\b",
        r"\bspurt(ing)?\s+blood\b",
        r"\bpenetrating\s+(wound|injury)\s+(to\s+(the\s+)?)?(chest|neck|abdomen|head)\b",
        r"\b(major|severe|massive)\s+(bleeding|haemorrhage|hemorrhage|blood\s+loss)\b",
        r"\b(gunshot|stab(bed|bing)?|shot)\b",
        r"\b(major\s+)?trauma(\s+injur(y|ies))?\b",
        r"\b(road|car|bus|truck)?\s*accident\b",
        r"\b(unconscious|unresponsive|not\s+responding|passed\s+out|no\s+pulse)\b",
        r"खून\s*(बह|नहीं\s*रुक)",
        r"एक्सीडेंट|दुर्घटना",
    ],
    "OBSTETRIC_SEIZURE": [
        r"\b(seizure|convulsion|fitting|status\s+epilepticus)\b",
        r"\b(pregnant|pregnancy).{0,30}\b(seizure|bleeding|unconscious|severe\s+headache)\b",
        r"\b(active\s+labor|cord\s+prolapse|eclampsia)\b",
        r"दौरा\s*(पड़|आ)",
    ],
}

# Fast keyword pre-filter (lowercased) — cheap rejection of non-emergencies
_KEYWORD_TRIGGERS = (
    "chest pain",
    "heart attack",
    "cardiac arrest",
    "stroke",
    "paralysis",
    "slurred",
    "facial droop",
    "face droop",
    "can't breathe",
    "cannot breathe",
    "cant breathe",
    "unable to breathe",
    "not breathing",
    "turning blue",
    "cyanotic",
    "stridor",
    "gasping",
    "anaphylaxis",
    "throat closing",
    "throat swelling",
    "uncontrolled bleeding",
    "spurting",
    "gunshot",
    "stab",
    "unconscious",
    "unresponsive",
    "worst headache",
    "one-sided weakness",
    "one sided weakness",
    "crushing",
    "no pulse",
    "epipen",
    "छाती",
    "दिल का दौरा",
    "लकवा",
    "सांस नहीं",
    "बेहोश",
    "एक्सीडेंट",
    "खून",
)

EMERGENCY_INSTRUCTIONS = (
    "Call 108 immediately. Do not drive yourself. "
    "An emergency dispatch alert has been triggered. "
    "Stay on the line with emergency services and follow their instructions."
)

ESI_TO_LEGACY = {1: "icu", 2: "icu", 3: "emergency", 4: "clinic", 5: "self-care"}
LEGACY_TO_ESI = {"icu": 1, "emergency": 2, "clinic": 4, "self-care": 5}
ESI_TO_URGENCY = {1: "RED", 2: "RED", 3: "ORANGE", 4: "YELLOW", 5: "GREEN"}


@dataclass
class SentinelMatch:
    category: str
    pattern: str
    snippet: str


@dataclass
class SentinelResult:
    is_emergency: bool
    category: str | None = None
    matches: list[SentinelMatch] = field(default_factory=list)
    esi_level: int = 5
    urgency_category: str = "GREEN"
    triage_level: TriageLevel = "self-care"
    reason: str | None = None
    instructions: str | None = None
    elapsed_ms: float = 0.0
    input_hash: str = ""

    def to_state_update(self) -> dict:
        if not self.is_emergency:
            return {
                "is_emergency": False,
                "emergency_trigger_reason": None,
                "esi_level": None,
                "urgency_category": None,
                "sentinel_elapsed_ms": self.elapsed_ms,
                "input_hash": self.input_hash,
            }
        return {
            "is_emergency": True,
            "emergency_trigger_reason": self.reason,
            "esi_level": self.esi_level,
            "urgency_category": self.urgency_category,
            "triage_level": self.triage_level,
            "triage_reasoning": (
                f"Tier-0 safety sentinel intercepted a {self.category} red flag "
                f"before generative inference. {self.instructions}"
            ),
            "sentinel_elapsed_ms": self.elapsed_ms,
            "input_hash": self.input_hash,
            "immediate_actions": [
                "Call 108 now — do not delay",
                "Do not drive yourself",
                "If the person is unconscious, start CPR if trained",
                "Keep the airway clear; do not give food or water",
            ],
        }


_COMPILED: dict[str, list[re.Pattern[str]]] | None = None


def _compiled_patterns() -> dict[str, list[re.Pattern[str]]]:
    global _COMPILED
    if _COMPILED is None:
        _COMPILED = {
            category: [re.compile(pat, re.IGNORECASE | re.UNICODE) for pat in patterns]
            for category, patterns in RED_FLAG_CATEGORIES.items()
        }
    return _COMPILED


def _input_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def _likely_emergency(text: str) -> bool:
    lowered = text.lower()
    return any(token in lowered for token in _KEYWORD_TRIGGERS)


def scan_text(raw_input: str) -> SentinelResult:
    """Deterministic red-flag scan. Never calls an LLM."""
    started = time.perf_counter()
    text = (raw_input or "").strip()
    digest = _input_hash(text)

    if not text:
        return SentinelResult(
            is_emergency=False,
            elapsed_ms=(time.perf_counter() - started) * 1000,
            input_hash=digest,
        )

    matches: list[SentinelMatch] = []
    for category, patterns in _compiled_patterns().items():
        for pattern in patterns:
            found = pattern.search(text)
            if found:
                snippet = text[max(0, found.start() - 12) : found.end() + 12]
                matches.append(
                    SentinelMatch(category=category, pattern=pattern.pattern, snippet=snippet)
                )

    elapsed_ms = (time.perf_counter() - started) * 1000

    if not matches:
        return SentinelResult(is_emergency=False, elapsed_ms=elapsed_ms, input_hash=digest)

    primary = matches[0]
    reason = (
        f"ESI-1 red flag matched in category {primary.category} "
        f"(pattern hit: {primary.snippet!r})"
    )
    return SentinelResult(
        is_emergency=True,
        category=primary.category,
        matches=matches,
        esi_level=1,
        urgency_category="RED",
        triage_level="icu",
        reason=reason,
        instructions=EMERGENCY_INSTRUCTIONS,
        elapsed_ms=elapsed_ms,
        input_hash=digest,
    )


def safety_sentinel_agent(state: dict) -> dict:
    """LangGraph node: intercept life-threatening presentations unless the user chose an ESI stage."""
    result = scan_text(state.get("raw_input", ""))
    user_esi = state.get("user_esi_level")
    if user_esi:
        esi = int(user_esi)
        is_emergency = esi == 1
        update = {
            "is_emergency": is_emergency,
            "esi_level": esi,
            "user_esi_level": esi,
            "urgency_category": ESI_TO_URGENCY.get(esi, "YELLOW"),
            "triage_level": ESI_TO_LEGACY.get(esi, "clinic"),
            "sentinel_elapsed_ms": result.elapsed_ms,
            "input_hash": result.input_hash,
            "emergency_trigger_reason": "Patient selected ESI-1 (resuscitation)." if is_emergency else None,
        }
        if is_emergency:
            update["immediate_actions"] = [
                "Call 108 now — do not delay",
                "Do not drive yourself",
                "If the person is unconscious, start CPR if trained",
                "Keep the airway clear; do not give food or water",
            ]
            update["triage_reasoning"] = (
                "You marked this as life-threatening. Dispatching ambulance and the nearest capable ER."
            )
        elif result.is_emergency:
            update["triage_reasoning"] = (
                f"You selected ESI-{esi}. Red-flag language was noted, but matching follows your chosen urgency."
            )
    else:
        update = result.to_state_update()
    update["audit_trail"] = [
        {
            "node_name": "safety_sentinel",
            "agent_action": "user_esi" if user_esi else ("red_flag_scan" if result.is_emergency else "clear"),
            "input_hash": result.input_hash,
            "output_summary": f"user_esi_{user_esi}" if user_esi else (result.reason or "no_red_flag"),
            "elapsed_ms": round(result.elapsed_ms, 3),
        }
    ]
    return update


def route_after_sentinel(state: dict) -> Literal["emergency_fast_track", "intake"]:
    user_esi = state.get("user_esi_level")
    if user_esi:
        return "emergency_fast_track" if int(user_esi) == 1 else "intake"
    if state.get("is_emergency"):
        return "emergency_fast_track"
    return "intake"

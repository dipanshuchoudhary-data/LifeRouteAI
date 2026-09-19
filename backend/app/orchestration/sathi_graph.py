"""Companion LangGraph: intent → context → plan → authorize → tools → reply."""

from __future__ import annotations

import re
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph
from sqlalchemy.orm import Session

from app.application.dto import ActionType, AssistantAction, Intent
from app.core.logging import safe_log
from app.infrastructure.repositories import CompanionRepository
from app.orchestration.tools import REGISTRY, execute_tool
from app.security.authentication import CurrentUser
from app.security.sanitization import PROMPT_INJECTION_RULES, clean_text, wrap_untrusted
from app.services.context_service import select_context

HELP = re.compile(r"\b(help me|i need help|emergency|i fell|fell down|can't breathe|cant breathe|call 108|sos|unconscious)\b", re.I)
FAMILY = re.compile(r"\b(call|phone|talk to|message|tell|send|daughter|son|priya|rahul|family)\b", re.I)
FAMILY_ACT = re.compile(r"\b(call|phone|talk|message|tell|send)\b", re.I)
REMEMBER = re.compile(r"\b(remember|remind me)\b", re.I)
FOOD = re.compile(r"\b(eat|dinner|lunch|breakfast|food|meal|khichdi|diet|hungry)\b", re.I)
EXPLAIN = re.compile(r"\b(explain|letter|bill|form|notice|photo|picture|medicine package)\b", re.I)
DAY = re.compile(r"\b(today|my day|what do i have|what'?s important|appointment)\b", re.I)
HEALTH = re.compile(r"\b(medicine|tablet|allergy|dizzy|unwell|blood pressure|bp)\b", re.I)


class SathiState(TypedDict, total=False):
    message: str
    intent: str
    context: dict
    action: dict
    tool_results: list
    reply: str
    requires_confirmation: bool


def detect_intent(state: SathiState) -> dict:
    text = (state.get("message") or "").lower()
    if HELP.search(text):
        intent = Intent.emergency.value
    elif FAMILY_ACT.search(text) and FAMILY.search(text):
        intent = Intent.family.value
    elif REMEMBER.search(text):
        intent = Intent.memory.value
    elif FOOD.search(text):
        intent = Intent.food.value
    elif EXPLAIN.search(text):
        intent = Intent.explain.value
    elif DAY.search(text):
        intent = Intent.day.value
    elif HEALTH.search(text):
        intent = Intent.health.value
    else:
        intent = Intent.talk.value
    return {"intent": intent}


def _lookup_reply(intent: str, context: dict) -> str | None:
    if intent in {Intent.day.value, Intent.appointment.value}:
        items = context.get("today") or []
        if not items:
            return "Nothing special is saved for today. You can add a reminder any time."
        return "Here is today. " + ". ".join(items) + "."
    if intent == Intent.health.value:
        meds = context.get("medications") or []
        if meds:
            return f"I have your medicines as {', '.join(meds)}. This is what you saved, not a new diagnosis. If you feel unwell, say I need help or call 108."
        return "Tell me how you feel. If this is urgent, tap I need help or call 108."
    if intent == Intent.memory.value:
        notes = context.get("memories") or []
        return ("You asked me to remember: " + "; ".join(notes)) if notes else "You have not asked me to remember anything yet."
    if intent == Intent.family.value:
        names = [row["name"] for row in context.get("family") or [] if row.get("name")]
        if names:
            return f"I can help you call {', '.join(names)}. Open Family to call, or confirm if you want a message prepared."
        return "Add a family phone number first, then I can help you call."
    if intent == Intent.food.value:
        meals = context.get("meals") or {}
        breakfast = meals.get("breakfast") or "oats and fruit"
        lunch = meals.get("lunch") or "dal, roti and vegetables"
        dinner = meals.get("dinner") or "khichdi and curd"
        return (
            f"A simple idea for today is breakfast {breakfast}, lunch {lunch}, "
            f"and dinner {dinner}. This is everyday food help, not a medical diet."
        )
    if intent == Intent.explain.value:
        return "Show me a photo or paper and I will explain it in simple words."
    return None


def _structured_plan(message: str, intent: str, context: dict) -> AssistantAction:
    fallback = AssistantAction(intent=Intent(intent) if intent in Intent.__members__ else Intent.talk, action=ActionType.reply)
    try:
        from graph.llm_client import chat_completion, parse_json_response

        prompt = (
            f"{PROMPT_INJECTION_RULES}\n"
            "You are Sathi, a calm companion for an older adult in India. "
            "Return ONLY JSON: {\"intent\",\"action\",\"parameters\",\"requires_confirmation\",\"reply\"}. "
            f"Allowed actions: {[item.value for item in ActionType]}. "
            "Use notify_family or trigger_emergency only when the person clearly asked. "
            "Never diagnose. Food and medicine language must stay estimated.\n"
            f"Known facts (already filtered): {context}\n"
            f"{wrap_untrusted('untrusted_user_message', message)}"
        )
        parsed = parse_json_response(chat_completion(prompt, max_tokens=280))
        return AssistantAction.model_validate(parsed)
    except Exception:
        reply = _lookup_reply(intent, context) or ""
        fallback.reply = reply
        return fallback


def build_sathi_graph():
    graph = StateGraph(SathiState)
    graph.add_node("detect_intent", detect_intent)

    def select_ctx(state: SathiState) -> dict:
        return {}

    def plan(state: SathiState) -> dict:
        return {}

    def authorize(state: SathiState) -> dict:
        return {}

    def execute(state: SathiState) -> dict:
        return {}

    def respond(state: SathiState) -> dict:
        return {}

    graph.add_node("select_context", select_ctx)
    graph.add_node("plan", plan)
    graph.add_node("authorize", authorize)
    graph.add_node("execute", execute)
    graph.add_node("respond", respond)
    graph.add_edge(START, "detect_intent")
    graph.add_edge("detect_intent", "select_context")
    graph.add_edge("select_context", "plan")
    graph.add_edge("plan", "authorize")
    graph.add_edge("authorize", "execute")
    graph.add_edge("execute", "respond")
    graph.add_edge("respond", END)
    return graph.compile()


def run_sathi_turn(db: Session, user: CurrentUser, message: str, *, confirm: bool = False) -> dict[str, Any]:
    """Run the companion workflow. Lookups stay on the database."""
    text = clean_text(message, limit=2000)
    intent_state = detect_intent({"message": text})
    intent = intent_state["intent"]
    repo = CompanionRepository(db)
    record = repo.get_user(user.id)
    context = select_context(repo, record, intent) if record else {"name": user.name}
    repo.add_turn(user.id, "me", text, intent)

    if intent == Intent.emergency.value:
        from app.services.emergency_service import start_emergency

        emergency = start_emergency(db, user, text=text, source="voice", confirm=True)
        reply = "I prepared emergency help. Please call 108 now. Family has been notified."
        repo.add_turn(user.id, "sathi", reply, intent)
        return {
            "reply": reply,
            "intent": intent,
            "used_llm": False,
            "emergency": emergency,
            "requires_confirmation": False,
        }

    lookup = _lookup_reply(intent, context)
    if lookup and intent in {
        Intent.day.value,
        Intent.appointment.value,
        Intent.health.value,
        Intent.food.value,
    }:
        repo.add_turn(user.id, "sathi", lookup, intent)
        safe_log("sathi_turn", intent=intent, success=True, workflow="lookup")
        return {"reply": lookup, "intent": intent, "used_llm": False, "requires_confirmation": False}

    if intent == Intent.memory.value and re.search(r"\b(remember|remind me)\b", text, re.I) and not re.search(r"what (did|do) you remember", text, re.I):
        note = re.sub(r"^(please\s+)?(remember that|remember|remind me to|remind me)\s+", "", text, flags=re.I).strip()
        if note:
            result = execute_tool(db, user, "remember_note", {"text": note})
            reply = f"I will remember this: {result['text']}"
            repo.add_turn(user.id, "sathi", reply, intent)
            return {"reply": reply, "intent": intent, "used_llm": False, "tool": "remember_note"}

    action = _structured_plan(text, intent, context)
    tool_name = None
    if action.action == ActionType.notify_family:
        tool_name = "notify_family"
    elif action.action == ActionType.trigger_emergency:
        tool_name = "trigger_emergency"
    elif action.action == ActionType.remember:
        tool_name = "remember_note"

    if tool_name and action.requires_confirmation and not confirm:
        reply = action.reply or "Please confirm before I do that."
        repo.add_turn(user.id, "sathi", reply, intent)
        return {
            "reply": reply,
            "intent": intent,
            "used_llm": True,
            "requires_confirmation": True,
            "pending_tool": tool_name,
        }

    if tool_name in REGISTRY and (confirm or not action.requires_confirmation):
        params = dict(action.parameters)
        params["confirm"] = True if tool_name in {"notify_family", "trigger_emergency"} else params.get("confirm", False)
        try:
            execute_tool(db, user, tool_name, params)
        except Exception:
            safe_log("sathi_tool", tool=tool_name, success=False, error_category="tool")
            action.reply = action.reply or "I could not finish that action. Please try from the Family or Safety page."

    reply = (action.reply or lookup or "").strip()
    repo.add_turn(user.id, "sathi", reply, intent)
    safe_log("sathi_turn", intent=intent, success=True, workflow="graph")
    return {
        "reply": reply,
        "intent": action.intent.value,
        "used_llm": True,
        "requires_confirmation": False,
        "action": action.action.value,
    }

from graph.llm_client import finalize_companion_reply, looks_like_prompt_leak, safe_companion_fallback


LEAK = (
    "We are given a user message: hello sathi\n"
    "According to the instructions:\n"
    "We are Sathi, a calm daily companion for an older adult in India.\n"
    "Never diagnose or prescribe.\n"
    "Known facts (from the app) include name Mr. Sharma.\n"
    "We must reply in 2 to 6 short sentences."
)


def test_finalize_drops_system_prompt_leak():
    reply = finalize_companion_reply(LEAK, "hello sathi", {"name": "Mr. Sharma"})
    assert "how can i help you today" in reply.lower()
    assert reply.lower().startswith("hello")
    assert "according to the instructions" not in reply.lower()
    assert "never diagnose" not in reply.lower()
    assert "known facts" not in reply.lower()


def test_leak_detector_catches_planning():
    assert looks_like_prompt_leak(LEAK)
    assert not looks_like_prompt_leak("Hello Mr. Sharma. How can I help you today?")


def test_keeps_a_normal_greeting():
    reply = finalize_companion_reply(
        "Hello Mr. Sharma. It is good to hear from you. How can I help you today?",
        "hello sathi",
        {"name": "Mr. Sharma"},
    )
    assert "good to hear" in reply.lower()
    assert "instructions" not in reply.lower()


def test_safe_fallback_for_hello():
    assert "Hello Mr" in safe_companion_fallback("hello  sathi", {"name": "Mr. Sharma"})


def test_safe_fallback_for_booking_is_short():
    reply = safe_companion_fallback("can you book a meeting on 9.0 pm today", {"name": "Mr. Sharma"})
    assert "personal tasks" in reply.lower()
    assert "how can i help you today" not in reply.lower()

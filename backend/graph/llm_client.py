"""
LifeRoute AI — LLM Client (OpenRouter)
OpenAI-compatible API via OpenRouter for Claude and other models.
https://openrouter.ai/docs
"""

import os
import re

from openai import OpenAI

DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "anthropic/claude-sonnet-4"

_client: OpenAI | None = None


def get_openrouter_client() -> OpenAI:
    """Lazy-init OpenRouter client (OpenAI SDK + custom base URL)."""
    global _client
    if _client is None:
        api_key = os.getenv("OPENROUTER_API_KEY", "")
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY is not set in .env")

        base_url = os.getenv("OPENROUTER_BASE_URL", DEFAULT_BASE_URL).rstrip("/")

        default_headers = {}
        referer = os.getenv("OPENROUTER_HTTP_REFERER", "")
        app_name = os.getenv("OPENROUTER_APP_NAME", "LifeRoute AI")
        if referer:
            default_headers["HTTP-Referer"] = referer
        if app_name:
            default_headers["X-Title"] = app_name

        _client = OpenAI(
            api_key=api_key,
            base_url=base_url,
            default_headers=default_headers or None,
        )
    return _client


def get_model() -> str:
    """Model slug on OpenRouter (e.g. anthropic/claude-sonnet-4)."""
    return os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL)


def chat_completion(prompt: str, *, max_tokens: int = 500) -> str:
    """Single-turn chat completion via OpenRouter."""
    client = get_openrouter_client()
    response = client.chat.completions.create(
        model=get_model(),
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.choices[0].message.content
    return (content or "").strip()


def parse_json_response(text: str) -> dict:
    """Extract JSON from LLM output, including markdown code fences."""
    result_text = text.strip()
    if result_text.startswith("```"):
        result_text = result_text.split("```", 2)[1]
        if result_text.startswith("json"):
            result_text = result_text[4:]
        result_text = result_text.strip()
    # Try to find JSON object if wrapped in prose
    if not result_text.startswith("{"):
        match = re.search(r"\{[\s\S]*\}", result_text)
        if match:
            result_text = match.group(0)
    import json

    return json.loads(result_text)

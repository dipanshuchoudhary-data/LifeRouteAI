"""
LifeRoute AI — LLM Client

Thin wrapper over the official OpenRouter Python SDK (`pip install openrouter`),
which gives typed access to 400+ models behind one API key.

Configure in .env:

    LLM_API_KEY    OpenRouter key from https://openrouter.ai/keys
    LLM_MODEL      OpenRouter model slug, see https://openrouter.ai/models

Optional:

    LLM_SITE_URL   referrer shown on the OpenRouter dashboard
    LLM_APP_NAME   app title shown on the OpenRouter dashboard
    LLM_BASE_URL   override the API host (self-hosted gateway or proxy)
    LLM_FALLBACK_MODELS  comma-separated OpenRouter slugs
"""

import json
import os
import re

from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from openrouter import OpenRouter
from openrouter.errors import (
    OpenRouterDefaultError,
    PaymentRequiredResponseError,
    ProviderOverloadedResponseError,
    ResponseValidationError,
    TooManyRequestsResponseError,
    UnauthorizedResponseError,
)

DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"
DEFAULT_FALLBACKS = [
    "google/gemini-2.5-flash",
    "meta-llama/llama-3.3-70b-instruct",
    "openai/gpt-4o-mini",
]

_client: OpenRouter | None = None


class LLMError(RuntimeError):
    """Raised when OpenRouter cannot return a usable completion."""


def _first_env(*names: str, default: str = "") -> str:
    """Return the first non-empty environment variable among names."""
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    return default


def get_model() -> str:
    """OpenRouter model slug, e.g. anthropic/claude-sonnet-4.5."""
    return _first_env("LLM_MODEL", "OPENROUTER_MODEL", default=DEFAULT_MODEL)


def get_voice_model() -> str:
    """OpenRouter omni/audio model used for speech transcription."""
    return _first_env(
        "VOICE_LLM",
        "Voice_LLM",
        "VOICE_MODEL",
        default="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    )


def get_fallback_models() -> list[str]:
    raw = _first_env("LLM_FALLBACK_MODELS")
    if raw:
        return [item.strip() for item in raw.split(",") if item.strip()]
    primary = get_model()
    return [model for model in DEFAULT_FALLBACKS if model != primary]


def get_client() -> OpenRouter:
    """Lazy-init the OpenRouter SDK client."""
    global _client
    if _client is None:
        api_key = _first_env("LLM_API_KEY", "OPENROUTER_API_KEY")
        if not api_key:
            raise LLMError(
                "No OpenRouter credentials found. Set LLM_API_KEY in .env "
                "using a key from https://openrouter.ai/keys."
            )

        kwargs = {
            "api_key": api_key,
            "http_referer": _first_env("LLM_SITE_URL", "OPENROUTER_HTTP_REFERER") or None,
            "x_open_router_title": _first_env(
                "LLM_APP_NAME", "OPENROUTER_APP_NAME", default="LifeRoute AI"
            ),
        }

        server_url = _first_env("LLM_BASE_URL", "OPENROUTER_BASE_URL")
        if server_url:
            kwargs["server_url"] = server_url.rstrip("/")

        _client = OpenRouter(**kwargs)
    return _client


def reset_client() -> None:
    """Drop the cached client so later calls pick up changed configuration."""
    global _client
    _client = None


def describe_provider() -> dict[str, str | bool | list[str]]:
    """Non-secret view of the active LLM configuration, for /health."""
    return {
        "provider": "openrouter",
        "base_url": _first_env(
            "LLM_BASE_URL", "OPENROUTER_BASE_URL", default="https://openrouter.ai/api/v1"
        ),
        "model": get_model(),
        "voice_model": get_voice_model(),
        "fallback_models": get_fallback_models(),
        "credentials_configured": bool(_first_env("LLM_API_KEY", "OPENROUTER_API_KEY")),
    }


def _complete_once(model: str, prompt: str, max_tokens: int) -> str:
    try:
        response = get_client().chat.send(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            stream=False,
        )
    except (ProviderOverloadedResponseError, TooManyRequestsResponseError) as e:
        raise LLMError(f"{model}: provider busy or rate limited — {e}") from e
    except UnauthorizedResponseError as e:
        raise LLMError(f"{model}: OpenRouter rejected the API key — {e}") from e
    except PaymentRequiredResponseError as e:
        raise LLMError(f"{model}: OpenRouter credits exhausted — {e}") from e
    except ResponseValidationError as e:
        raise LLMError(f"{model}: provider returned an error instead of a completion — {e}") from e
    except OpenRouterDefaultError as e:
        raise LLMError(f"{model}: {e}") from e

    if not response.choices:
        raise LLMError(f"{model}: OpenRouter returned no choices")

    content = response.choices[0].message.content
    return (content or "").strip()


@retry(
    retry=retry_if_exception_type(LLMError),
    wait=wait_exponential(multiplier=0.4, min=0.4, max=4),
    stop=stop_after_attempt(2),
    reraise=True,
)
def _complete_with_retry(model: str, prompt: str, max_tokens: int) -> str:
    return _complete_once(model, prompt, max_tokens)


def chat_completion(prompt: str, *, max_tokens: int = 500) -> str:
    """Single-turn chat completion with exponential backoff and model fallback."""
    models = [get_model(), *get_fallback_models()]
    last_error: Exception | None = None
    for model in models:
        try:
            return _complete_with_retry(model, prompt, max_tokens)
        except LLMError as exc:
            last_error = exc
            continue
    raise LLMError(f"All LLM providers failed. Last error: {last_error}") from last_error


def parse_json_response(text: str) -> dict:
    """Extract JSON from LLM output, including markdown code fences."""
    result_text = text.strip()
    if result_text.startswith("```"):
        result_text = result_text.split("```", 2)[1]
        if result_text.startswith("json"):
            result_text = result_text[4:]
        result_text = result_text.strip()
    if not result_text.startswith("{"):
        match = re.search(r"\{[\s\S]*\}", result_text)
        if match:
            result_text = match.group(0)

    return json.loads(result_text)


def _audio_format(mime: str) -> str:
    value = (mime or "").split(";")[0].strip().lower()
    mapping = {
        "audio/wav": "wav",
        "audio/x-wav": "wav",
        "audio/wave": "wav",
        "audio/mpeg": "mp3",
        "audio/mp3": "mp3",
        "audio/mp4": "m4a",
        "audio/m4a": "m4a",
        "audio/aac": "aac",
        "audio/ogg": "ogg",
        "audio/webm": "ogg",
        "audio/flac": "flac",
    }
    return mapping.get(value, "wav")


def _message_text(content) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                parts.append(str(item.get("text") or ""))
        return " ".join(parts)
    return str(content)


def strip_reasoning(text: str) -> str:
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text or "", flags=re.IGNORECASE)
    cleaned = re.sub(r"^```(?:text|json)?\s*|\s*```$", "", cleaned.strip())
    return cleaned.strip().strip('"').strip("'")


TRANSCRIBE_PROMPT = (
    "You are a clinical speech transcriber for Indian patients. "
    "Transcribe the spoken symptoms exactly, in the original language (English or Hindi). "
    "Return only the transcript. No quotes, labels, or commentary."
)


def transcribe_audio(audio_bytes: bytes, mime: str = "audio/wav") -> str:
    """Send audio to the configured Voice_LLM omni model and return a transcript."""
    if not audio_bytes:
        raise LLMError("Empty audio payload")
    if len(audio_bytes) > 3_500_000:
        raise LLMError("Audio clip is too large. Speak for under 12 seconds.")

    import base64
    import httpx

    api_key = _first_env("LLM_API_KEY", "OPENROUTER_API_KEY")
    if not api_key:
        raise LLMError("No OpenRouter credentials found. Set LLM_API_KEY in .env.")

    model = get_voice_model()
    base_url = _first_env(
        "LLM_BASE_URL", "OPENROUTER_BASE_URL", default="https://openrouter.ai/api/v1"
    ).rstrip("/")
    audio_format = _audio_format(mime)
    encoded = base64.b64encode(audio_bytes).decode("ascii")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": _first_env("LLM_SITE_URL", "OPENROUTER_HTTP_REFERER") or "http://localhost",
        "X-Title": _first_env("LLM_APP_NAME", "OPENROUTER_APP_NAME", default="LifeRoute AI"),
    }

    attempts = [
        [
            {"type": "text", "text": TRANSCRIBE_PROMPT},
            {"type": "input_audio", "input_audio": {"data": encoded, "format": audio_format}},
        ],
        [
            {"type": "text", "text": TRANSCRIBE_PROMPT},
            {"type": "audio_url", "audio_url": {"url": f"data:audio/{audio_format};base64,{encoded}"}},
        ],
    ]

    last_error: Exception | None = None
    for content in attempts:
        try:
            with httpx.Client(timeout=90.0) as client:
                response = client.post(
                    f"{base_url}/chat/completions",
                    headers=headers,
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": content}],
                        "max_tokens": 400,
                        "temperature": 0.1,
                    },
                )
            if response.status_code >= 400:
                last_error = LLMError(f"{model}: {response.status_code} {response.text[:240]}")
                continue
            payload = response.json()
            choices = payload.get("choices") or []
            if not choices:
                last_error = LLMError(f"{model}: OpenRouter returned no choices")
                continue
            text = strip_reasoning(_message_text(choices[0].get("message", {}).get("content")))
            if text:
                return text
            last_error = LLMError(f"{model}: empty transcript")
        except httpx.HTTPError as exc:
            last_error = LLMError(f"{model}: {exc}")
            continue

    raise LLMError(f"Voice transcription failed. Last error: {last_error}") from last_error

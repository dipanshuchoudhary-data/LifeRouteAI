"""STT / TTS provider interfaces. Keys stay on the server."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Transcript:
    text: str
    provider: str
    simulated: bool = False


@dataclass(frozen=True)
class SpeechAudio:
    text: str
    provider: str
    simulated: bool = True
    note: str = "Use the browser voice, or configure ElevenLabs on the server."


class SpeechToTextProvider:
    def transcribe(self, audio: bytes, mime: str) -> Transcript:
        raise NotImplementedError


class TextToSpeechProvider:
    def speak(self, text: str) -> SpeechAudio:
        raise NotImplementedError


class MockSpeechProvider(SpeechToTextProvider, TextToSpeechProvider):
    def transcribe(self, audio: bytes, mime: str) -> Transcript:
        return Transcript(text="", provider="mock", simulated=True)

    def speak(self, text: str) -> SpeechAudio:
        return SpeechAudio(text=text, provider="mock", simulated=True)


class OpenRouterSpeechProvider(SpeechToTextProvider):
    def transcribe(self, audio: bytes, mime: str) -> Transcript:
        from graph.llm_client import get_voice_model, transcribe_audio

        return Transcript(text=transcribe_audio(audio, mime), provider=get_voice_model(), simulated=False)


class ElevenLabsProvider(TextToSpeechProvider):
    def speak(self, text: str) -> SpeechAudio:
        import os

        if not os.getenv("ELEVENLABS_API_KEY", "").strip():
            return MockSpeechProvider().speak(text)
        return SpeechAudio(
            text=text,
            provider="elevenlabs",
            simulated=True,
            note="ElevenLabs key is present. Audio streaming is reserved for a later hook-up.",
        )


def get_stt_provider() -> SpeechToTextProvider:
    import os

    if os.getenv("LLM_API_KEY") or os.getenv("OPENROUTER_API_KEY"):
        return OpenRouterSpeechProvider()
    return MockSpeechProvider()


def get_tts_provider() -> TextToSpeechProvider:
    import os

    if os.getenv("ELEVENLABS_API_KEY", "").strip():
        return ElevenLabsProvider()
    return MockSpeechProvider()

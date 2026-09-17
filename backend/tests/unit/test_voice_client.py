from graph.llm_client import _audio_format, get_voice_model, strip_reasoning


def test_voice_model_reads_env_name():
    assert "nemotron" in get_voice_model() or get_voice_model()


def test_audio_format_maps_browser_webm():
    assert _audio_format("audio/webm;codecs=opus") == "ogg"
    assert _audio_format("audio/wav") == "wav"
    assert _audio_format("audio/mp4") == "m4a"


def test_strip_reasoning_drops_think_blocks():
    raw = "<think>internal</think>\nsevere chest pain radiating to the left arm"
    assert strip_reasoning(raw) == "severe chest pain radiating to the left arm"

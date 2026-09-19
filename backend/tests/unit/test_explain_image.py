import base64
import io

from PIL import Image, ImageDraw, ImageFont


def _label_b64() -> str:
    image = Image.new("RGB", (900, 260), "white")
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("arial.ttf", 64)
    except OSError:
        font = ImageFont.load_default()
    draw.text((40, 90), "METFORMIN 500 mg", fill="black", font=font)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def test_explain_image_uses_ocr_then_llm(monkeypatch):
    from app.services import ocr_service
    from graph import llm_client

    monkeypatch.setattr(ocr_service, "ocr_photo", lambda data: "METFORMIN 500 mg")
    monkeypatch.setattr(
        llm_client,
        "_explain_completion",
        lambda prompt, ocr_text="", max_tokens=280: "This is metformin 500 mg. Take it as your doctor told you.",
    )
    monkeypatch.setattr(
        llm_client,
        "_vision_complete",
        lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("vision should not run when OCR works")),
    )

    reply = llm_client.explain_image(_label_b64(), "image/png", "What is this?")
    assert "metformin" in reply.lower()


def test_finalize_simple_reply_strips_planning():
    from graph.llm_client import finalize_simple_reply

    dump = (
        'We need to respond as Sathi. Avoid medical jargon.\n\n'
        'So we say: "This looks like a label for a medicine called metformin, 500 mg." '
        '"Keep it stored as directed and check with your pharmacist."'
    )
    reply = finalize_simple_reply(dump, ocr_text="METFORMIN 500 mg")
    assert "metformin" in reply.lower()
    assert "we need to respond" not in reply.lower()


def test_finalize_reads_answer_marker():
    from graph.llm_client import finalize_simple_reply

    dump = (
        "We need to follow the rules.\n"
        "ANSWER: This looks like a metformin 500 mg medicine label. "
        "Keep it in a safe place. Ask your doctor or pharmacist if you are unsure."
    )
    reply = finalize_simple_reply(dump, ocr_text="METFORMIN 500 mg")
    assert reply.startswith("This looks like")
    assert "we need to follow" not in reply.lower()


def test_finalize_cuts_reasoning_tail():
    from graph.llm_client import finalize_simple_reply

    dump = (
        "This is a label showing a medicine called Metformin 500 mg. "
        "Avoid jargon: Metformin is okay? We need to give one simple next step."
    )
    reply = finalize_simple_reply(dump, ocr_text="METFORMIN 500 mg")
    assert "metformin" in reply.lower()
    assert "avoid jargon" not in reply.lower()
    assert "we need to" not in reply.lower()

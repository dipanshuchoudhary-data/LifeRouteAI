import io

from PIL import Image, ImageDraw, ImageFont

from app.services.ocr_service import ocr_photo, prepare_photo


def _label_png() -> bytes:
    image = Image.new("RGB", (900, 260), "white")
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("arial.ttf", 64)
    except OSError:
        font = ImageFont.load_default()
    draw.text((40, 90), "METFORMIN 500 mg", fill="black", font=font)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_prepare_photo_returns_jpeg():
    jpeg, mime = prepare_photo(_label_png())
    assert mime == "image/jpeg"
    assert jpeg[:2] == b"\xff\xd8"


def test_ocr_reads_medicine_label():
    text = ocr_photo(_label_png()).upper()
    assert "METFORMIN" in text
    assert "500" in text

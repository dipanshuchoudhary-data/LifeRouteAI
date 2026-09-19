"""Local OCR for letters, bills, medicine packs, and phone screens."""

from __future__ import annotations

import io
import os
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

from app.security.sanitization import clean_text

TESSDATA_DIR = Path(__file__).resolve().parents[2] / "data" / "tessdata"
ENG_DATA_URL = "https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata"
WINDOWS_TESSERACT = Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe")


def prepare_photo(data: bytes) -> tuple[bytes, str]:
    """Normalize any allowed photo to a compact JPEG the LLM and OCR can read."""
    image = Image.open(io.BytesIO(data))
    image = image.convert("RGB")
    image.thumbnail((1280, 1280))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=82, optimize=True)
    return buffer.getvalue(), "image/jpeg"


def _for_ocr(data: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(data)).convert("RGB")
    if min(image.size) < 420:
        image = image.resize((image.width * 2, image.height * 2), Image.Resampling.LANCZOS)
    gray = ImageOps.grayscale(image)
    gray = ImageOps.autocontrast(gray)
    return ImageEnhance.Contrast(gray).enhance(1.4)


def _ensure_tessdata() -> Path:
    TESSDATA_DIR.mkdir(parents=True, exist_ok=True)
    eng = TESSDATA_DIR / "eng.traineddata"
    if eng.exists() and eng.stat().st_size > 1000:
        return TESSDATA_DIR
    import urllib.request

    urllib.request.urlretrieve(ENG_DATA_URL, eng)
    return TESSDATA_DIR


def _configure_tesseract() -> bool:
    try:
        import pytesseract
    except ImportError:
        return False
    if WINDOWS_TESSERACT.exists():
        pytesseract.pytesseract.tesseract_cmd = str(WINDOWS_TESSERACT)
    try:
        _ensure_tessdata()
    except Exception:
        return False
    os.environ["TESSDATA_PREFIX"] = str(TESSDATA_DIR)
    return True


def ocr_photo(data: bytes) -> str:
    """Read printed text with Tesseract when it is available."""
    if not _configure_tesseract():
        return ""
    import pytesseract

    gray = _for_ocr(data)
    try:
        text = pytesseract.image_to_string(gray, lang="eng", config="--psm 6") or ""
    except Exception:
        return ""
    return clean_text(text, limit=3500)

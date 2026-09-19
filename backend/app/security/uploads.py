"""Do not trust Content-Type, filename, or extension from the client alone."""

from __future__ import annotations

import base64
import binascii
import re
from dataclasses import dataclass

from app.core.config import settings
from app.core.constants import ALLOWED_IMAGE_EXTS, ALLOWED_IMAGE_MIMES, FORBIDDEN_EXTENSIONS
from app.core.exceptions import ValidationException

_UNSAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")

_MAGIC = (
    (b"\xff\xd8\xff", "image/jpeg", ".jpg"),
    (b"\x89PNG\r\n\x1a\n", "image/png", ".png"),
    (b"RIFF", "image/webp", ".webp"),  # refined below
    (b"GIF87a", "image/gif", ".gif"),
    (b"GIF89a", "image/gif", ".gif"),
)


@dataclass(frozen=True)
class ValidatedUpload:
    data: bytes
    mime: str
    extension: str
    filename: str
    size: int


def sanitize_filename(name: str | None) -> str:
    if ".." in (name or ""):
        raise ValidationException("That file name is not allowed.")
    base = (name or "upload").replace("\\", "/").split("/")[-1]
    base = _UNSAFE_NAME.sub("_", base).strip("._") or "upload"
    if any(base.lower().endswith(bad) for bad in FORBIDDEN_EXTENSIONS):
        raise ValidationException("That file type is not allowed.")
    return base[:80]


def _detect(data: bytes) -> tuple[str, str]:
    if data.startswith(b"RIFF") and b"WEBP" in data[:16]:
        return "image/webp", ".webp"
    for magic, mime, ext in _MAGIC:
        if magic != b"RIFF" and data.startswith(magic):
            return mime, ext
    raise ValidationException("Only photo files (JPEG, PNG, WebP, or GIF) are allowed.")


def validate_image_bytes(data: bytes, *, filename: str = "photo.jpg", claimed_mime: str = "") -> ValidatedUpload:
    if not data:
        raise ValidationException("No photo was received.")
    if len(data) > settings.max_upload_bytes:
        raise ValidationException("That photo is too large. Please use a smaller picture.")
    mime, ext = _detect(data)
    claimed = (claimed_mime or mime).split(";")[0].strip().lower()
    if claimed not in ALLOWED_IMAGE_MIMES or mime not in ALLOWED_IMAGE_MIMES:
        raise ValidationException("Only photo files are allowed.")
    lower_name = (filename or "").lower()
    if any(lower_name.endswith(bad) for bad in FORBIDDEN_EXTENSIONS) or ".." in (filename or ""):
        raise ValidationException("That file type is not allowed.")
    safe_name = sanitize_filename(filename)
    lower = safe_name.lower()
    if any(lower.endswith(bad) for bad in FORBIDDEN_EXTENSIONS):
        raise ValidationException("That file type is not allowed.")
    if not any(lower.endswith(ok) for ok in ALLOWED_IMAGE_EXTS):
        safe_name = f"{safe_name}{ext}"
    return ValidatedUpload(data=data, mime=mime, extension=ext, filename=safe_name, size=len(data))


def decode_image_b64(image_b64: str, *, mime: str = "image/jpeg", filename: str = "photo.jpg") -> ValidatedUpload:
    raw = (image_b64 or "").strip()
    if "," in raw and raw.lower().startswith("data:"):
        raw = raw.split(",", 1)[1]
    try:
        data = base64.b64decode(raw, validate=False)
    except (binascii.Error, ValueError) as exc:
        raise ValidationException("That photo could not be read.") from exc
    return validate_image_bytes(data, filename=filename, claimed_mime=mime)

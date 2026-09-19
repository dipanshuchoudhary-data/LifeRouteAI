import base64

from app.core.exceptions import ValidationException
from app.security.uploads import decode_image_b64, sanitize_filename, validate_image_bytes


PNG = (
    b"\x89PNG\r\n\x1a\n"
    + b"\x00\x00\x00\rIHDR"
    + b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
    + b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_rejects_executable_name():
    try:
        sanitize_filename("../evil.exe")
        assert False
    except ValidationException:
        pass


def test_accepts_png_magic():
    upload = validate_image_bytes(PNG, filename="shot.PNG", claimed_mime="image/png")
    assert upload.mime == "image/png"
    assert upload.size == len(PNG)


def test_rejects_random_bytes():
    try:
        validate_image_bytes(b"MZ not an image", filename="photo.jpg", claimed_mime="image/jpeg")
        assert False
    except ValidationException:
        pass


def test_decode_base64_png():
    encoded = base64.b64encode(PNG).decode("ascii")
    upload = decode_image_b64(encoded, mime="image/png", filename="a.png")
    assert upload.mime == "image/png"

from unittest.mock import Mock

from fastapi import HTTPException

from app.security.rate_limit import enforce_rate_limit, reset_rate_limit


def _request(ip="203.0.113.8"):
    request = Mock()
    request.headers = {}
    request.client.host = ip
    return request


def test_shared_bucket_blocks_after_window():
    reset_rate_limit()
    request = _request()
    for _ in range(30):
        enforce_rate_limit(request)
    try:
        enforce_rate_limit(request)
        assert False, "expected 429"
    except HTTPException as exc:
        assert exc.status_code == 429


def test_forwarded_for_uses_first_ip():
    reset_rate_limit()
    first = Mock()
    first.headers = {"x-forwarded-for": "198.51.100.4, 10.0.0.1"}
    first.client.host = "10.0.0.1"
    second = Mock()
    second.headers = {"x-forwarded-for": "198.51.100.4"}
    second.client.host = "192.0.2.1"
    for _ in range(30):
        enforce_rate_limit(first)
    try:
        enforce_rate_limit(second)
        assert False, "expected shared client bucket"
    except HTTPException as exc:
        assert exc.status_code == 429

import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))


@pytest.fixture(autouse=True)
def _reset_rate_limit():
    from app.security.rate_limit import reset_rate_limit

    reset_rate_limit()
    yield
    reset_rate_limit()

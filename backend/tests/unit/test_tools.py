from app.core.exceptions import ValidationException
from app.orchestration.tools import REGISTRY, execute_tool


class FakeUser:
    id = "nobody"
    name = "X"
    role = "senior"


def test_unknown_tool_rejected():
    try:
        execute_tool(None, FakeUser(), "drop_database", {})
        assert False
    except ValidationException:
        pass


def test_registry_is_allowlisted():
    assert "trigger_emergency" in REGISTRY
    assert "notify_family" in REGISTRY
    assert "os.system" not in REGISTRY

from graph.agents.triage import _normalize, _rule_based_triage


def test_normalize_accepts_missing_text():
    assert _normalize(None) == ""
    assert _normalize("") == ""


def test_rule_triage_survives_empty_symptoms():
    assert _rule_based_triage({}) is None
    assert _rule_based_triage({"chief_complaint": None, "associated_symptoms": None}) is None

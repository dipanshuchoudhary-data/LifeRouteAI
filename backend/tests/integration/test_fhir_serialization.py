from fhir.serializers import serialize_fhir_bundle


def test_bundle_contains_required_resources():
    bundle = serialize_fhir_bundle(
        {
            "session_id": "test-session",
            "raw_input": "severe chest pain",
            "structured_symptoms": {"chief_complaint": "chest pain", "age": 54, "gender": "male"},
            "esi_level": 1,
            "triage_reasoning": "Symptoms may suggest a cardiac emergency.",
            "selected_facility": {"name": "Fortis Escorts Heart Institute"},
            "routing_reason": "Cath lab available",
            "input_hash": "abc",
        }
    )
    assert bundle["resourceType"] == "Bundle"
    types = [entry["resource"]["resourceType"] for entry in bundle["entry"]]
    assert types == ["Patient", "Condition", "Encounter", "ServiceRequest"]
    condition = bundle["entry"][1]["resource"]
    assert condition["code"]["coding"][0]["system"] == "http://snomed.info/sct"
    assert condition["verificationStatus"]["coding"][0]["code"] == "unconfirmed"
    encounter = bundle["entry"][2]["resource"]
    assert encounter["priority"]["coding"][0]["display"] == "ESI 1"


def test_does_not_embed_raw_name():
    bundle = serialize_fhir_bundle(
        {
            "session_id": "secret-user",
            "structured_symptoms": {"chief_complaint": "fever", "gender": "unknown"},
            "esi_level": 4,
            "selected_facility": {"name": "Max Super Speciality Hospital"},
        }
    )
    dumped = str(bundle)
    assert "secret-user" not in dumped

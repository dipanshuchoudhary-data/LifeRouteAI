"""
HL7 FHIR R4 bundle serializer for LifeRoute triage encounters.

Produces Patient, Condition, Encounter, and ServiceRequest resources
that a receiving EHR can ingest. Identifiers are pseudo-anonymized.
"""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone

SNOMED_BY_KEYWORD = [
    ("chest", ("29857009", "Chest pain")),
    ("heart", ("29857009", "Chest pain")),
    ("stroke", ("230690007", "Cerebrovascular accident")),
    ("paralysis", ("26544005", "Muscle weakness")),
    ("breath", ("267036007", "Dyspnea")),
    ("trauma", ("417746004", "Traumatic injury")),
    ("bleed", ("131148009", "Bleeding")),
    ("fever", ("386661006", "Fever")),
    ("seizure", ("91175000", "Seizure")),
    ("allerg", ("39579001", "Anaphylaxis")),
    ("headache", ("25064002", "Headache")),
    ("accident", ("417746004", "Traumatic injury")),
]


ESI_PRIORITY = {1: "stat", 2: "asap", 3: "urgent", 4: "routine", 5: "routine"}
ESI_CLASS = {1: "EMER", 2: "EMER", 3: "EMER", 4: "AMB", 5: "AMB"}


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _uuid(name: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, name))


def _snomed(complaint: str) -> tuple[str, str]:
    text = (complaint or "").lower()
    for keyword, pair in SNOMED_BY_KEYWORD:
        if keyword in text:
            return pair
    return ("404684003", "Clinical finding")


def serialize_fhir_bundle(state: dict) -> dict:
    symptoms = state.get("structured_symptoms") or {}
    complaint = symptoms.get("chief_complaint") or state.get("raw_input") or "Unspecified presentation"
    esi = int(state.get("esi_level") or 4)
    session_id = state.get("session_id") or "anonymous"
    facility = state.get("selected_facility") or {}
    code, display = _snomed(complaint)
    patient_id = _uuid(f"patient:{session_id}")
    encounter_id = _uuid(f"encounter:{session_id}:{state.get('input_hash', '')}")
    condition_id = _uuid(f"condition:{session_id}:{complaint}")
    order_id = _uuid(f"order:{session_id}")
    stamp = _now()

    age = symptoms.get("age")
    gender = (symptoms.get("gender") or "unknown").lower()
    if gender not in ("male", "female", "other"):
        gender = "unknown"

    patient = {
        "resourceType": "Patient",
        "id": patient_id,
        "identifier": [
            {
                "system": "https://liferoute.ai/session",
                "value": hashlib.sha256(session_id.encode()).hexdigest()[:16],
            }
        ],
        "gender": gender,
        "extension": [],
    }
    if age not in (None, "", "null"):
        patient["extension"].append(
            {
                "url": "http://hl7.org/fhir/StructureDefinition/patient-age",
                "valueInteger": int(age) if str(age).isdigit() else None,
            }
        )

    condition = {
        "resourceType": "Condition",
        "id": condition_id,
        "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]},
        "verificationStatus": {
            "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status", "code": "unconfirmed"}]
        },
        "code": {
            "coding": [{"system": "http://snomed.info/sct", "code": code, "display": display}],
            "text": complaint,
        },
        "subject": {"reference": f"Patient/{patient_id}"},
        "note": [{"text": state.get("triage_reasoning") or "Symptoms as reported by the patient. Not a diagnosis."}],
    }

    encounter = {
        "resourceType": "Encounter",
        "id": encounter_id,
        "status": "planned",
        "class": {"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": ESI_CLASS.get(esi, "AMB")},
        "priority": {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ActPriority",
                    "code": ESI_PRIORITY.get(esi, "routine"),
                    "display": f"ESI {esi}",
                }
            ]
        },
        "subject": {"reference": f"Patient/{patient_id}"},
        "reasonCode": [{"text": complaint}],
        "serviceProvider": {"display": facility.get("name") or "Unassigned facility"},
        "period": {"start": stamp},
    }

    service_request = {
        "resourceType": "ServiceRequest",
        "id": order_id,
        "status": "active",
        "intent": "order",
        "priority": ESI_PRIORITY.get(esi, "routine"),
        "code": {"text": "Emergency evaluation" if esi <= 3 else "Clinical evaluation"},
        "subject": {"reference": f"Patient/{patient_id}"},
        "encounter": {"reference": f"Encounter/{encounter_id}"},
        "authoredOn": stamp,
        "requester": {"display": "LifeRoute AI Clinical Navigation"},
        "performer": [{"display": facility.get("name") or "Receiving hospital"}],
        "note": [{"text": state.get("routing_reason") or ""}],
    }

    bundle = {
        "resourceType": "Bundle",
        "id": _uuid(f"bundle:{session_id}:{stamp}"),
        "type": "transaction",
        "timestamp": stamp,
        "entry": [
            {"fullUrl": f"urn:uuid:{patient_id}", "resource": patient, "request": {"method": "POST", "url": "Patient"}},
            {"fullUrl": f"urn:uuid:{condition_id}", "resource": condition, "request": {"method": "POST", "url": "Condition"}},
            {"fullUrl": f"urn:uuid:{encounter_id}", "resource": encounter, "request": {"method": "POST", "url": "Encounter"}},
            {"fullUrl": f"urn:uuid:{order_id}", "resource": service_request, "request": {"method": "POST", "url": "ServiceRequest"}},
        ],
    }
    return bundle

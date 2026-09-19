# LifeRoute AI 2.0 — Comprehensive Engineering Architecture & Implementation Blueprint

---

## Document Metadata
- **Document Version**: 2.0.0-PROD-SPEC
- **Author**: Principal AI/ML Engineer, Staff Systems Architect & Healthcare Clinical Solutions Architect
- **Target System**: LifeRoute AI 2.0 (Evolution from Hackathon Prototype to Production-Grade Clinical Navigation System)
- **Classification**: Safety-Critical Medical Navigation & Healthcare Dispatch Specification
- **Compliance Scope**: HIPAA Security & Privacy Rules, HL7 FHIR R4, Emergency Severity Index (ESI) v4, Manchester Triage System (MTS)

---

## Table of Contents
1. [Executive Summary & System Philosophy](#1-executive-summary--system-philosophy)
2. [Exhaustive LifeRoute 1.0 Repository Audit](#2-exhaustive-liferoute-10-repository-audit)
3. [Target System Architecture (C4 Level 2 / Event-Driven DAG)](#3-target-system-architecture)
4. [Clinical Safety, Guardrails & Deterministic Sentinel Engine](#4-clinical-safety-guardrails--deterministic-sentinel-engine)
5. [State Engine & LangGraph 2.0 Workflow](#5-state-engine--langgraph-20-workflow)
6. [Data Architecture, Telemetry & FHIR Interoperability](#6-data-architecture-telemetry--fhir-interoperability)
7. [Geospatial Routing & Dynamic Hospital Capacity Engine](#7-geospatial-routing--dynamic-hospital-capacity-engine)
8. [Backend API Specification & Streaming Architecture](#8-backend-api-specification--streaming-architecture)
9. [Frontend 2.0 Deconstruction & UI/UX Architecture](#9-frontend-20-deconstruction--uiux-architecture)
10. [Observability, Tracing & LLM Evaluation Harness](#10-observability-tracing--llm-evaluation-harness)
11. [Comprehensive Verification & Testing Matrix](#11-comprehensive-verification--testing-matrix)
12. [Step-by-Step Phased Implementation Roadmap](#12-step-by-step-phased-implementation-roadmap)

---

## 1. Executive Summary & System Philosophy

### 1.1 Context & Problem Statement
LifeRoute AI 1.0 established the clinical concept of intelligent medical triage and geospatial hospital routing, demonstrating:
- Conversational symptom collection via LLM prompts.
- Sequential LangGraph pipeline orchestration.
- Interactive map rendering and simulated clinical referral generation.

However, clinical navigation is **safety-critical and mission-critical**. In 1.0, severe architectural bottlenecks prevent production deployment:
- **Synchronous Cascade Vulnerability**: A delay or error in an external routing or bed lookup stops the entire triage workflow.
- **Unbounded LLM Latency for Acute Emergencies**: A patient presenting with an active myocardial infarction (STEMI) or acute ischemic stroke waits 3–6 seconds for LLM generation before receiving emergency dispatch guidance.
- **State Fragility & Monolithic Coupling**: The React frontend (`LifeRoutePage.jsx`, ~1,400 lines) co-mingles Mapbox rendering, WebSocket connections, audio recording, and UI tabs into an untestable component with unmanaged re-renders.
- **Data Isolation & Mock Reliance**: Hardcoded mock datasets in `mock_data.py` mask lack of real-time EHR integration, missing database transactions, and unencrypted PHI storage.

### 1.2 The LifeRoute 2.0 Philosophy
LifeRoute 2.0 is designed around three non-negotiable architectural tenets:
1. **Zero-Latency Clinical Safety Interception (Tier-0 Sentinel)**:
   Deterministic, rule-based NLP and clinical ontology matching (SNOMED-CT / ICD-10-CM / ESI Level 1 criteria) must execute in `<20ms`, intercepting life-threatening conditions before any generative LLM inference occurs.
2. **Asynchronous Multi-Agent Fan-Out DAG**:
   Resource availability, geospatial transit calculations, and insurance network verification run concurrently using non-blocking I/O and state checkpointing.
3. **Clinical Interoperability & Auditability First**:
   All patient state mutations, triage decisions, and referral actions are recorded in an append-only cryptographic audit ledger and exported as validated HL7 FHIR R4 resource bundles.

---

## 2. Exhaustive LifeRoute 1.0 Repository Audit

Every file, module, and configuration in the LifeRoute 1.0 repository was inspected. The table below details what exists, weaknesses identified, and reuse strategy:

### 2.1 Backend Modules (`c:\dev\hack\backend`)

| File / Component | Existing Role (1.0) | Critical Architectural Weaknesses | LifeRoute 2.0 Reuse & Refactor Strategy |
| :--- | :--- | :--- | :--- |
| `backend/main.py` | Monolithic FastAPI app; sets up CORS, mounts `/api/triage`, `/api/hospitals`, `/api/referral`, `/assistant`. | Lacks rate limiting, missing PHI sanitization middleware, no request idempotency, unhandled async exceptions in background tasks. | **Refactor**: Convert into a thin application factory mounting versioned APIRouters (`/api/v2/triage`, `/api/v2/hospitals`, `/api/v2/emergency`) with structured telemetry middleware. |
| `backend/graph/pipeline.py` | Synchronous sequential LangGraph `StateGraph` (`intake -> triage -> routing -> referral -> disclaimer`). | Strictly sequential; blocking network I/O in nodes; lacks failure recovery branches; no checkpoint persistence between requests. | **Refactor**: Re-architect into an asynchronous Fan-Out/Fan-In StateGraph with LangGraph `PostgresSaver` checkpoints and parallel routing sub-agents. |
| `backend/graph/state.py` | `LifeRouteState` TypedDict holding patient data, triage result, hospital recommendations, messages. | Not validated at runtime; mutable in-place without schema validation; lacks audit history and FHIR resource structures. | **Replace**: Build `LifeRouteStateV2` using **Pydantic v2** models with strict typing, event sourcing list, and FHIR R4 serialization helpers. |
| `backend/graph/agents/intake.py` | Extracts symptoms, duration, vitals from conversation using single LLM call. | Vulnerable to prompt injection; fails when vitals are partial; does not validate blood pressure or heart rate against physiological bounds. | **Refactor**: Add physiological bound validators (e.g., HR 20-300 bpm, SpO2 50-100%); add NeMo/JSON Schema extraction enforcement. |
| `backend/graph/agents/triage.py` | Categorizes urgency into Green, Yellow, Orange, Red using generic prompt. | Lacks clinical grounding; risk of hallucinating triage category; no differentiation between ESI (Emergency Severity Index) levels. | **Refactor**: Implement deterministic ESI-4 protocol with strict symptom scoring and fallback override from the Tier-0 Safety Sentinel. |
| `backend/graph/agents/routing.py` | Selects hospital from Supabase or `mock_data.py` by Euclidean distance and specialty tag. | Ignores real-time traffic, ambulance routing, ER bed status, pediatric/trauma certification levels, and patient insurance. | **Decompose**: Split into `GeospatialRouterAgent`, `HospitalCapacityAgent`, and `InsurancePayerAgent` running concurrently. |
| `backend/graph/agents/referral.py` | Generates clinical referral letter in Markdown and JSON format. | Unverified format; not FHIR compliant; cannot be ingested into real Hospital Information Systems (Epic/Cerner). | **Refactor**: Generate HL7 FHIR `Bundle` with `Patient`, `Condition`, `Encounter`, and `ServiceRequest`; export cryptographically signed PDF with QR code. |
| `backend/graph/agents/disclaimer.py` | Appends static legal disclaimer text to state. | Static, un-localized, non-jurisdictional; lacks emergency acknowledgement tracking. | **Refactor**: Context-aware legal disclosures based on geo-location, user language, and triage level; tracks patient consent hash. |
| `backend/graph/mock_data.py` | In-memory python dictionaries for fallback hospitals and doctors. | Static, unrealistic, masks database errors, lacks realistic capacity telemetry. | **Maintain as Fallback**: Upgrade to dynamic telemetry simulator generating stochastic bed occupancy and wait-time distributions for offline testing. |
| `backend/graph/llm.py` | Initializes ChatGroq, Google Gemini, and ChatOpenAI clients with simple fallback. | Missing circuit breaker; synchronous initialization; no rate-limit backoff or streaming token tracking. | **Refactor**: Production multi-provider fallback engine (`Gemini 1.5 Pro/Flash -> Groq Llama-3.3-70B -> OpenAI GPT-4o-mini`) with Tenacity exponential backoff. |
| `backend/db/supabase_client.py` | Single Supabase client instance using environment variables. | No connection pooling, lacks connection health check, vulnerable to cold-start drops. | **Refactor**: Add resilient connection manager with async client, automatic retry, and health check probes. |
| `backend/db/schema.sql` & `seed.py` | Basic schema for `hospitals`, `doctors`, `departments`. | Missing PHI encryption, missing patient session tables, no audit trail, no indexes on spatial coordinates. | **Upgrade**: New migration `002_v2_core.sql` adding PostGIS spatial indexes, `pgcrypto` encrypted patient columns, and append-only audit log table. |
| `backend/assistant/` | Vendor-neutral assistant connector (`handler.py`, `tools.py`, `formatter.py`, `openapi.yaml`). | Good initial tool definitions, but tightly coupled to 1.0 state. | **Refactor**: Update OpenAPI schemas to match FHIR R4 and v2 streaming endpoints. |

---

### 2.2 Frontend Modules (`c:\dev\hack\frontend`)

| File / Component | Existing Role (1.0) | Critical Architectural Weaknesses | LifeRoute 2.0 Refactor Strategy |
| :--- | :--- | :--- | :--- |
| `src/LifeRoutePage.jsx` | Monolithic ~1,400 line component managing all triage UI, chat, maps, routing, referrals, and tabs. | Extreme code smell; renders entire tree on single keypress; massive state spaghetti; untestable. | **Decompose**: Break down into modular features: `features/triage`, `features/hospitals`, `features/referral`, `features/emergency` coordinated by layout wrapper. |
| `src/App.jsx` & routing | Basic router rendering Home and LifeRoutePage. | Lacks error boundaries; missing auth state; no global toast / notification provider. | **Refactor**: Add React Error Boundary, TanStack Query provider, and global emergency banner. |
| `src/components/` (18 components) | Badges, Hospital Cards, Queue Timer, Bed Availability, Map View, Audio Recorder. | Components tightly coupled to 1.0 JSON format; inline styles; prop drilling; lack accessibility attributes (ARIA). | **Refactor**: Standardize with Atomic Design tokens; decouple from API payloads using adapter hooks; add full WCAG 2.1 AA keyboard/screen reader support. |
| `src/hooks/` | Custom hooks (`useAudioRecorder`, `useSpeechRecognition`). | Audio capture lacks error handling for denied mic permissions; no noise gate or visual audio metering. | **Refactor**: Modern Web Audio API pipeline with live gain meter, voice activity detection (VAD), and automatic fallback to text input. |
| `src/data/` | Local static JSON fallback data. | Redundant duplication of backend mock data; easily goes out of sync. | **Refactor**: Single source of truth typed contract shared via TypeScript schemas or OpenAPI client generator. |

---

## 3. Target System Architecture

LifeRoute 2.0 adopts an **Event-Driven, Asynchronous Micro-Agent Architecture** orchestrated by an enterprise StateGraph engine with hard real-time safety sentinels.

```
                                  USER INTERACTION LAYER
                     ┌──────────────────────────────────────────────┐
                     │         LifeRoute 2.0 React 19 Client        │
                     │  - Voice / Text Conversational Intake        │
                     │  - Live Interactive Mapbox / WebGL Telemetry │
                     │  - Real-Time Wait-Time & Bed Gauge Visuals   │
                     │  - Cryptographic Signed Referral PDF & QR    │
                     └──────────────────────┬───────────────────────┘
                                            │ WSS / HTTPS (mTLS)
                                            ▼
                                  SECURITY & INGRESS
                     ┌──────────────────────────────────────────────┐
                     │          FastAPI 2.0 Gateway Layer           │
                     │  - OAuth2 / JWT & Anonymous Session Tokens   │
                     │  - PHI Anonymization & De-Identification     │
                     │  - Rate Limiting (Token Bucket per IP/User)  │
                     └──────────────────────┬───────────────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
┌─────────────────────────────┐                         ┌─────────────────────────────────┐
│   TIER-0 SAFETY SENTINEL    │                         │    ASYNC MULTI-AGENT PIPELINE   │
│ - Deterministic Regex/NLP   │                         │  (LangGraph 2.0 Supervisor DAG) │
│ - ESI-1 Red-Flag Dictionary │                         └────────────────┬────────────────┘
│ - Immediate 911/SOS Trigger │                                          │
└──────────────┬──────────────┘                                          │
               │ (CRITICAL EMERGENCY DETECTED)                           │ (STABLE / URGENT)
               ▼                                                         ▼
┌─────────────────────────────┐                         ┌─────────────────────────────────┐
│ EMERGENCY FAST-TRACK BYPASS │                         │     Intake & Entity Extractor   │
│ - Zero LLM Latency (<20ms)  │                         │ - Physiological Bound Validator │
│ - Push Ambulance Dispatch   │                         └────────────────┬────────────────┘
│ - Alert Closest Trauma Bay  │                                          │
└─────────────────────────────┘                                          ▼
                                                        ┌─────────────────────────────────┐
                                                        │    Clinical Triage Supervisor   │
                                                        │ - ESI 2-5 Multi-Criteria Engine │
                                                        └────────────────┬────────────────┘
                                                                         │
                                 ┌───────────────────────────────────────┼───────────────────────────────────────┐
                                 ▼                                       ▼                                       ▼
                  ┌─────────────────────────────┐         ┌─────────────────────────────┐         ┌─────────────────────────────┐
                  │    Geospatial Routing Svc   │         │  Hospital Capacity Telemetry│         │  Insurance & Network Svc    │
                  │ - Multi-modal traffic (Car, │         │ - Real-time ER Bed Counters │         │ - In-network verification   │
                  │   Ambulance, Public Transit)│         │ - Trauma/Stroke Center Tier │         │ - Copay/Deductible estimate │
                  │ - Live Turn-by-Turn ETA     │         │ - Specialized Scanner Avail │         │ - Prior Auth flags          │
                  └──────────────┬──────────────┘         └──────────────┬──────────────┘         └──────────────┬──────────────┘
                                 │                                       │                                       │
                                 └───────────────────────────────────────┼───────────────────────────────────────┘
                                                                         ▼
                                                        ┌─────────────────────────────────┐
                                                        │   Referral & Discharge Engine   │
                                                        │ - HL7 FHIR R4 Bundle Generator  │
                                                        │ - Cryptographic SHA-256 Signature│
                                                        │ - Printable Patient PDF + QR    │
                                                        └────────────────┬────────────────┘
                                                                         │
                                                                         ▼
                                                        ┌─────────────────────────────────┐
                                                        │ Persistence & Checkpoint Store  │
                                                        │ - PostgreSQL 16 (PostGIS, RLS)  │
                                                        │ - Redis 7 (PubSub & Cache)      │
                                                        │ - Append-Only PHI Audit Ledger  │
                                                        └─────────────────────────────────┘
```

---

## 4. Clinical Safety, Guardrails & Deterministic Sentinel Engine

### 4.1 The Tier-0 Deterministic Safety Sentinel (`backend/graph/agents/safety_sentinel.py`)
Generative LLMs must **never** be on the critical path for acute medical emergencies. If a patient experiences an active stroke or cardiac arrest, waiting 2–5 seconds for a model to generate conversational niceties is a dangerous failure mode.

The Sentinel executes **synchronously in memory prior to any LLM invocation**.
- **Execution Budget**: `< 20ms`
- **Methodology**: High-performance Aho-Corasick trie / compiled regex pattern matching against a curated clinical dictionary derived from **ESI-1 criteria**, **AHA STEMI Guidelines**, and the **Cincinnati Prehospital Stroke Scale**.

```python
# Sentinel Classification Logic Definition
RED_FLAG_CATEGORIES = {
    "CARDIOVASCULAR": [
        r"\bcrushing\s+(chest\s+pain|pressure)\b",
        r"\bchest\s+pain\s+(radiat|spread)\w*\s+(to\s+)?(left\s+arm|jaw|neck)\b",
        r"\bsudden\s+onset\s+racing\s+heart\s+with\s+(faint|blackout|syncope)\b"
    ],
    "NEUROLOGICAL_STROKE": [
        r"\b(sudden|acute)\s+(facial\s+droop|slurred\s+speech|loss\s+of\s+speech)\b",
        r"\b(one-sided|unilateral)\s+(weakness|numbness|paralysis)\b",
        r"\bworst\s+headache\s+of\s+(my\s+)?life\b"
    ],
    "RESPIRATORY_FAILURE": [
        r"\b(can'?t|unable\s+to)\s+breathe\b",
        r"\bturning\s+(blue|cyanotic)\b",
        r"\bsevere\s+stridor|gasping\s+for\s+air\b"
    ],
    "ANAPHYLAXIS": [
        r"\bthroat\s+(closing|swelling)\s+(after|from)\s+(bee|peanut|food|sting|medication)\b",
        r"\bhives\s+with\s+(difficulty\s+breathing|wheezing)\b"
    ],
    "TRAUMA_HEMORRHAGE": [
        r"\buncontrolled\s+bleeding\b",
        r"\bspurting\s+blood\b",
        r"\bpenetrating\s+(wound|injury)\s+to\s+(chest|neck|abdomen)\b"
    ]
}
```

#### Sentinel State Output:
When a match occurs, the Sentinel immediately:
1. Sets `state["is_emergency"] = True`
2. Sets `state["triage_level"] = "EMERGENCY_LEVEL_1"`
3. Generates instant deterministic instructions: *"Call 911 immediately. An ambulance dispatch alert has been triggered."*
4. Short-circuits the LangGraph workflow, bypassing Intake, Triage, and Routing agents, and routing straight to Emergency Dispatch & Notification.

### 4.2 Guardrails for Non-Emergency Clinical Triage (NeMo / Pydantic Schema Enforcement)
For non-emergency cases (ESI 2–5):
- **Physiological Bound Checks**: Vitals must satisfy clinical sanity checks:
  - Heart Rate: $30 \le \text{HR} \le 250\text{ bpm}$
  - Respiratory Rate: $6 \le \text{RR} \le 60\text{ breaths/min}$
  - Systolic Blood Pressure: $50 \le \text{SBP} \le 260\text{ mmHg}$
  - Oxygen Saturation: $50\% \le \text{SpO}_2 \le 100\%$
- **Hallucination Suppression**: The LLM is constrained to output structured JSON conforming to `TriageAssessmentV2`. No medical prescribing or drug dosage recommendations are permitted; attempts to elicit medications are caught and replaced with clinical referral directives.

---

## 5. State Engine & LangGraph 2.0 Workflow

### 5.1 Strict Pydantic v2 State Model (`backend/graph/state.py`)

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

class VitalSigns(BaseModel):
    heart_rate: Optional[int] = Field(None, ge=30, le=250)
    systolic_bp: Optional[int] = Field(None, ge=50, le=260)
    diastolic_bp: Optional[int] = Field(None, ge=30, le=160)
    oxygen_saturation: Optional[float] = Field(None, ge=50.0, le=100.0)
    temperature_f: Optional[float] = Field(None, ge=90.0, le=108.0)

class PatientDemographics(BaseModel):
    age: Optional[int] = Field(None, ge=0, le=125)
    gender: Optional[Literal["male", "female", "other", "unknown"]] = "unknown"
    pregnant: Optional[bool] = False
    known_allergies: List[str] = Field(default_factory=list)
    chronic_conditions: List[str] = Field(default_factory=list)
    insurance_provider: Optional[str] = None

class TriageAssessment(BaseModel):
    esi_level: Literal[1, 2, 3, 4, 5]  # ESI 1=Resuscitation, 5=Non-urgent
    urgency_category: Literal["RED", "ORANGE", "YELLOW", "GREEN"]
    primary_complaint: str
    clinical_rationale: str
    red_flags_present: List[str] = Field(default_factory=list)
    recommended_care_setting: Literal["ED_TRAUMA", "ED_GENERAL", "URGENT_CARE", "PRIMARY_CLINIC", "HOME_CARE"]
    confidence_score: float = Field(..., ge=0.0, le=1.0)

class HospitalRecommendation(BaseModel):
    id: str
    name: str
    trauma_level: Optional[int] = None
    distance_miles: float
    travel_time_minutes: int
    transit_mode: Literal["ambulance", "driving", "transit"]
    current_er_wait_minutes: int
    available_general_beds: int
    available_icu_beds: int
    in_network: bool
    pediatric_certified: bool
    stroke_center_certified: bool
    cardiac_catheterization_lab: bool
    composite_match_score: float

class AuditEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    node_name: str
    agent_action: str
    model_version: Optional[str] = None
    input_hash: str
    output_summary: str

class LifeRouteStateV2(BaseModel):
    session_id: str
    patient: PatientDemographics = Field(default_factory=PatientDemographics)
    vitals: VitalSigns = Field(default_factory=VitalSigns)
    user_location: Dict[str, float] = Field(default_factory=lambda: {"lat": 0.0, "lng": 0.0})
    symptom_history: List[str] = Field(default_factory=list)
    chat_history: List[Dict[str, str]] = Field(default_factory=list)
    is_emergency: bool = False
    emergency_trigger_reason: Optional[str] = None
    triage: Optional[TriageAssessment] = None
    ranked_hospitals: List[HospitalRecommendation] = Field(default_factory=list)
    selected_hospital_id: Optional[str] = None
    fhir_bundle: Optional[Dict[str, Any]] = None
    signed_referral_pdf_url: Optional[str] = None
    audit_trail: List[AuditEntry] = Field(default_factory=list)
```

### 5.2 LangGraph 2.0 Fan-Out / Fan-In Execution DAG

```
                        [ START ]
                            │
                            ▼
                [ Tier0_Safety_Sentinel ]
                   /                \
      (Red-Flag Found)            (No Emergency)
                 /                    \
                ▼                      ▼
    [ Emergency_Fast_Track ]    [ Intake_Extractor ]
                │                      │
                │                      ▼
                │               [ Triage_Engine ]
                │                      │
                │         ┌────────────┴────────────┐  (Parallel Fan-Out)
                │         ▼                         ▼
                │  [ Geo_Router ]        [ Hospital_Capacity ]
                │         \                         /
                │          └───────────┬───────────┘   (Fan-In Join)
                │                      ▼
                │           [ Ranking_Supervisor ]
                │                      │
                │                      ▼
                │           [ Referral_FHIR_Gen ]
                │                      │
                │                      ▼
                └───────────────► [ Disclaimer_Node ]
                                       │
                                       ▼
                                    [ END ]
```

---

## 6. Data Architecture, Telemetry & FHIR Interoperability

### 6.1 PostgreSQL Schema Migration (`backend/db/migrations/002_v2_core.sql`)

```sql
-- Enable PostGIS & pgcrypto
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Hospital Facility Registry with Live Telemetry
CREATE TABLE IF NOT EXISTS hospital_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    trauma_level SMALLINT CHECK (trauma_level BETWEEN 1 AND 4),
    is_stroke_center BOOLEAN DEFAULT FALSE,
    is_pediatric_capable BOOLEAN DEFAULT FALSE,
    has_cardiac_cath_lab BOOLEAN DEFAULT FALSE,
    phone_emergency VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hospitals_geom ON hospital_facilities USING GIST (location);

-- Real-Time Dynamic Telemetry Table (Updates every 60s from hospital EHR feed or simulator)
CREATE TABLE IF NOT EXISTS hospital_live_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospital_facilities(id) ON DELETE CASCADE,
    total_er_beds INT NOT NULL,
    occupied_er_beds INT NOT NULL,
    total_icu_beds INT NOT NULL,
    occupied_icu_beds INT NOT NULL,
    er_wait_time_minutes INT NOT NULL,
    ambulance_divert_status BOOLEAN DEFAULT FALSE,
    ct_scanner_status VARCHAR(20) DEFAULT 'OPERATIONAL', -- OPERATIONAL, MAINTENANCE, OFFLINE
    telemetry_timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telemetry_hospital ON hospital_live_telemetry(hospital_id, telemetry_timestamp DESC);

-- Clinical Navigation Sessions (Encrypted PHI at rest)
CREATE TABLE IF NOT EXISTS patient_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(128) UNIQUE NOT NULL,
    encrypted_patient_data BYTEA, -- PII/Demographics encrypted via pgcrypto using master key
    triage_esi_level SMALLINT,
    urgency_category VARCHAR(20),
    is_emergency BOOLEAN DEFAULT FALSE,
    assigned_hospital_id UUID REFERENCES hospital_facilities(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Immutable Append-Only Clinical Audit Log
CREATE TABLE IF NOT EXISTS clinical_audit_log (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES patient_sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    input_digest VARCHAR(64) NOT NULL, -- SHA-256 hash of input
    output_summary JSONB NOT NULL,
    model_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_session ON clinical_audit_log(session_id);
```

### 6.2 HL7 FHIR R4 Bundle Serializer (`backend/fhir/serializers.py`)
LifeRoute 2.0 generates standard FHIR R4 JSON bundles containing:
1. `Patient` (pseudo-anonymized identifier, age, gender).
2. `Condition` (extracted symptoms and clinical suspected category with SNOMED-CT codes).
3. `Encounter` (triage priority, admission recommendation).
4. `ServiceRequest` (order for urgent care / emergency evaluation).

This guarantees that any hospital adopting LifeRoute 2.0 can automatically ingest the patient's triage summary directly into their Epic MyChart or Cerner EHR queue before arrival.

---

## 7. Geospatial Routing & Dynamic Hospital Capacity Engine

### 7.1 Multi-Factor Hospital Scoring Algorithm
LifeRoute 2.0 abandons naive Euclidean distance in favor of a **Composite Clinical Match Score ($S_c$)**:

$$S_c = w_1 \cdot \mathcal{T}(t_{\text{travel}}) + w_2 \cdot \mathcal{W}(w_{\text{ER}}) + w_3 \cdot \mathcal{B}(b_{\text{avail}}) + w_4 \cdot \mathcal{C}_{\text{specialty}} + w_5 \cdot \mathcal{I}_{\text{network}}$$

Where:
- $\mathcal{T}(t_{\text{travel}})$: Normalized travel time penalty using real-time driving/ambulance speeds (Mapbox Directions API v5 / OSRM engine).
- $\mathcal{W}(w_{\text{ER}})$: ER queue wait-time function. If ESI=1 or 2, wait time weight is bypassed in favor of trauma level.
- $\mathcal{B}(b_{\text{avail}})$: Available bed factor (penalizes facilities near diversion capacity or on ambulance divert).
- $\mathcal{C}_{\text{specialty}}$: Clinical capability match bonus (e.g., pediatric patient matched to pediatric ED +40 pts; suspected STEMI matched to active Cath Lab +50 pts).
- $\mathcal{I}_{\text{network}}$: In-network insurance bonus (+15 pts) for non-emergent visits (ESI 4–5).

---

## 8. Backend API Specification & Streaming Architecture

### 8.1 API Endpoints (FastAPI 2.0)

| Method | Endpoint | Description | Streaming Support |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v2/triage/stream` | Primary triage conversational dialogue; returns SSE stream of tokens + live status events. | **SSE (Server-Sent Events)** |
| `POST` | `/api/v2/triage/voice` | Ingests binary audio chunk (`audio/webm` or `audio/wav`), runs Whisper STT, passes to pipeline. | Response JSON |
| `GET` | `/api/v2/hospitals/nearby` | Geospatial lookup with real-time wait times, open beds, and routing polygons. | Response JSON |
| `GET` | `/api/v2/hospitals/{id}/telemetry` | Live hospital bed and diagnostic scanner telemetry stream. | **WebSocket** |
| `POST` | `/api/v2/emergency/sos` | Immediate Tier-0 SOS alert trigger; returns dispatch payload and nearest trauma ER alert. | Response JSON |
| `POST` | `/api/v2/referral/generate-pdf` | Generates verified clinical referral PDF with cryptographic QR code. | Binary `application/pdf` |
| `GET` | `/api/v2/health` | Deep health check (DB, Redis, LLM Providers, Latency budget). | Response JSON |

---

## 9. Frontend 2.0 Deconstruction & UI/UX Architecture

### 9.1 Decomposing `LifeRoutePage.jsx`
The monolithic 1,400-line `LifeRoutePage.jsx` is refactored into domain-driven slices:

```
frontend/src/
├── features/
│   ├── triage/
│   │   ├── components/
│   │   │   ├── TriageChatWindow.jsx       # Chat message history + streaming token render
│   │   │   ├── VoiceInputPill.jsx         # Web Audio visualizer & push-to-talk button
│   │   │   ├── UrgencyBadge.jsx           # ESI Level 1-5 animated badge
│   │   │   └── VitalsInputModal.jsx       # Quick entry for HR, BP, SpO2
│   │   └── hooks/
│   │       ├── useTriageStream.js         # SSE stream consumer with reconnection
│   │       └── useAudioCapture.js         # Web Audio API mic hook with noise suppression
│   ├── hospitals/
│   │   ├── components/
│   │   │   ├── HospitalCard.jsx           # Live wait-time indicator & bed gauge
│   │   │   ├── FacilityMap.jsx            # Mapbox GL with traffic & route isochrones
│   │   │   └── RouteDetailsDrawer.jsx     # Turn-by-turn preview & ambulance dispatch ETA
│   │   └── hooks/
│   │       └── useHospitalTelemetry.js    # Live polling / WebSocket telemetry hook
│   ├── emergency/
│   │   └── components/
│   │       ├── EmergencyTakeoverModal.jsx # Red alert screen with 911 one-click call
│   │       └── DispatchCountdown.jsx     # 10-second automatic ambulance dispatch timer
│   └── referral/
│       └── components/
│           ├── ReferralSummary.jsx        # Clinical referral card with copyable summary
│           ├── QrCodeCard.jsx             # Cryptographic QR code for hospital intake
│           └── PdfDownloadButton.jsx      # Direct PDF download trigger
├── stores/
│   └── useLifeRouteStore.js               # Centralized Zustand state machine
└── pages/
    └── LifeRoutePage.jsx                  # Clean orchestrator (~120 lines) assembling features
```

### 9.2 Centralized Zustand Store (`frontend/src/stores/useLifeRouteStore.js`)
Eliminates prop drilling and duplicate states:
- `sessionState`: `sessionId`, `token`, `status` (`idle`, `streaming`, `emergency`, `completed`).
- `triageState`: `esiLevel`, `urgencyCategory`, `chatHistory`, `activeVitals`.
- `geoState`: `userCoordinates`, `rankedHospitals`, `selectedHospitalId`, `routeGeometry`.
- `actions`: `submitMessage()`, `triggerSOS()`, `selectHospital()`, `resetSession()`.

---

## 10. Observability, Tracing & LLM Evaluation Harness

- **OpenTelemetry Instrumentation**: Distributed tracing on all incoming requests, measuring exact latency in:
  - Safety Sentinel (`< 20ms`)
  - LLM Inference (`< 1500ms`)
  - Database telemetry lookup (`< 50ms`)
  - Mapbox matrix routing (`< 300ms`)
- **Langfuse / LangSmith Integration**: Every clinical extraction prompt and triage assessment is logged with input prompt hash, completion tokens, model name, and automated clinical consistency scoring.

---

## 11. Comprehensive Verification & Testing Matrix

### 11.1 Automated Test Suites

```
backend/tests/
├── unit/
│   ├── test_safety_sentinel.py     # 100+ clinical red-flag test cases; 0 false negatives
│   ├── test_vitals_validator.py    # Tests boundary checks on HR, BP, SpO2
│   └── test_hospital_scorer.py     # Validates multi-factor hospital ranking math
├── integration/
│   ├── test_langgraph_pipeline.py  # End-to-end LangGraph DAG execution
│   ├── test_fhir_serialization.py  # HL7 FHIR R4 schema validation
│   └── test_telemetry_db.py        # PostGIS query performance and live bed updates
└── load/
    └── locustfile.py               # Stress test verifying 500 concurrent triage sessions
```

---

## 12. Step-by-Step Phased Implementation Roadmap

### Phase 1: Tier-0 Safety Sentinel & Core State (Sprint 1)
1. Implement `backend/graph/agents/safety_sentinel.py` with compiled regex / trie pattern matcher.
2. Build unit test suite `backend/tests/unit/test_safety_sentinel.py` with 100 emergency prompts.
3. Migrate `backend/graph/state.py` to Pydantic v2 `LifeRouteStateV2`.
4. Deploy Postgres migration `002_v2_core.sql` adding PostGIS tables and audit log.

### Phase 2: Parallel LangGraph 2.0 Pipeline (Sprint 2)
1. Refactor `backend/graph/pipeline.py` into Fan-Out / Fan-In StateGraph.
2. Build `GeospatialRouterAgent` and `HospitalCapacityAgent`.
3. Implement multi-provider LLM fallback in `backend/graph/llm.py` with automatic retry.

### Phase 3: Telemetry, Routing & FHIR Service (Sprint 3)
1. Build hospital telemetry engine and realistic simulator in `backend/graph/mock_data.py`.
2. Implement HL7 FHIR R4 serializer in `backend/fhir/serializers.py`.
3. Add signed PDF generation service with QR verification code.

### Phase 4: Frontend Deconstruction & Zustand Store (Sprint 4)
1. Install and configure Zustand in `frontend/src/stores/useLifeRouteStore.js`.
2. Extract `features/emergency/components/EmergencyTakeoverModal.jsx`.
3. Extract `features/triage/components/TriageChatWindow.jsx` with SSE streaming.
4. Refactor `LifeRoutePage.jsx` into the clean layout orchestrator.

### Phase 5: Voice Audio Pipeline & Mapbox Polish (Sprint 5)
1. Upgrade audio recording with Web Audio API visualizer and Whisper transcription endpoint.
2. Enhance Mapbox GL view with live isochrones, ambulance routing, and bed counters.

### Phase 6: Hardening, E2E Testing & HIPAA Compliance Audit (Sprint 6)
1. Run Playwright E2E suite testing full patient journey (Intake &rarr; Triage &rarr; Map &rarr; PDF).
2. Execute Locust load testing for 500 concurrent sessions.
3. Verify zero unencrypted PHI in logs or database tables.

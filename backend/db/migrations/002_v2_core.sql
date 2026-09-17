-- LifeRoute AI 2.0 core schema
-- Run in Supabase SQL Editor after init_supabase.sql
-- PostGIS is optional; geography columns degrade to lat/lng floats if unavailable.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Hospital Facility Registry with live telemetry hooks
CREATE TABLE IF NOT EXISTS hospital_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    trauma_level SMALLINT CHECK (trauma_level BETWEEN 1 AND 4),
    is_stroke_center BOOLEAN DEFAULT FALSE,
    is_pediatric_capable BOOLEAN DEFAULT FALSE,
    has_cardiac_cath_lab BOOLEAN DEFAULT FALSE,
    phone_emergency VARCHAR(30) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hospital_live_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospital_facilities(id) ON DELETE CASCADE,
    total_er_beds INT NOT NULL,
    occupied_er_beds INT NOT NULL,
    total_icu_beds INT NOT NULL,
    occupied_icu_beds INT NOT NULL,
    er_wait_time_minutes INT NOT NULL,
    ambulance_divert_status BOOLEAN DEFAULT FALSE,
    ct_scanner_status VARCHAR(20) DEFAULT 'OPERATIONAL',
    telemetry_timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_hospital
    ON hospital_live_telemetry(hospital_id, telemetry_timestamp DESC);

CREATE TABLE IF NOT EXISTS patient_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(128) UNIQUE NOT NULL,
    encrypted_patient_data BYTEA,
    triage_esi_level SMALLINT,
    urgency_category VARCHAR(20),
    is_emergency BOOLEAN DEFAULT FALSE,
    assigned_hospital_id UUID REFERENCES hospital_facilities(id),
    input_digest VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_audit_log (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES patient_sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    input_digest VARCHAR(64) NOT NULL,
    output_summary JSONB NOT NULL,
    model_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_session ON clinical_audit_log(session_id);

-- Harden existing hospitals table with v2 capability columns (no-op if already present)
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS trauma_level SMALLINT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS is_stroke_center BOOLEAN DEFAULT FALSE;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS is_pediatric_capable BOOLEAN DEFAULT FALSE;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ambulance_divert_status BOOLEAN DEFAULT FALSE;

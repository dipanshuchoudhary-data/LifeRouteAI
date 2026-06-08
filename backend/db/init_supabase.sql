-- LifeRoute AI — ONE-CLICK Supabase setup
-- Paste this entire file into: Supabase Dashboard → SQL Editor → Run

-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    distance_km FLOAT DEFAULT 0.0,
    specialties TEXT[] DEFAULT '{}',
    has_icu BOOLEAN DEFAULT FALSE,
    has_cath_lab BOOLEAN DEFAULT FALSE,
    has_trauma_center BOOLEAN DEFAULT FALSE,
    has_neurology_unit BOOLEAN DEFAULT FALSE,
    total_beds INTEGER DEFAULT 0,
    available_beds INTEGER DEFAULT 0,
    current_capacity_percent INTEGER DEFAULT 0,
    emergency_wait_minutes INTEGER DEFAULT 0,
    rating FLOAT DEFAULT 0.0,
    contact TEXT DEFAULT '',
    embedding VECTOR(384),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hospitals_embedding_idx
    ON hospitals USING hnsw (embedding vector_cosine_ops);

-- 3. Semantic search RPC
CREATE OR REPLACE FUNCTION match_hospitals(
    query_embedding VECTOR(384),
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    id BIGINT, name TEXT, city TEXT, address TEXT, distance_km FLOAT,
    specialties TEXT[], has_icu BOOLEAN, has_cath_lab BOOLEAN,
    has_trauma_center BOOLEAN, has_neurology_unit BOOLEAN,
    total_beds INTEGER, available_beds INTEGER,
    current_capacity_percent INTEGER, emergency_wait_minutes INTEGER,
    rating FLOAT, contact TEXT, similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT h.id, h.name, h.city, h.address, h.distance_km, h.specialties,
           h.has_icu, h.has_cath_lab, h.has_trauma_center, h.has_neurology_unit,
           h.total_beds, h.available_beds, h.current_capacity_percent,
           h.emergency_wait_minutes, h.rating, h.contact,
           1 - (h.embedding <=> query_embedding) AS similarity
    FROM hospitals h
    WHERE h.embedding IS NOT NULL
      AND 1 - (h.embedding <=> query_embedding) > match_threshold
    ORDER BY h.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 4. Quick test data (5 hospitals — embeddings added by seed script)
DELETE FROM hospitals;

INSERT INTO hospitals (name, city, address, distance_km, specialties, has_icu, has_cath_lab, has_trauma_center, has_neurology_unit, total_beds, available_beds, current_capacity_percent, emergency_wait_minutes, rating, contact) VALUES
('Fortis Escorts Heart Institute', 'Delhi', 'Okhla Road, Sukhdev Vihar, New Delhi 110025', 6.5, ARRAY['cardiology','cardiac surgery','critical care'], true, true, false, false, 310, 55, 82, 10, 4.6, '+91-11-47135000'),
('AIIMS Trauma Centre', 'Delhi', 'Ansari Nagar East, AIIMS Campus, New Delhi 110029', 8.2, ARRAY['trauma','neurosurgery','orthopedics','emergency medicine'], true, true, true, true, 350, 42, 88, 15, 4.5, '+91-11-26588500'),
('Max Super Speciality Hospital', 'Delhi', '2, Press Enclave Road, Saket, New Delhi 110017', 7.1, ARRAY['general medicine','neurology','cardiology'], true, true, false, true, 500, 78, 84, 12, 4.4, '+91-11-26515050'),
('Medanta - The Medicity', 'Gurgaon', 'CH Baktawar Singh Rd, Sector 38, Gurgaon 122001', 15.4, ARRAY['cardiology','neuroscience','trauma','oncology'], true, true, true, true, 1250, 180, 78, 8, 4.7, '+91-124-4141414'),
('Jaypee Hospital', 'Noida', 'Sector 128, Noida 201304', 22.0, ARRAY['cardiology','neurology','trauma','oncology'], true, true, true, true, 525, 88, 83, 10, 4.3, '+91-120-4122222');

-- 5. Verify
SELECT id, name, city, available_beds, has_icu, has_trauma_center FROM hospitals ORDER BY id;

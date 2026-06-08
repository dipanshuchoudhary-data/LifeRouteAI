-- LifeRoute AI — Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create hospitals table
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
    embedding VECTOR(384),  -- all-MiniLM-L6-v2 outputs 384-dimensional vectors
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS hospitals_embedding_idx
    ON hospitals USING hnsw (embedding vector_cosine_ops);

-- 4. Create semantic search function
CREATE OR REPLACE FUNCTION match_hospitals(
    query_embedding VECTOR(384),
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    city TEXT,
    address TEXT,
    distance_km FLOAT,
    specialties TEXT[],
    has_icu BOOLEAN,
    has_cath_lab BOOLEAN,
    has_trauma_center BOOLEAN,
    has_neurology_unit BOOLEAN,
    total_beds INTEGER,
    available_beds INTEGER,
    current_capacity_percent INTEGER,
    emergency_wait_minutes INTEGER,
    rating FLOAT,
    contact TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        h.id,
        h.name,
        h.city,
        h.address,
        h.distance_km,
        h.specialties,
        h.has_icu,
        h.has_cath_lab,
        h.has_trauma_center,
        h.has_neurology_unit,
        h.total_beds,
        h.available_beds,
        h.current_capacity_percent,
        h.emergency_wait_minutes,
        h.rating,
        h.contact,
        1 - (h.embedding <=> query_embedding) AS similarity
    FROM hospitals h
    WHERE 1 - (h.embedding <=> query_embedding) > match_threshold
    ORDER BY h.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- LifeRoute AI — Quick test data (no embeddings)
-- Run AFTER schema.sql in Supabase SQL Editor
-- For full semantic search, use: python -m db.seed_hospitals

-- Clear existing test rows (optional)
-- TRUNCATE hospitals RESTART IDENTITY;

INSERT INTO hospitals (
  name, city, address, distance_km, specialties,
  has_icu, has_cath_lab, has_trauma_center, has_neurology_unit,
  total_beds, available_beds, current_capacity_percent,
  emergency_wait_minutes, rating, contact
) VALUES
(
  'Fortis Escorts Heart Institute', 'Delhi',
  'Okhla Road, Sukhdev Vihar, New Delhi 110025', 6.5,
  ARRAY['cardiology', 'cardiac surgery', 'interventional cardiology', 'critical care'],
  true, true, false, false, 310, 55, 82, 10, 4.6, '+91-11-47135000'
),
(
  'AIIMS Trauma Centre', 'Delhi',
  'Ansari Nagar East, AIIMS Campus, New Delhi 110029', 8.2,
  ARRAY['trauma', 'neurosurgery', 'orthopedics', 'emergency medicine'],
  true, true, true, true, 350, 42, 88, 15, 4.5, '+91-11-26588500'
),
(
  'Max Super Speciality Hospital', 'Delhi',
  '2, Press Enclave Road, Saket, New Delhi 110017', 7.1,
  ARRAY['general medicine', 'oncology', 'neurology', 'cardiology'],
  true, true, false, true, 500, 78, 84, 12, 4.4, '+91-11-26515050'
),
(
  'Medanta - The Medicity', 'Gurgaon',
  'CH Baktawar Singh Rd, Sector 38, Gurgaon 122001', 15.4,
  ARRAY['cardiology', 'neuroscience', 'oncology', 'trauma'],
  true, true, true, true, 1250, 180, 78, 8, 4.7, '+91-124-4141414'
),
(
  'Jaypee Hospital', 'Noida',
  'Sector 128, Noida 201304', 22.0,
  ARRAY['cardiology', 'neurology', 'oncology', 'trauma'],
  true, true, true, true, 525, 88, 83, 10, 4.3, '+91-120-4122222'
);

-- Verify
SELECT id, name, city, available_beds, has_icu, has_trauma_center FROM hospitals ORDER BY id;

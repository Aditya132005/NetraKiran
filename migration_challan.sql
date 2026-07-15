-- NetraKiran: Challan History migration
-- Merges Prescription + Visit History into a single "Challan" record per visit.
-- Safe to run multiple times (all statements are idempotent).
-- Run this against your Neon database (e.g. via the Neon SQL editor or psql).

-- customer_visits: add frame / lens / advance / balance breakdown
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS frame_name TEXT;
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS frame_mrp NUMERIC(10,2);
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS frame_discount NUMERIC(10,2);
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS lens_name TEXT;
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS lens_mrp NUMERIC(10,2);
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS lens_discount NUMERIC(10,2);
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS advance NUMERIC(10,2);
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS balance NUMERIC(10,2);

-- prescriptions: link each row to a specific visit/challan, and mark it as
-- the Distance Vision (DV) or Near Vision (NV) row for that visit.
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS visit_id INTEGER REFERENCES customer_visits(id) ON DELETE CASCADE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS vision_row VARCHAR(10);

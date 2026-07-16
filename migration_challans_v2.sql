-- NetraKiran: Unified Challan system migration
-- Replaces separate Prescriptions + Visit History with one Challan record.
-- Safe to run multiple times. Does not touch existing prescriptions/customer_visits tables.
-- Run this against your Neon database (e.g. via the Neon SQL editor or psql).

CREATE TABLE IF NOT EXISTS challans (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  job_no INTEGER,
  date_of_booking DATE,
  date_of_delivery DATE,
  right_sph NUMERIC(5,2),
  right_cyl NUMERIC(5,2),
  right_axis INTEGER,
  right_vision VARCHAR(50),
  right_add NUMERIC(5,2),
  left_sph NUMERIC(5,2),
  left_cyl NUMERIC(5,2),
  left_axis INTEGER,
  left_vision VARCHAR(50),
  left_add NUMERIC(5,2),
  frame_name TEXT,
  frame_mrp NUMERIC(10,2),
  frame_discount_pct NUMERIC(5,2) DEFAULT 0,
  lens_name TEXT,
  lens_mrp NUMERIC(10,2),
  lens_discount_pct NUMERIC(5,2) DEFAULT 0,
  advance NUMERIC(10,2) DEFAULT 0,
  advance_payment_mode VARCHAR(20) DEFAULT 'Cash',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Computed (not stored):
--   frame_amount = frame_mrp * (1 - frame_discount_pct/100)
--   lens_amount  = lens_mrp * (1 - lens_discount_pct/100)
--   total        = frame_amount + lens_amount
--   balance      = total - advance

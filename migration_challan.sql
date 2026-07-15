-- NetraKiran: Visit purchase breakdown migration
-- Adds frame/lens (with % discount) and advance/payment-mode fields to visits.
-- Safe to run multiple times (all statements are idempotent).
-- Run this against your Neon database (e.g. via the Neon SQL editor or psql).

ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS frame_name TEXT;
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS frame_mrp NUMERIC(10,2);
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS frame_discount_pct NUMERIC(5,2);
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS lens_name TEXT;
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS lens_mrp NUMERIC(10,2);
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS lens_discount_pct NUMERIC(5,2);
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS advance NUMERIC(10,2);
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS advance_payment_mode VARCHAR(20);
ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS balance_payment_mode VARCHAR(20);

-- Total is stored (post-discount frame + lens amount); balance = total - advance
-- is computed on the fly and not stored.

-- NOTE: an earlier version of this migration added frame_discount, lens_discount,
-- balance, visit_id, and vision_row columns for a design that has since been
-- superseded by the columns above. Those old columns are unused but left in
-- place (harmless) since this database may already have been migrated once.
-- Uncomment below if you want to clean them up (safe — nothing writes to them):
-- ALTER TABLE customer_visits DROP COLUMN IF EXISTS frame_discount;
-- ALTER TABLE customer_visits DROP COLUMN IF EXISTS lens_discount;
-- ALTER TABLE customer_visits DROP COLUMN IF EXISTS balance;
-- ALTER TABLE prescriptions DROP COLUMN IF EXISTS visit_id;
-- ALTER TABLE prescriptions DROP COLUMN IF EXISTS vision_row;

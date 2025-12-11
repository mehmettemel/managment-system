-- Phase 1: Enrollment System Database Updates

-- 1. Updates to member_classes
ALTER TABLE member_classes 
ADD COLUMN IF NOT EXISTS next_payment_date date,
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS custom_price numeric;

-- 2. Updates to payments
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS class_id bigint REFERENCES classes(id),
ADD COLUMN IF NOT EXISTS snapshot_price numeric,
ADD COLUMN IF NOT EXISTS snapshot_class_name text;

-- 3. Updates to classes
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Data Backfill / Migration Logic (Optional but recommended)
-- For existing member_classes, we might want to default active to true (already handled by DEFAULT)
-- and maybe calculate next_payment_date based on join_date? 
-- For now, we leave next_payment_date null until the next payment is processed or a script fixes it.

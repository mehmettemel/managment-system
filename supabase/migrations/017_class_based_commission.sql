-- Migration: Class-Based Commission System
-- Replace dance_type-based commission with class-based commission
-- Reason: Each class can have different difficulty/value, more flexible

-- 1. Add instructor_commission_rate to classes table
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS instructor_commission_rate NUMERIC;

-- 2. Add constraint to ensure rate is between 0-100 if specified
ALTER TABLE classes
ADD CONSTRAINT check_commission_rate
CHECK (instructor_commission_rate IS NULL OR (instructor_commission_rate >= 0 AND instructor_commission_rate <= 100));

-- 3. Add comment for documentation
COMMENT ON COLUMN classes.instructor_commission_rate IS 'Specific commission rate for this class. If NULL, uses instructor default_commission_rate';

-- 4. Optional: Migrate existing data from dance_type-based rates to class-based
-- This tries to populate commission rates from existing instructor_rates table
UPDATE classes c
SET instructor_commission_rate = ir.rate
FROM instructor_rates ir
WHERE c.dance_type_id = ir.dance_type_id
  AND c.instructor_id = ir.instructor_id
  AND c.instructor_commission_rate IS NULL;

-- Note: We're NOT dropping dance_types and instructor_rates tables yet
-- They can be removed in a future migration after confirming the new system works
-- or kept if you want to use dance_types for categorization purposes

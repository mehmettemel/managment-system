-- Migration: 011_critical_fixes.sql

-- 1. Unique Active Enrollment
-- Prevents a member from being enrolled in the exact same class twice while active.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_enrollment 
ON member_classes (member_id, class_id) 
WHERE active = true;

-- 2. FK Safety for Payments (Cascade Delete)
-- If a class is deleted, set payments.class_id to NULL (don't delete payment)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'payments_class_id_fkey') THEN
    ALTER TABLE payments DROP CONSTRAINT payments_class_id_fkey;
  END IF;
END $$;

ALTER TABLE payments
ADD CONSTRAINT payments_class_id_fkey
FOREIGN KEY (class_id)
REFERENCES classes(id)
ON DELETE SET NULL;

-- 3. FK Safety for Instructor Ledger (Cascade Delete)
-- If a payment is deleted, the corresponding commission log MUST be deleted
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'instructor_ledger_student_payment_id_fkey') THEN
    ALTER TABLE instructor_ledger DROP CONSTRAINT instructor_ledger_student_payment_id_fkey;
  END IF;
END $$;

ALTER TABLE instructor_ledger
ADD CONSTRAINT instructor_ledger_student_payment_id_fkey
FOREIGN KEY (student_payment_id)
REFERENCES payments(id)
ON DELETE CASCADE;

-- 4. Prevent Multiple Active Freezes
-- A member should only have one open (end_date IS NULL) freeze log at a time
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_freeze
ON frozen_logs (member_id)
WHERE end_date IS NULL;

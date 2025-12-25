-- Enable RLS on all tables if not already enabled
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE frozen_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY; -- If exists

-- Drop existing insecure policies (if any known specific ones exist, generic cleanup is hard without dynamic SQL but we can overwrite or create new restrictive ones)
-- It's safer to drop specific expected policies if we know names, or just CREATE OR REPLACE / IF NOT EXISTS.
-- Since we want to Lock Down, we will create "Authenticated Only" policies for everything.

-- Helper to create policies efficiently
-- Policy: Full Access for Authenticated Users (Admins)
-- Policy: No Access for Anonymous (Default RLS behavior is Deny All if no policy matches)

-- Members
DROP POLICY IF EXISTS "Authenticated users full access on members" ON members;
CREATE POLICY "Authenticated users full access on members" ON members
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Classes
DROP POLICY IF EXISTS "Authenticated users full access on classes" ON classes;
CREATE POLICY "Authenticated users full access on classes" ON classes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Member Classes (Enrollments)
DROP POLICY IF EXISTS "Authenticated users full access on member_classes" ON member_classes;
CREATE POLICY "Authenticated users full access on member_classes" ON member_classes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Payments
DROP POLICY IF EXISTS "Authenticated users full access on payments" ON payments;
CREATE POLICY "Authenticated users full access on payments" ON payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Instructors
DROP POLICY IF EXISTS "Authenticated users full access on instructors" ON instructors;
CREATE POLICY "Authenticated users full access on instructors" ON instructors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Instructor Ledger
DROP POLICY IF EXISTS "Authenticated users full access on instructor_ledger" ON instructor_ledger;
CREATE POLICY "Authenticated users full access on instructor_ledger" ON instructor_ledger
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Expenses
DROP POLICY IF EXISTS "Authenticated users full access on expenses" ON expenses;
CREATE POLICY "Authenticated users full access on expenses" ON expenses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Frozen Logs
DROP POLICY IF EXISTS "Enable all access for frozen_logs" ON frozen_logs; -- Drop the specific insecure one mentioned by user
DROP POLICY IF EXISTS "Authenticated users full access on frozen_logs" ON frozen_logs;
CREATE POLICY "Authenticated users full access on frozen_logs" ON frozen_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Dance Types
DROP POLICY IF EXISTS "Authenticated users full access on dance_types" ON dance_types;
CREATE POLICY "Authenticated users full access on dance_types" ON dance_types
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- If there are any "public" read requirements (e.g. for a landing page schedule), add specific SELECT policies here.
-- Currently assuming strict Admin-only dashboard.

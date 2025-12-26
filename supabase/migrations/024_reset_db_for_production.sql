-- DANGER: THIS SCRIPT DELETES ALL DATA FOR PRODUCTION RESET
-- IT KEEPS 'dance_types' AS REQUESTED

BEGIN;

-- Truncate all transaction and entity tables with CASCADE to handle foreign keys
-- RESTART IDENTITY resets the auto-increment IDs to 1
TRUNCATE TABLE
  payments,
  instructor_ledger,
  instructor_payouts,
  frozen_logs,
  member_classes,
  expenses,
  classes,
  instructor_rates,
  instructors,
  members,
  member_logs
RESTART IDENTITY CASCADE;

-- Note: 'dance_types' table is intentionally excluded to preserve configuration.

COMMIT;

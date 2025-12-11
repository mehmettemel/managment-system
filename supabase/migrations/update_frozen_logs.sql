-- Allow end_date to be null for indefinite freezing
alter table frozen_logs alter column end_date drop not null;

-- Add days_count column to track duration when unfreezing
alter table frozen_logs add column if not exists days_count int;

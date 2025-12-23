-- Add duration_minutes to classes for seed data compatibility
ALTER TABLE classes ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

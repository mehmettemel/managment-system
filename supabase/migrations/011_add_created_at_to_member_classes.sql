-- Add created_at column to member_classes table
ALTER TABLE member_classes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Update existing records to have a created_at date (default to now if null)
-- Ideally we would backfill this with something meaningful, but for now 'now' is safe fallback.
UPDATE member_classes SET created_at = now() WHERE created_at IS NULL;

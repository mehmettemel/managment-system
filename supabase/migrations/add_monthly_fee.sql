-- Add monthly_fee column to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS monthly_fee numeric DEFAULT 0;

-- Update existing members to have a default fee (optional, logic can handle null)
-- We will assume 0 or handle it in application logic.

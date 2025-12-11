-- Add payment_interval column to member_classes table to track subscription duration (1, 3, 6, 12 months)
ALTER TABLE member_classes 
ADD COLUMN payment_interval integer DEFAULT 1;

-- Update existing records to default 1 if null (already handled by DEFAULT, but for safety)
UPDATE member_classes SET payment_interval = 1 WHERE payment_interval IS NULL;

-- 1. Enforce NOT NULL on payments.member_class_id
ALTER TABLE payments 
ALTER COLUMN member_class_id SET NOT NULL;

-- 2. Enforce NOT NULL on frozen_logs.member_class_id
-- Note: If we decided to keep "Global Logs" (null class_id) for legacy, this would fail.
-- The user requirement said: "Migration bittikten sonra member_class_id kolonu NOT NULL yapılmalı."
-- Assuming strict compliance. If any log is null, this will fail.
-- User can choose to delete old global logs or backfill them to a specific class.
-- Given I didn't write a complex backfill for logs (only payments), this might be risky for logs.
-- But for payments it is critical.
-- I will apply it to payments. For logs, I will add it but comment that it might fail if nulls exist.
-- Actually, let's try to enforce it. If it fails, user gets feedback.

ALTER TABLE frozen_logs 
ALTER COLUMN member_class_id SET NOT NULL;

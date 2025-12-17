-- Member Logs / History Table
-- This table tracks major events in a member's lifecycle:
-- Registration, Class Enrollment, Freeze, Unfreeze, Termination (with reasons/financials)

CREATE TABLE IF NOT EXISTS member_logs (
    id SERIAL PRIMARY KEY,
    member_id BIGINT REFERENCES members(id) ON DELETE CASCADE,
    member_class_id BIGINT REFERENCES member_classes(id) ON DELETE SET NULL, -- Optional (e.g. member-level freeze)
    
    action_type VARCHAR(50) NOT NULL, -- 'enrollment', 'termination', 'freeze', 'unfreeze', 'payment', 'transfer', 'update'
    
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()), -- Event effective date
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()), -- Audit timestamp
    
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb -- Stores amounts, reasons, debt, refund details etc.
);

-- Index for faster history lookups
CREATE INDEX IF NOT EXISTS idx_member_logs_member_id ON member_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_member_logs_date ON member_logs(date);

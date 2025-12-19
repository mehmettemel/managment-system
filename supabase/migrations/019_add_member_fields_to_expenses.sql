-- Add member relationship fields to expenses table for tracking refunds
ALTER TABLE expenses
ADD COLUMN member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
ADD COLUMN member_class_id INTEGER REFERENCES member_classes(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_member_id ON expenses(member_id);
CREATE INDEX IF NOT EXISTS idx_expenses_member_class_id ON expenses(member_class_id);

-- Add comment
COMMENT ON COLUMN expenses.member_id IS 'Optional: Links expense to a member (e.g., for refunds)';
COMMENT ON COLUMN expenses.member_class_id IS 'Optional: Links expense to a specific enrollment (e.g., for refunds)';

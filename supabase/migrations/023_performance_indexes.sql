-- Create indexes on Foreign Keys to improve JOIN performance and Filter performance

-- Payments Table
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_class_id ON payments(class_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date); -- Frequently sorted/filtered

-- Member Classes (Enrollments)
CREATE INDEX IF NOT EXISTS idx_member_classes_member_id ON member_classes(member_id);
CREATE INDEX IF NOT EXISTS idx_member_classes_class_id ON member_classes(class_id);

-- Instructor Ledger
CREATE INDEX IF NOT EXISTS idx_instructor_ledger_instructor_id ON instructor_ledger(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_ledger_student_payment_id ON instructor_ledger(student_payment_id);
CREATE INDEX IF NOT EXISTS idx_instructor_ledger_status ON instructor_ledger(status); -- Frequently filtered

-- Frozen Logs
CREATE INDEX IF NOT EXISTS idx_frozen_logs_member_id ON frozen_logs(member_id);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- Classes
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_dance_type_id ON classes(dance_type_id);

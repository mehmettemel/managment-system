-- Database Cleanup Migration
-- Removes legacy columns that are no longer used by the class-based system

-- 1. Remove next_payment_due_date from members (Replaced by member_classes.next_payment_date)
ALTER TABLE members DROP COLUMN IF EXISTS next_payment_due_date;

-- 2. Remove monthly_fee from members (Replaced by member_classes.price/custom_price)
ALTER TABLE members DROP COLUMN IF EXISTS monthly_fee;

-- 1. Add member_class_id to payments table
ALTER TABLE payments 
ADD COLUMN member_class_id BIGINT REFERENCES member_classes(id);

-- 2. Add member_class_id to frozen_logs table
ALTER TABLE frozen_logs 
ADD COLUMN member_class_id BIGINT REFERENCES member_classes(id);

-- 3. Optional: Backfill existing payments? 
-- Trying to link existing payments to the *latest* active member_class for that class/member
-- This is risky without more logic, but user emphasis is on NEW enrollments.
-- We will leave backfill for now or do a simple one:
-- UPDATE payments p
-- SET member_class_id = mc.id
-- FROM member_classes mc
-- WHERE mc.member_id = p.member_id 
--   AND mc.class_id = p.class_id
--   AND mc.active = true; -- Only if there is exactly one active? 
-- Given the user specifically mentioned "Eski ödemeler (ID 500) arşivde durur... Yeni ödemeler ID 999'a işlenir", 
-- trying to backfill old payments into *current* active ID might be WRONG if they belong to an old ID.
-- Since the old architecture didn't HAVE separate IDs for old enrollments (it likely updated the same row or didn't track history well?),
-- actually, wait. If `addMemberToClasses` always INSERTS, then we DO have multiple rows for the same member/class in history.
-- So we need to match payment date to member_class created_at range.
-- That's complex SQL. For now, I will just add the columns. Future payments will be correct.

-- 4. Make member_id optional in frozen_logs? 
-- User said: "member_id'yi nullable yapmıyoruz, raporlama için kalsın". OK.

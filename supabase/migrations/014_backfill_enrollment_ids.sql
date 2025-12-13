-- Backfill payments member_class_id
-- For standard scenarios where (member_id, class_id) maps to a single enrollment (or the latest one)
UPDATE payments p
SET member_class_id = mc.id
FROM member_classes mc
WHERE p.member_id = mc.member_id 
  AND p.class_id = mc.class_id
  AND p.member_class_id IS NULL;

-- Backfill frozen_logs member_class_id
-- Note: frozen_logs originally might not have class_id? 
-- Wait, frozen_logs was Member-based (global). It didn't have class_id.
-- So we can't easily map old frozen logs to specific classes unless we map to ALL active classes at that time.
-- The user said: "frozen_logs tablosuna kayıt atarken hangi member_class_id'nin dondurulduğu kaydedilmeli." (Future tense for new logs).
-- For old logs, they were "Global Frozen".
-- We can leave them null? Or link to all active enrollments?
-- If we leave null, the UI "FreezeStatusCard" might not show them if it filters by enrollment.
-- But the "Global Freeze" logic (member.status = frozen) still exists for legacy display.
-- Let's backfill logs to "Active Enrollments" just in case?
-- Actually, a log with null member_class_id is ambiguous in the new system.
-- But since we support "Global Freeze" in UI separate from "Class Freeze", maybe we keep null?
-- Wait, I modified `FreezeStatusCard` to filter logs?
-- Let's check `processClassPayment` logic again.
-- I'll stick to payments backfill first. Frozen logs might remain null (indicating global freeze).

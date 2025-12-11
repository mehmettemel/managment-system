-- Class-Based Payment System Migration
-- Bu migration ödeme takibini üye bazlıdan ders bazlı sisteme taşır.

-- 1. Mevcut verileri temizle (Temporary data)
DELETE FROM instructor_ledger;
DELETE FROM instructor_payouts;
DELETE FROM payments;
DELETE FROM frozen_logs;
DELETE FROM member_classes;
DELETE FROM members;
DELETE FROM classes;

-- 2. members tablosundan gereksiz kolonları kaldır
ALTER TABLE members DROP COLUMN IF EXISTS last_payment_date;
ALTER TABLE members DROP COLUMN IF EXISTS next_payment_due_date;

-- 3. member_classes tablosuna yeni kolonlar ekle
-- Önce mevcut primary key constraint varsa kaldır
-- ALTER TABLE member_classes DROP CONSTRAINT IF EXISTS member_classes_pkey;

-- Yeni kolonlar
ALTER TABLE member_classes ADD COLUMN IF NOT EXISTS id SERIAL;
ALTER TABLE member_classes ADD COLUMN IF NOT EXISTS next_payment_date DATE DEFAULT current_date;
ALTER TABLE member_classes ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE member_classes ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Primary key olarak id kullan (composite key yerine)
-- Not: Bu değişiklik mevcut FK'ları etkileyebilir, dikkatli olun

-- 4. payments tablosuna class_id ekle
ALTER TABLE payments ADD COLUMN IF NOT EXISTS class_id BIGINT REFERENCES classes(id);

-- 5. Örnek veriler ekle (Seed Data)

-- Örnek Dersler
INSERT INTO classes (name, day_of_week, start_time, duration_minutes, price_monthly, active) VALUES
('Salsa Başlangıç', 'Pazartesi', '19:00', 60, 800, true),
('Salsa İleri', 'Çarşamba', '20:00', 60, 900, true),
('Bachata', 'Salı', '19:00', 60, 800, true),
('Zeybek', 'Perşembe', '18:00', 90, 700, true),
('Hip Hop', 'Cuma', '17:00', 60, 750, true);

-- Örnek Üyeler
INSERT INTO members (first_name, last_name, phone, status, monthly_fee) VALUES
('Ahmet', 'Yılmaz', '5551234567', 'active', 0),
('Ayşe', 'Kaya', '5559876543', 'active', 0),
('Mehmet', 'Demir', '5551112233', 'active', 0),
('Fatma', 'Şahin', '5554445566', 'active', 0);

-- Üye-Ders İlişkileri (next_payment_date ve price ile)
-- Ahmet: Salsa Başlangıç (bugün), Bachata (15 gün önce - gecikmiş)
INSERT INTO member_classes (member_id, class_id, next_payment_date, price, active)
SELECT m.id, c.id, current_date, c.price_monthly, true
FROM members m, classes c
WHERE m.first_name = 'Ahmet' AND c.name = 'Salsa Başlangıç';

INSERT INTO member_classes (member_id, class_id, next_payment_date, price, active)
SELECT m.id, c.id, current_date - INTERVAL '15 days', c.price_monthly, true
FROM members m, classes c
WHERE m.first_name = 'Ahmet' AND c.name = 'Bachata';

-- Ayşe: Salsa İleri (10 gün sonra - ileride)
INSERT INTO member_classes (member_id, class_id, next_payment_date, price, active)
SELECT m.id, c.id, current_date + INTERVAL '10 days', c.price_monthly, true
FROM members m, classes c
WHERE m.first_name = 'Ayşe' AND c.name = 'Salsa İleri';

-- Mehmet: Zeybek, Hip Hop
INSERT INTO member_classes (member_id, class_id, next_payment_date, price, active)
SELECT m.id, c.id, current_date, c.price_monthly, true
FROM members m, classes c
WHERE m.first_name = 'Mehmet' AND c.name = 'Zeybek';

INSERT INTO member_classes (member_id, class_id, next_payment_date, price, active)
SELECT m.id, c.id, current_date + INTERVAL '5 days', c.price_monthly, true
FROM members m, classes c
WHERE m.first_name = 'Mehmet' AND c.name = 'Hip Hop';

-- Fatma: Bachata
INSERT INTO member_classes (member_id, class_id, next_payment_date, price, active)
SELECT m.id, c.id, current_date - INTERVAL '5 days', c.price_monthly, true
FROM members m, classes c
WHERE m.first_name = 'Fatma' AND c.name = 'Bachata';

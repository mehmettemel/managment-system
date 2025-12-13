-- 1. Ödeme Türü Kolonu Ekle
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'monthly' CHECK (payment_type IN ('monthly', 'difference', 'refund', 'registration'));

-- 2. Mevcut verileri güncelle (Eski kayıtların hepsi aylık aidattır)
UPDATE payments SET payment_type = 'monthly' WHERE payment_type IS NULL;

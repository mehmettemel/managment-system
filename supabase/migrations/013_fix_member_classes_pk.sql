-- 1. Drop existing PK (likely composite member_id, class_id)
ALTER TABLE member_classes DROP CONSTRAINT IF EXISTS member_classes_pkey;

-- 2. Make id the PRIMARY KEY
ALTER TABLE member_classes ADD PRIMARY KEY (id);

-- 3. Now we can add the FK references (failed in previous step)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS member_class_id BIGINT REFERENCES member_classes(id);

ALTER TABLE frozen_logs 
ADD COLUMN IF NOT EXISTS member_class_id BIGINT REFERENCES member_classes(id);

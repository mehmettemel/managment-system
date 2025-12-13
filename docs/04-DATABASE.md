# 🗄️ Veritabanı Dokümantasyonu (Database Documentation)

Proje veritabanı olarak **PostgreSQL** (Supabase üzerinde) kullanmaktadır.

---

## 📊 Veritabanı Şeması (Database Schema)

### Tablo Özeti

| Tablo | Amaç | Satır Sayısı (Tipik) |
|-------|------|---------------------|
| `members` | Üye bilgileri | 100-1000+ |
| `classes` | Ders tanımları | 5-50 |
| `member_classes` | Üye-ders kayıtları (Enrollment) | 200-5000+ |
| `payments` | Ödeme kayıtları | 1000-50000+ |
| `frozen_logs` | Dondurma geçmişi | 50-500 |
| `instructors` | Eğitmen bilgileri | 5-20 |
| `instructor_ledger` | Eğitmen komisyon defteri | 1000-10000+ |
| `instructor_payouts` | Eğitmen ödemeleri | 50-500 |
| `dance_types` | Dans türleri | 5-20 |
| `instructor_rates` | Eğitmen özel komisyon oranları | 10-100 |

---

## 📋 Tablo Detayları

### 1. `members` (Üyeler)

**Amaç:** Üyelerin kişisel bilgilerini ve genel durumlarını saklar.

**Kolonlar:**

| Kolon | Tip | Null? | Default | Açıklama |
|-------|-----|-------|---------|----------|
| `id` | BIGINT | NO | Auto | Primary key |
| `first_name` | TEXT | NO | - | Ad |
| `last_name` | TEXT | NO | - | Soyad |
| `phone` | TEXT | YES | NULL | Telefon numarası (masked format: 5XX XXX XX XX) |
| `email` | TEXT | YES | NULL | E-posta (opsiyonel) |
| `status` | TEXT | NO | 'active' | Üye durumu: 'active', 'frozen', 'archived' |
| `join_date` | DATE | NO | current_date | Üyelik başlangıç tarihi |
| `created_at` | TIMESTAMP | NO | now() | Kayıt oluşturma zamanı |
| `updated_at` | TIMESTAMP | NO | now() | Son güncelleme zamanı |

**Constraints:**
```sql
CHECK (status IN ('active', 'frozen', 'archived'))
```

**Indexes:**
```sql
PRIMARY KEY (id)
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_phone ON members(phone);
```

**İlişkiler:**
- `member_classes.member_id` → `members.id` (One-to-Many)
- `payments.member_id` → `members.id` (One-to-Many)
- `frozen_logs.member_id` → `members.id` (One-to-Many)

**Notlar:**
- `status` otomatik güncellenir (tüm dersleri frozen ise 'frozen', en az biri active ise 'active')
- `monthly_fee` kolonu kaldırıldı (artık enrollment bazlı fiyatlandırma)
- `next_payment_due_date` kolonu kaldırıldı (artık enrollment bazlı)

---

### 2. `classes` (Dersler)

**Amaç:** Ders tanımlarını ve varsayılan bilgileri saklar.

**Kolonlar:**

| Kolon | Tip | Null? | Default | Açıklama |
|-------|-----|-------|---------|----------|
| `id` | BIGINT | NO | Auto | Primary key |
| `name` | TEXT | NO | - | Ders adı (ör: "Salsa 101") |
| `default_price` | NUMERIC | NO | 0 | Varsayılan aylık ücret (TL) |
| `instructor_id` | BIGINT | YES | NULL | Sorumlu eğitmen (FK) |
| `day_of_week` | TEXT | YES | NULL | Ders günü (opsiyonel) |
| `start_time` | TIME | YES | NULL | Başlangıç saati (opsiyonel) |
| `duration_minutes` | INTEGER | YES | NULL | Ders süresi (dakika) |
| `active` | BOOLEAN | NO | true | Aktif/arşiv durumu |
| `created_at` | TIMESTAMP | NO | now() | Kayıt oluşturma zamanı |
| `updated_at` | TIMESTAMP | NO | now() | Son güncelleme zamanı |

**Constraints:**
```sql
CHECK (default_price >= 0)
CHECK (day_of_week IN ('Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'))
```

**Indexes:**
```sql
PRIMARY KEY (id)
CREATE INDEX idx_classes_active ON classes(active);
CREATE INDEX idx_classes_instructor ON classes(instructor_id);
```

**İlişkiler:**
- `instructors.id` ← `classes.instructor_id` (Many-to-One)
- `member_classes.class_id` → `classes.id` (One-to-Many)
- `payments.class_id` → `classes.id` (One-to-Many)

**Notlar:**
- `active=false` olanlar arşivdedir (soft delete)
- `default_price` her yeni enrollment için başlangıç fiyatıdır
- `price_monthly` kolonu `default_price` olarak yeniden adlandırıldı

---

### 3. `member_classes` (Ders Kayıtları - Enrollment)

**Amaç:** Üye-ders ilişkilerini ve her kaydın özel bilgilerini saklar. **Bu tablo enrollment-based mimarinin merkezidir.**

**Kolonlar:**

| Kolon | Tip | Null? | Default | Açıklama |
|-------|-----|-------|---------|----------|
| `id` | BIGINT | NO | Auto | Primary key (Serial) |
| `member_id` | BIGINT | NO | - | Üye ID (FK) |
| `class_id` | BIGINT | NO | - | Ders ID (FK) |
| `price` | NUMERIC | NO | 0 | Bu kayıt için özel fiyat (custom pricing) |
| `payment_interval` | INTEGER | YES | NULL | Taahhüt süresi (1, 3, 6, 12 ay) |
| `next_payment_date` | DATE | NO | current_date | Sonraki ödeme tarihi |
| `active` | BOOLEAN | NO | true | Aktif/pasif durumu |
| `created_at` | TIMESTAMP | NO | now() | Kayıt oluşturma zamanı (ENROLLMENT DATE) |
| `updated_at` | TIMESTAMP | NO | now() | Son güncelleme zamanı |

**Constraints:**
```sql
PRIMARY KEY (id)
CHECK (price >= 0)
CHECK (payment_interval IN (1, 3, 6, 12) OR payment_interval IS NULL)
UNIQUE (member_id, class_id, created_at) -- Aynı üye aynı derse aynı anda iki kez kayıt olamaz
```

**Indexes:**
```sql
CREATE INDEX idx_member_classes_member ON member_classes(member_id);
CREATE INDEX idx_member_classes_class ON member_classes(class_id);
CREATE INDEX idx_member_classes_active ON member_classes(active);
CREATE INDEX idx_member_classes_next_payment ON member_classes(next_payment_date);
```

**İlişkiler:**
- `members.id` ← `member_classes.member_id` (Many-to-One)
- `classes.id` ← `member_classes.class_id` (Many-to-One)
- `payments.member_class_id` → `member_classes.id` (One-to-Many)
- `frozen_logs.member_class_id` → `member_classes.id` (One-to-Many)

**Kritik Notlar:**
1. **Composite Key'den ID'ye Geçiş**: Eski versiyonda `(member_id, class_id)` composite primary key kullanılıyordu. Şimdi `id` serial primary key kullanılıyor.
2. **Enrollment History**: Aynı üye aynı dersten ayrılıp tekrar kaydolabilir. Her kayıt ayrı bir `id` ile saklanır.
3. **created_at = ENROLLMENT DATE**: Payment schedule bu tarihten başlar.
4. **price vs default_price**: `price` bu enrollment için özel fiyat, `classes.default_price` ise varsayılan.
5. **next_payment_date**: Ödeme alındıkça ve freeze yapıldıkça otomatik güncellenir.

---

### 4. `payments` (Ödemeler)

**Amaç:** Tüm ödeme kayıtlarını saklar. Her ödeme tek bir aya aittir (multi-month payments split edilir).

**Kolonlar:**

| Kolon | Tip | Null? | Default | Açıklama |
|-------|-----|-------|---------|----------|
| `id` | BIGINT | NO | Auto | Primary key |
| `member_id` | BIGINT | NO | - | Üye ID (FK) |
| `class_id` | BIGINT | NO | - | Ders ID (FK) |
| `member_class_id` | BIGINT | YES | NULL | Enrollment ID (FK) |
| `amount` | NUMERIC | NO | - | Ödeme tutarı (TL) |
| `payment_date` | DATE | NO | current_date | Ödemenin yapıldığı tarih |
| `payment_method` | TEXT | YES | NULL | Ödeme yöntemi: 'cash', 'card', 'transfer' |
| `payment_type` | TEXT | NO | 'monthly' | Ödeme türü: 'monthly', 'difference', 'refund', 'registration' |
| `period_start` | DATE | NO | - | Ödenen dönemin başlangıcı (Ay-Yıl) |
| `period_end` | DATE | YES | NULL | Ödenen dönemin bitişi (opsiyonel) |
| `notes` | TEXT | YES | NULL | Açıklama/not |
| `created_at` | TIMESTAMP | NO | now() | Kayıt oluşturma zamanı |

**Constraints:**
```sql
CHECK (amount > 0)
CHECK (payment_method IN ('cash', 'card', 'transfer'))
CHECK (payment_type IN ('monthly', 'difference', 'refund', 'registration'))
```

**Indexes:**
```sql
PRIMARY KEY (id)
CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_class ON payments(class_id);
CREATE INDEX idx_payments_member_class ON payments(member_class_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_period ON payments(period_start);
CREATE INDEX idx_payments_method ON payments(payment_method);
```

**İlişkiler:**
- `members.id` ← `payments.member_id` (Many-to-One)
- `classes.id` ← `payments.class_id` (Many-to-One)
- `member_classes.id` ← `payments.member_class_id` (Many-to-One)
- `instructor_ledger.payment_id` → `payments.id` (One-to-One)

**Kritik Notlar:**
1. **Multi-Month Split**: 3 aylık ödeme → 3 ayrı payment kaydı (her ay için bir tane)
2. **period_start**: Payment schedule'daki periodMonth ile eşleşir (YYYY-MM-01 formatında)
3. **member_class_id**: Hangi enrollment'a ait olduğunu gösterir (Migration 012'de eklendi)
4. **payment_type**: Aylık aidat dışındaki ödemeler için (fark, iade, kayıt ücreti)

---

### 5. `frozen_logs` (Dondurma Kayıtları)

**Amaç:** Üye dondurma geçmişini saklar. Per-enrollment freeze desteği.

**Kolonlar:**

| Kolon | Tip | Null? | Default | Açıklama |
|-------|-----|-------|---------|----------|
| `id` | BIGINT | NO | Auto | Primary key |
| `member_id` | BIGINT | NO | - | Üye ID (FK, raporlama için) |
| `member_class_id` | BIGINT | YES | NULL | Enrollment ID (FK) |
| `start_date` | DATE | NO | - | Dondurma başlangıç tarihi |
| `end_date` | DATE | YES | NULL | Dondurma bitiş tarihi (NULL = süresiz) |
| `reason` | TEXT | YES | NULL | Dondurma nedeni (opsiyonel) |
| `created_at` | TIMESTAMP | NO | now() | Kayıt oluşturma zamanı |

**Constraints:**
```sql
CHECK (end_date IS NULL OR end_date >= start_date)
```

**Indexes:**
```sql
PRIMARY KEY (id)
CREATE INDEX idx_frozen_logs_member ON frozen_logs(member_id);
CREATE INDEX idx_frozen_logs_member_class ON frozen_logs(member_class_id);
CREATE INDEX idx_frozen_logs_dates ON frozen_logs(start_date, end_date);
```

**İlişkiler:**
- `members.id` ← `frozen_logs.member_id` (Many-to-One)
- `member_classes.id` ← `frozen_logs.member_class_id` (Many-to-One)

**Kritik Notlar:**
1. **Per-Enrollment Freeze**: Her enrollment ayrı ayrı dondurulabilir
2. **Indefinite Freeze**: `end_date = NULL` süresiz dondurma anlamına gelir
3. **Multiple Periods**: Aynı enrollment birden fazla kez dondurulabilir (geçmiş kayıtlar tutulur)
4. **Payment Schedule Skip**: Frozen aylar payment schedule'da atlanır (CRITICAL)
5. **member_id Nullable Değil**: Raporlama için member_id her zaman dolu olmalı

---

### 6. `instructors` (Eğitmenler)

**Amaç:** Eğitmen bilgilerini ve varsayılan komisyon oranlarını saklar.

**Kolonlar:**

| Kolon | Tip | Null? | Default | Açıklama |
|-------|-----|-------|---------|----------|
| `id` | BIGINT | NO | Auto | Primary key |
| `first_name` | TEXT | NO | - | Ad |
| `last_name` | TEXT | NO | - | Soyad |
| `phone` | TEXT | YES | NULL | Telefon |
| `email` | TEXT | YES | NULL | E-posta |
| `commission_rate` | NUMERIC | NO | 0 | Varsayılan komisyon oranı (%) |
| `active` | BOOLEAN | NO | true | Aktif/pasif durumu |
| `created_at` | TIMESTAMP | NO | now() | Kayıt oluşturma zamanı |

**Constraints:**
```sql
CHECK (commission_rate >= 0 AND commission_rate <= 100)
```

**Indexes:**
```sql
PRIMARY KEY (id)
CREATE INDEX idx_instructors_active ON instructors(active);
```

**İlişkiler:**
- `classes.instructor_id` → `instructors.id` (One-to-Many)
- `instructor_ledger.instructor_id` → `instructors.id` (One-to-Many)
- `instructor_payouts.instructor_id` → `instructors.id` (One-to-Many)

---

### 7. `instructor_ledger` (Eğitmen Komisyon Defteri)

**Amaç:** Eğitmenlerin kazandıkları komisyonları takip eder.

**Kolonlar:**

| Kolon | Tip | Null? | Default | Açıklama |
|-------|-----|-------|---------|----------|
| `id` | BIGINT | NO | Auto | Primary key |
| `instructor_id` | BIGINT | NO | - | Eğitmen ID (FK) |
| `payment_id` | BIGINT | NO | - | Ödeme ID (FK) |
| `amount` | NUMERIC | NO | - | Komisyon tutarı (TL) |
| `status` | TEXT | NO | 'pending' | Durum: 'pending', 'payable', 'paid' |
| `due_date` | DATE | NO | - | Vade tarihi (payment_date ile aynı) |
| `created_at` | TIMESTAMP | NO | now() | Kayıt oluşturma zamanı |

**Constraints:**
```sql
CHECK (status IN ('pending', 'payable', 'paid'))
CHECK (amount >= 0)
```

**Indexes:**
```sql
PRIMARY KEY (id)
CREATE INDEX idx_ledger_instructor ON instructor_ledger(instructor_id);
CREATE INDEX idx_ledger_payment ON instructor_ledger(payment_id);
CREATE INDEX idx_ledger_status ON instructor_ledger(status);
```

**İlişkiler:**
- `instructors.id` ← `instructor_ledger.instructor_id` (Many-to-One)
- `payments.id` ← `instructor_ledger.payment_id` (Many-to-One)

**Notlar:**
- Her payment kaydı için otomatik olarak ledger kaydı oluşturulur
- Commission calculation: `amount = payment.amount * (instructor.commission_rate / 100)`

---

### 8. `instructor_payouts` (Eğitmen Ödemeleri)

**Amaç:** Eğitmenlere yapılan hakediş ödemelerini saklar.

**Kolonlar:**

| Kolon | Tip | Null? | Default | Açıklama |
|-------|-----|-------|---------|----------|
| `id` | BIGINT | NO | Auto | Primary key |
| `instructor_id` | BIGINT | NO | - | Eğitmen ID (FK) |
| `amount` | NUMERIC | NO | - | Ödeme tutarı (TL) |
| `payment_date` | DATE | NO | current_date | Ödeme tarihi |
| `payment_method` | TEXT | YES | NULL | Ödeme yöntemi |
| `notes` | TEXT | YES | NULL | Açıklama |
| `created_at` | TIMESTAMP | NO | now() | Kayıt oluşturma zamanı |

**Indexes:**
```sql
PRIMARY KEY (id)
CREATE INDEX idx_payouts_instructor ON instructor_payouts(instructor_id);
CREATE INDEX idx_payouts_date ON instructor_payouts(payment_date);
```

**İlişkiler:**
- `instructors.id` ← `instructor_payouts.instructor_id` (Many-to-One)

---

### 9. `dance_types` (Dans Türleri)

**Amaç:** Dans türlerini tanımlar (opsiyonel özellik).

**Kolonlar:**

| Kolon | Tip | Null? | Default | Açıklama |
|-------|-----|-------|---------|----------|
| `id` | BIGINT | NO | Auto | Primary key |
| `name` | TEXT | NO | - | Dans türü adı (Salsa, Bachata, etc.) |
| `created_at` | TIMESTAMP | NO | now() | Kayıt oluşturma zamanı |

---

### 10. `instructor_rates` (Eğitmen Özel Komisyon Oranları)

**Amaç:** Eğitmen/dans türü bazında özel komisyon oranları (opsiyonel özellik).

**Kolonlar:**

| Kolon | Tip | Null? | Default | Açıklama |
|-------|-----|-------|---------|----------|
| `id` | BIGINT | NO | Auto | Primary key |
| `instructor_id` | BIGINT | NO | - | Eğitmen ID (FK) |
| `dance_type_id` | BIGINT | NO | - | Dans türü ID (FK) |
| `commission_rate` | NUMERIC | NO | - | Özel komisyon oranı (%) |
| `created_at` | TIMESTAMP | NO | now() | Kayıt oluşturma zamanı |

---

## 🔄 Entity Relationship Diagram (ERD)

```
┌─────────────┐
│   members   │
│             │
│ - id (PK)   │
│ - first_name│
│ - last_name │
│ - phone     │
│ - status    │
│ - join_date │
└──────┬──────┘
       │
       │ 1:N
       │
       ▼
┌──────────────────┐         ┌─────────────┐
│  member_classes  │ N:1     │   classes   │
│  (ENROLLMENT)    ├────────▶│             │
│                  │         │ - id (PK)   │
│ - id (PK)        │         │ - name      │
│ - member_id (FK) │         │ - default_  │
│ - class_id (FK)  │         │   price     │
│ - price          │         │ - instructor│
│ - payment_       │         │   _id (FK)  │
│   interval       │         │ - active    │
│ - next_payment_  │         └──────┬──────┘
│   date           │                │
│ - active         │                │ N:1
│ - created_at     │                │
└─────┬────────────┘                ▼
      │                      ┌──────────────┐
      │ 1:N                  │ instructors  │
      │                      │              │
      ▼                      │ - id (PK)    │
┌──────────────┐             │ - first_name │
│   payments   │             │ - last_name  │
│              │             │ - commission_│
│ - id (PK)    │             │   rate       │
│ - member_id  │             └──────┬───────┘
│ - class_id   │                    │
│ - member_    │                    │ 1:N
│   class_id   │                    │
│ - amount     │                    ▼
│ - payment_   │             ┌─────────────────┐
│   date       │             │instructor_ledger│
│ - period_    │        ┌───▶│                 │
│   start      │        │    │ - id (PK)       │
│ - payment_   │        │    │ - instructor_id │
│   method     │        │    │ - payment_id    │
│ - payment_   │        │    │ - amount        │
│   type       │        │    │ - status        │
└──────┬───────┘        │    └─────────────────┘
       │                │
       │ 1:1            │
       └────────────────┘

      ┌──────────────┐
      │ frozen_logs  │
      │              │
      │ - id (PK)    │
      │ - member_id  │
      │ - member_    │
      │   class_id   │
      │ - start_date │
      │ - end_date   │
      └──────────────┘
```

---

## 📜 Migration Geçmişi (Migration History)

Proje veritabanı şeması `supabase/migrations/` klasöründeki SQL dosyaları ile yönetilir.

### Kritik Migration'lar:

1. **005_instructor_system.sql**
   - Eğitmen tablosu ve komisyon sistemi oluşturuldu

2. **008_class_based_payments.sql**
   - Ödeme sistemi üye bazlıdan ders bazlıya taşındı
   - `member_classes` tablosuna `id`, `next_payment_date`, `price`, `active` kolonları eklendi
   - `payments` tablosuna `class_id` eklendi
   - Composite key yerine serial `id` kullanılmaya başlandı

3. **009_add_payment_interval.sql**
   - `member_classes` tablosuna `payment_interval` kolonu eklendi (1, 3, 6, 12 ay)

4. **010_enrollment_system.sql**
   - Enrollment sistemi resmi olarak uygulandı

5. **011_add_created_at_to_member_classes.sql**
   - `member_classes.created_at` kolonu eklendi
   - **CRITICAL**: Bu tarih enrollment date olarak kullanılır, payment schedule buradan başlar

6. **012_enrollment_based_architecture.sql**
   - `payments` tablosuna `member_class_id` kolonu eklendi
   - `frozen_logs` tablosuna `member_class_id` kolonu eklendi
   - **Per-enrollment tracking** sistemi tamamlandı

7. **013_fix_member_classes_pk.sql**
   - Primary key düzenlemesi (composite key → serial id)

8. **014_backfill_enrollment_ids.sql**
   - Mevcut payment kayıtlarına `member_class_id` backfill işlemi

9. **015_enforce_not_null.sql**
   - NOT NULL constraint'leri eklendi
   - `member_class_id` zorunlu hale getirildi

10. **016_add_payment_types.sql**
    - `payments.payment_type` kolonu eklendi
    - Değerler: 'monthly', 'difference', 'refund', 'registration'

---

## 🔐 Güvenlik (RLS - Row Level Security)

### Mevcut Durum

Şu anda development aşamasında RLS **disabled** durumda. Production'a geçmeden önce aşağıdaki policy'ler uygulanmalıdır.

### Önerilen RLS Policies:

#### 1. Members Table
```sql
-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (admin/manager role)
CREATE POLICY "Admin can manage members"
ON members
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Read-only for instructors
CREATE POLICY "Instructors can view members"
ON members
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'instructor'
);
```

#### 2. Payments Table
```sql
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage payments"
ON payments
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' IN ('admin', 'manager'))
WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "Instructors can view their payments"
ON payments
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'instructor' AND
  class_id IN (
    SELECT id FROM classes WHERE instructor_id = (auth.jwt() ->> 'instructor_id')::bigint
  )
);
```

#### 3. Classes Table
```sql
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active classes"
ON classes
FOR SELECT
USING (active = true);

CREATE POLICY "Admin can manage classes"
ON classes
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' IN ('admin', 'manager'))
WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));
```

---

## 🔧 Veritabanı Bakım (Database Maintenance)

### 1. Type Generation (Otomatik Tip Oluşturma)

Veritabanında değişiklik yaptığınızda TypeScript tiplerini güncelleyin:

```bash
# Supabase CLI ile tip oluşturma
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

**Ne Zaman Yapılmalı:**
- Yeni tablo eklendiğinde
- Yeni kolon eklendiğinde
- Kolon tipi değiştiğinde
- Constraint güncellendiğinde

### 2. Index Optimization

Sık kullanılan sorgular için index ekleme:

```sql
-- Örnek: Gecikmiş ödemeler sorgusu için
CREATE INDEX idx_member_classes_overdue
ON member_classes(next_payment_date)
WHERE active = true AND next_payment_date < CURRENT_DATE;

-- Örnek: Ödeme tarihi aralığı sorguları için
CREATE INDEX idx_payments_date_range
ON payments(payment_date, member_id, class_id);
```

### 3. Vacuum & Analyze

PostgreSQL performansı için düzenli bakım:

```sql
-- Tablo istatistiklerini güncelle
ANALYZE members;
ANALYZE payments;
ANALYZE member_classes;

-- Dead tuples temizliği (opsiyonel, Supabase otomatik yapar)
VACUUM ANALYZE;
```

### 4. Backup Strategy

**Supabase Automatic Backups:**
- Daily backups (7 gün tutulur)
- Point-in-time recovery (Pro plan)

**Manual Backup:**
```bash
# Supabase CLI ile backup
supabase db dump -f backup_$(date +%Y%m%d).sql
```

---

## 📊 Örnek Sorgular (Common Queries)

### 1. Gecikmiş Ödemesi Olan Üyeler
```sql
SELECT DISTINCT
  m.id,
  m.first_name,
  m.last_name,
  mc.next_payment_date,
  c.name as class_name
FROM members m
JOIN member_classes mc ON m.id = mc.member_id
JOIN classes c ON mc.class_id = c.id
WHERE mc.active = true
  AND mc.next_payment_date < CURRENT_DATE
ORDER BY mc.next_payment_date ASC;
```

### 2. Aylık Gelir Raporu
```sql
SELECT
  DATE_TRUNC('month', payment_date) as month,
  SUM(amount) as total_revenue,
  COUNT(*) as payment_count
FROM payments
WHERE payment_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', payment_date)
ORDER BY month DESC;
```

### 3. Ders Başına Aktif Üye Sayısı
```sql
SELECT
  c.name,
  COUNT(DISTINCT mc.member_id) as active_members,
  SUM(mc.price) as monthly_revenue
FROM classes c
LEFT JOIN member_classes mc ON c.id = mc.class_id AND mc.active = true
WHERE c.active = true
GROUP BY c.id, c.name
ORDER BY active_members DESC;
```

### 4. Eğitmen Komisyon Özeti
```sql
SELECT
  i.first_name || ' ' || i.last_name as instructor_name,
  SUM(CASE WHEN il.status = 'payable' THEN il.amount ELSE 0 END) as payable_amount,
  SUM(CASE WHEN il.status = 'pending' THEN il.amount ELSE 0 END) as pending_amount,
  SUM(CASE WHEN il.status = 'paid' THEN il.amount ELSE 0 END) as paid_amount
FROM instructors i
LEFT JOIN instructor_ledger il ON i.id = il.instructor_id
GROUP BY i.id, i.first_name, i.last_name
ORDER BY payable_amount DESC;
```

### 5. Dondurulmuş Üyeler
```sql
SELECT
  m.first_name,
  m.last_name,
  c.name as class_name,
  fl.start_date,
  fl.end_date,
  CASE
    WHEN fl.end_date IS NULL THEN 'Süresiz'
    ELSE (fl.end_date - fl.start_date)::text || ' gün'
  END as freeze_duration
FROM frozen_logs fl
JOIN members m ON fl.member_id = m.id
JOIN member_classes mc ON fl.member_class_id = mc.id
JOIN classes c ON mc.class_id = c.id
WHERE fl.end_date IS NULL OR fl.end_date >= CURRENT_DATE
ORDER BY fl.start_date DESC;
```

---

## 🎯 Best Practices

### 1. Migration Kuralları
- ✅ Her değişiklik için ayrı migration dosyası oluşturun
- ✅ Migration dosyalarını asla silmeyin
- ✅ Dosya adı format: `XXX_descriptive_name.sql` (örn: `012_enrollment_based_architecture.sql`)
- ✅ Geriye dönük uyumluluk düşünün (backfill logic)
- ✅ Test verisi eklemeyi production migration'larından ayırın

### 2. Foreign Key Constraints
- ✅ Tüm ilişkiler için FK constraint tanımlayın
- ✅ ON DELETE davranışını belirleyin:
  ```sql
  -- Cascade delete (üye silinince enrollment'ları da silinsin)
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE

  -- Restrict delete (class silinmeden önce enrollment'lar temizlenmeli)
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT
  ```

### 3. Index Strategy
- ✅ WHERE clause'da sık kullanılan kolonlara index ekleyin
- ✅ Foreign key'lere index ekleyin (JOIN performansı için)
- ⚠️ Çok fazla index write performansını düşürür
- ⚠️ Composite index sırası önemlidir: (member_id, class_id) ≠ (class_id, member_id)

### 4. Data Integrity
- ✅ NOT NULL constraint'leri ekleyin
- ✅ CHECK constraint'leri ile veri validasyonu yapın
- ✅ UNIQUE constraint'ler ile duplicate önleyin
- ✅ DEFAULT değerler tanımlayın

### 5. Naming Conventions
- ✅ Tablo adları: çoğul, snake_case (`member_classes`, `payments`)
- ✅ Kolon adları: snake_case (`next_payment_date`, `member_class_id`)
- ✅ FK kolon adları: `table_id` format (`member_id`, `class_id`)
- ✅ Index adları: `idx_table_column` format (`idx_payments_member`)
- ✅ Constraint adları: `table_column_constraint` format

---

## 🔍 Troubleshooting

### Sorun: Type Generation Çalışmıyor
```bash
# Çözüm 1: Project ID'yi kontrol et
supabase projects list

# Çözüm 2: Login durumunu kontrol et
supabase login

# Çözüm 3: Manuel SQL ile tipleri al
supabase db dump --schema public > schema.sql
```

### Sorun: Migration Hataları
```bash
# Local migration durumunu kontrol et
supabase migration list

# Migration'ları sıfırla ve tekrar uygula
supabase db reset

# Belirli bir migration'ı uygula
supabase migration up --version XXX
```

### Sorun: Yavaş Sorgular
```sql
-- Query execution plan'ı kontrol et
EXPLAIN ANALYZE
SELECT * FROM payments WHERE member_id = 123;

-- Missing index'leri tespit et
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY abs(correlation) DESC;
```

---

## 📚 Ek Kaynaklar

- **Supabase Documentation**: https://supabase.com/docs/guides/database
- **PostgreSQL Manual**: https://www.postgresql.org/docs/current/
- **Database Design Best Practices**: https://www.sqlshack.com/learn-sql-database-design/
- **Migration Guides**: `supabase/migrations/` klasörü
- **Type Definitions**: `types/database.types.ts`

# 🚀 Özellikler Kılavuzu (Features Guide)

Bu belge, **Management System** projesinin tüm özelliklerini ve nasıl çalıştıklarını detaylandırır.

---

## 👥 Üye Yönetimi (Member Management)

### Kayıt Bazlı Mimari (Enrollment-Based Architecture)

Proje, "Genel Üyelik" yerine **"Ders Bazlı Kayıt"** (Enrollment) mantığıyla çalışır.

**Temel Prensipler:**

- Bir üye birden fazla derse kayıt olabilir
- Her dersin kendi ödeme döngüsü, fiyatı ve durumu vardır
- Bir üye "Salsa 101" dersinde aktifken, "Bachata" dersinde ödemesi gecikmiş olabilir
- Her ders kaydı (enrollment) bağımsız olarak yönetilebilir

**Database Yapısı:**

```
members (Üyeler)
    ↓
member_classes (Kayıtlar - Her üye-ders kombinasyonu)
    ↓
payments (Ödemeler - Her kayıta ait)
    ↓
frozen_logs (Dondurma kayıtları - Her kayıta ait)
```

### 1.1 Üye Oluşturma (Simplified Flow)

**Dosya:** `components/members/MemberDrawer.tsx`

- **Sadeleştirilmiş Form**: Sadece kişisel bilgiler (Ad, Soyad, Telefon)
- **Ders Ekleme Yok**: Üye oluşturma sırasında ders seçimi yapılmaz
- **Hızlı Kayıt**: Minimum bilgi ile üye oluşturulabilir
- **Sonraki Adım**: Üye detay sayfasından ders kayıtları yapılır

**Kullanıcı Akışı:**

1. "Yeni Üye" butonu → MemberDrawer açılır
2. Ad, soyad, telefon girilir
3. "Kaydet" → Üye oluşturulur (ders yok)
4. Başarı mesajı: "Yeni üye eklendi! Artık derslerine kayıt yapabilirsiniz."
5. Liste sayfasında üye görünür

### 1.2 Ders Kayıt Yönetimi (Enrollment Management)

**Dosya:** `components/members/MemberDetailView.tsx`, `components/members/AddEnrollmentModal.tsx`

#### Ders Ekleme (Add Enrollment)

- **Modal Tabanlı**: AddEnrollmentModal ile ders ekleme
- **Çoklu Seçim**: Birden fazla derse aynı anda kayıt
- **Akıllı Filtreleme**: Sadece kayıtlı olmadığı dersler gösterilir
- **Fiyatlandırma**: Her ders için özel fiyat belirleme
- **Süre Seçimi**: 1, 3, 6 veya 12 aylık taahhüt

**Özellikler:**

- Varsayılan fiyat otomatik doldurulur (class.default_price)
- Her ders için farklı fiyat belirlenebilir (custom pricing)
- Süre seçimi (payment_interval): 1, 3, 6, 12 ay
- Tüm derslere kayıtlı üye için uyarı mesajı

**Kullanıcı Akışı:**

1. Üye detay sayfasına git
2. "Ders Ekle" butonu → AddEnrollmentModal açılır
3. Dersler seçilir (MultiSelect)
4. Her ders için fiyat ve süre ayarlanır
5. "Derslere Kaydet" → member_classes kayıtları oluşturulur
6. Enrollment card'lar görünür

#### Ders Düzenleme (Edit Enrollment)

- **Fiyat Değiştirme**: Mevcut ders fiyatını güncelleme
- **Süre Değiştirme**: Payment interval değiştirme
- **Modal Tabanlı**: EditEnrollmentModal ile düzenleme

**Dosya:** `components/members/EditEnrollmentModal.tsx`

#### Ders Sonlandırma (Terminate Enrollment)

- **Temiz Ayrılma**: Üyenin dersten çıkışını kaydetme
- **Aktif Pasif**: `active` flag'i false yapılır
- **Veri Korunur**: Ödeme geçmişi silinmez
- **Modal Tabanlı**: TerminationModal ile onay

**Dosya:** `components/members/TerminationModal.tsx`

### 1.3 Üye Detay Görünümü (Member Detail View)

**Dosya:** `components/members/MemberDetailView.tsx` (690+ satır)

**Bilgiler:**

- Kişisel bilgiler (Ad, soyad, telefon, kayıt tarihi)
- Tüm ders kayıtları (aktif + pasif)
- Her ders için:
  - Ders adı, kayıt tarihi
  - Sonraki ödeme tarihi (frozen-aware)
  - Toplam ödenen tutar
  - Aktif/pasif durumu
  - Dondurma durumu (aktif freeze varsa)

**İşlemler:**

- Ders ekle (AddEnrollmentModal)
- Ders düzenle (EditEnrollmentModal)
- Ders sonlandır (TerminationModal)
- Dondur/Çöz (FreezeMemberDrawer)
- Ödeme al (PaymentConfirmModal)
- Ödeme geçmişi görüntüleme

### 1.4 Gecikmiş Ödeme Sistemi (Overdue Payment System) ⭐ YENİ

**Dosya:** `components/members/MemberDetailView.tsx`, `components/members/EnrollmentCard.tsx`

#### Çoklu Gecikmiş Ay Desteği

**Problem:** Eski sistemde sadece bir sonraki gecikmiş ay gösteriliyordu. Örneğin 3 ay gecikmiş olsa bile sadece ilk ay görünüyordu.

**Çözüm:** `getOverdueMonthsCount()` fonksiyonu ile tüm gecikmiş aylar hesaplanıyor.

**Algoritma:**

```typescript
getOverdueMonthsCount(enrollment) {
  // 1. Kayıt tarihinden bugüne kadar tüm ayları kontrol et
  // 2. Ödenen ayları çıkar (payment history'den)
  // 3. Dondurulmuş ayları atla (frozen_logs'dan)
  // 4. Bugünden önceki tüm ödenmemiş ayları say
  return overdueCount;
}
```

**Özellikler:**

- ✅ Tüm gecikmiş aylar hesaplanıyor (1, 2, 3... ay)
- ✅ Dondurulmuş aylar atlanıyor
- ✅ Ödenen aylar doğru şekilde işaretleniyor
- ✅ Bugünün ayı "gecikmiş" sayılmıyor

#### Üye Detay Sayfası Göstergeleri

**Kırmızı Alert Card (Üst Kısım):**

```
⚠️ Gecikmiş Ödemeler

Bu üyenin 2 dersinde toplam 7 aylık gecikmiş ödeme bulunmaktadır:

• Salsa: 4 ay gecikmiş (İlk gecikme: 1 Ocak 2024)
• Bachata: 3 ay gecikmiş (İlk gecikme: 1 Şubat 2024)
```

**EnrollmentCard Göstergeleri:**

- 🔴 **İkon**: Kırmızı uyarı ikonu (IconAlertCircle) + tooltip
- 🔴 **Badge**: "3 Ay Gecikmiş" yazısı
- 🔴 **Sonraki Ödeme**: Kırmızı vurgulu tarih + "3 ay gecikmiş" altyazı
- 🔴 **ThemeIcon**: Sonraki ödeme ikonunun rengi kırmızıya döner

**Tooltip Metinleri:**

- 1 ay: "Gecikmiş Ödeme" / "1 Aylık Gecikmiş Ödeme"
- 2+ ay: "3 Aylık Gecikmiş Ödeme" / "5 Aylık Gecikmiş Ödeme"

#### Üye Listesi Göstergeleri

**Dosya:** `components/members/MembersContent.tsx`

- 🔴 **İkon**: Ad soyad yanında kırmızı uyarı ikonu
- 🔴 **Tooltip**: "Gecikmiş Ödeme"
- ✅ **Sadeleştirilmiş**: Detaylar üye detay sayfasında

#### Teknik Detaylar

**Helper Functions:**

```typescript
// Bir ayın dondurulmuş olup olmadığını kontrol eder
isMonthFrozen(enrollment, month: Dayjs): boolean

// Sonraki ödeme tarihini hesaplar (dondurma-aware)
getComputedNextDate(enrollment): string

// Gecikmiş ay sayısını hesaplar
getOverdueMonthsCount(enrollment): number
```

**Type Extensions:**

```typescript
interface EnrollmentCardProps {
  enrollment: MemberClassWithDetails & {
    overdueMonthsCount?: number;
  };
  // ...
}
```

**Kontroller:**

```typescript
// Sıkı null/undefined kontrolü
{isOverdue &&
 typeof enrollment.overdueMonthsCount === 'number' &&
 enrollment.overdueMonthsCount > 0 && (
  <Badge>
    {enrollment.overdueMonthsCount === 1
      ? '1 Ay Gecikmiş'
      : `${enrollment.overdueMonthsCount} Ay Gecikmiş`}
  </Badge>
)}
```

**Bug Fixes:**

- ✅ "0 ay gecikmiş" gösterilmesi önlendi
- ✅ Ödeme yapıldığında gecikmiş göstergesi hemen kayboluyor
- ✅ `.startOf('month')` ile tarih tutarlılığı sağlandı
- ✅ Bugünün ayı "gecikmiş" sayılmıyor

**Smart Features:**

- **Computed Next Date**: Frozen period'ları atlayan sonraki ödeme tarihi hesaplama
- **Overdue Detection**: Gecikmiş ödemeleri tespit edip gösterme
- **Empty States**: Ders yoksa yönlendirici mesajlar
- **Loading States**: Her işlem için ayrı loading state'i

### 1.4 Üye Listesi (Member List)

**Dosya:** `components/members/MembersContent.tsx`

**Filtreleme:**

- **Tab Bazlı**: Aktif, Dondurulmuş, Arşiv, Tümü
- **URL State**: Tab durumu URL'de tutulur (?tab=active)
- **Search**: Ad, soyad, telefon araması
- **Sort**: Her kolona göre sıralama

**Tablo Kolonları:**

1. Ad Soyad (+ Gecikmiş ödeme ikonu)
2. Telefon (formatlanmış)
3. Kayıt Tarihi
4. Üyelik Süresi (her ders için)
5. Durum (StatusBadge)
6. Aksiyonlar (Menu)

**Bulk Operations:**

- **Çoklu Seçim**: Checkbox ile seçim (sadece arşiv tab'ında)
- **Toplu Silme**: Seçili üyeleri kalıcı silme

**Row Actions:**

- Düzenle → MemberDrawer (edit mode)
- Ödeme Al → Detay sayfasına yönlendirme
- Dondur/Çöz → FreezeMemberDrawer
- Arşivle/Geri Al → Confirm modal
- Kalıcı Sil → Confirm modal (sadece arşivdeyken)

**Overdue Indicator:**

- Her üyenin yanında kırmızı uyarı ikonu
- Tooltip: "Gecikmiş Ödeme"
- Aktif derslerdeki gecikmiş ödemeleri tespit eder

### 1.5 Dondurma Sistemi (Freeze System) ⭐ YENİ MİMARİ

**Dosya:** `actions/freeze.ts`, `components/members/FreezeMemberDrawer.tsx`

#### Ders Bazlı Dondurma (Enrollment-Based Freezing)

**Yeni Mimari:** Dondurma işlemleri artık üye bazlı değil, **ders bazlı** yapılıyor.

**Database Yapısı:**

```typescript
frozen_logs {
  id: number,
  member_id: number,              // İlişki için
  member_class_id: number,        // HANGİ DERS donduruldu? (KRITIK)
  start_date: string,             // Dondurma başlangıcı
  end_date: string | null,        // null = süresiz dondurma
  reason: string | null,
  days_count: number | null,      // Toplam dondurma günü (unfreeze'de hesaplanır)
  created_at: string
}
```

#### Özellikler:

- **Per-Enrollment Freeze**: Her ders kaydı **bağımsız olarak** dondurulabilir
  - Örnek: Salsa dersi dondurulmuş, Bachata dersi aktif olabilir
- **Timed Freeze**: Başlangıç ve bitiş tarihi ile sınırlı dondurma
- **Indefinite Freeze**: Bitiş tarihi olmayan dondurma (`end_date: null`)
- **Multiple Freeze Periods**: Aynı kayıt birden fazla kez dondurulabilir
- **Partial Freeze**: Üyenin bazı dersleri dondurulmuş, bazıları aktif olabilir

#### Üye Durumu Hesaplama (Kritik Değişiklik):

**Eski Sistem:** `members.status = 'frozen'` → Tüm dersler için global durum

**Yeni Sistem:** Dinamik hesaplama

```typescript
// Üyenin computed_status'ü aktif derslerine göre hesaplanır
const activeEnrollments = memberClasses.filter(mc => mc.active);
const frozenEnrollments = activeEnrollments.filter(mc =>
  frozen_logs.some(log =>
    log.member_class_id === mc.id && !log.end_date
  )
);

// TÜM aktif dersler dondurulmuşsa → frozen
// EN AZ BİR aktif ders aktifse → active
const computed_status =
  frozenEnrollments.length === activeEnrollments.length
    ? 'frozen'
    : 'active';
```

**Avantajlar:**

- Her dersin freeze durumu bağımsız
- Partial freeze senaryoları destekleniyor
- Üye durumu otomatik güncelleniyor
- İşlem geçmişi her ders için ayrı

#### Freeze Logic (Kritik):

```typescript
// Bir ayın dondurulmuş olup olmadığını kontrol et
const isMonthFrozen = (enrollment, month: Dayjs): boolean => {
  return enrollment.frozen_logs?.some((log) => {
    // Bu log bu enrollment'a ait mi?
    if (log.member_class_id !== enrollment.id) return false;

    const freezeStart = dayjs(log.start_date).startOf('month');
    const freezeEnd = log.end_date
      ? dayjs(log.end_date).endOf('month')
      : dayjs('2099-12-31'); // Indefinite freeze

    return month.isSameOrAfter(freezeStart) && month.isSameOrBefore(freezeEnd);
  });
};
```

#### Otomatik Ödeme Tarihi Kaydırma:

- Dondurulmuş aylar payment schedule'da **atlanır**
- Next payment date hesaplamasında frozen period'lar skip edilir
- Dondurma süresi kadar next_payment_date ileriye kayar
- Örnek: 3 ay ödedi, 6 ay dondurdu, çözdü → Frozen 6 ay gecikmiş gösterilmez

#### Freeze/Unfreeze İşlemleri:

**Dondurma:**
1. FreezeMemberDrawer'dan dersler seçilir
2. Başlangıç ve bitiş tarihi belirlenir
3. Seçilen her ders için `frozen_logs` kaydı oluşturulur
4. `member_logs` tablosuna işlem kaydı eklenir ⭐ YENİ
5. Üye status'ü otomatik güncellenir

**Dondurma Açma:**
1. Aktif freeze log'a `end_date` set edilir
2. Dondurma süresi `days_count` alanına yazılır
3. `next_payment_date` dondurma süresi kadar ileriye kayar
4. `member_logs` tablosuna işlem kaydı eklenir ⭐ YENİ
5. Üye status'ü otomatik güncellenir

#### Freeze Status Göstergeleri:

**Üye Detay Sayfası:**
- Enrollment card'da durum badge'i:
  - 🟢 "Aktif" → Enrollment aktif ve dondurulmamış
  - 🔵 "Dondurulmuş" → Aktif freeze log var
  - ⚫ "Pasif" → Enrollment veya ders arşivlenmiş

**Ders Sayfası (ClassMembersDrawer):**
- Her üyenin freeze durumu ders bazında gösterilir
- Filtreleme: Aktif, Dondurulmuş, Tümü

### 1.6 İşlem Geçmişi (Activity Logs) ⭐ YENİ

**Dosya:** `components/members/MemberHistoryTable.tsx`

**Tablo:** `member_logs`

#### Özellikler:

- Her işlem otomatik olarak kaydedilir
- Ders bazında filtreleme
- Zaman damgalı kayıtlar
- Metadata ile detaylı bilgi

#### Kaydedilen İşlemler:

```typescript
{
  member_id: number,
  member_class_id: number | null,   // Hangi derse ait?
  action_type: 'enrollment' | 'payment' | 'freeze' | 'unfreeze' | 'termination',
  description: string,               // "Salsa Başlangıç derse kayıt oluşturuldu"
  date: string,                      // İşlem tarihi
  metadata: JSON,                    // Ek detaylar
  created_at: string                 // Log oluşturma zamanı
}
```

#### Action Types:

1. **enrollment**: Yeni ders kaydı
   - Metadata: `{ class_id: number }`
2. **payment**: Ödeme alındı
   - Metadata: `{ amount, payment_method, period_start }`
3. **freeze**: Dondurma işlemi
   - Metadata: `{ start_date, end_date, reason, is_indefinite }`
4. **unfreeze**: Dondurma açma
   - Metadata: `{ original_log_id, effective_days, start_date }`
5. **termination**: Ders sonlandırma
   - Metadata: `{ reason }`

#### UI Özellikleri:

- Accordion tabanlı detay gösterimi
- Ders badge'leri ile görsel ayırım
- Metadata JSON görüntüleme
- Zaman sıralaması (yeniden eskiye)

### 1.7 Arşivleme Sistemi (Archive System) ⭐ YENİ

#### Üye Arşivleme:

**Özellikler:**
- Soft delete (veriler korunur)
- Tab bazlı görünüm (Aktif / Arşiv / Tümü)
- Arşivden geri alma
- Kalıcı silme (sadece arşivdeyken)

**Kullanıcı Akışı:**
1. Üyeler listesinde "Arşivle" butonu
2. Onay modalı
3. `members.status = 'archived'`
4. Arşiv sekmesinde görünür
5. Kalıcı silme opsiyonu (onay gerektirir)

#### Ders Arşivleme:

**Özellikler:**
- Ders arşivlendiğinde **TÜM enrollment'lar pasif olur**
- Ödeme geçmişi korunur
- Arşivlenmiş derslere yeni kayıt yapılamaz
- Üye detayda pasif olarak görünür

**Kullanıcı Akışı:**
1. Dersler listesinde "Arşivle" butonu
2. Uyarı: "Bu derse kayıtlı tüm üyelerin kayıtları pasif olacak"
3. `classes.active = false`
4. `member_classes.active = false` (bu dersin tüm kayıtları)
5. Arşiv sekmesinde görünür

**Geri Alma:**
- Ders geri alınırsa sadece ders aktif olur
- Üye kayıtları manuel olarak yeniden eklenmeli

### 1.8 Üye Durumları (Member Status)

**Type:** `'active' | 'frozen' | 'archived'`

**Database:** `members.status` (static field)
**Runtime:** `computed_status` (dinamik hesaplama)

#### Status Mantığı:

- **active**: En az bir aktif VE dondurulmamış ders kaydı var
- **frozen**: TÜM aktif ders kayıtları dondurulmuş
- **archived**: Üye arşivlenmiş (soft delete)

**Durum Geçişleri:**

- Yeni üye → `active`
- Tüm dersler freeze → `frozen` (otomatik)
- En az bir ders unfreeze → `active` (otomatik)
- Arşivle → `archived`
- Geri al → `active`

#### Computed Status (Dinamik):

```typescript
// Frontend'de dinamik hesaplama
const computed_status = (() => {
  if (member.status === 'archived') return 'archived';

  const activeEnrollments = member.member_classes?.filter(mc => mc.active);
  if (!activeEnrollments?.length) return member.status;

  const frozenCount = activeEnrollments.filter(mc =>
    frozen_logs.some(log =>
      log.member_class_id === mc.id && !log.end_date
    )
  ).length;

  return frozenCount === activeEnrollments.length ? 'frozen' : 'active';
})();
```

**Kullanım:**
- Üye listesinde `computed_status` gösterilir
- Filtreleme `computed_status`'e göre yapılır
- Database'de `members.status` referans olarak kalır

---

## 💰 Ödeme Sistemi (Payment Management)

### 2.1 Ödeme Alma (Payment Collection)

**Dosya:** `components/payments/PaymentConfirmModal.tsx`

**Özellikler:**

- **Multi-Month Payments**: Tek seferde birden fazla ay ödemesi alabilme
- **Individual Records**: Her ay ayrı bir payment kaydı olarak saklanır
- **Payment Methods**: Nakit, Kredi Kartı, Havale/EFT
- **Auto Period Selection**: Ödenmemiş periyotlar otomatik seçilir
- **Amount Calculation**: Seçilen periyotların toplam tutarı

#### Ödeme Türleri (Payment Types) ⭐ SADELEŞME

**Mevcut Türler:**

1. **monthly** (Aylık Aidat): Standart aylık ödemeler
2. **custom** (Özel Ödeme): Esnek tutar/açıklama, aylık aidatın dışında ödemeler
3. **refund** (İade): Geri ödeme kayıtları

**Kaldırılan Türler:**
- ~~registration~~ (Kayıt Ücreti) → Artık kullanılmıyor
- ~~difference~~ (Fark Ödemesi) → Artık kullanılmıyor

**Type Definition:**

```typescript
export type PaymentType = 'monthly' | 'custom' | 'refund';
```

**Kullanım:**

```typescript
// Aylık aidat
{
  payment_type: 'monthly',
  amount: 1500,
  description: 'Ocak 2025 Ödemesi'
}

// Özel ödeme
{
  payment_type: 'custom',
  amount: 500,
  description: 'Kıyafet ücreti'
}

// İade
{
  payment_type: 'refund',
  amount: -1500,
  description: 'Ocak ayı iadesi'
}
```

**Period Selection:**

- Checkbox ile çoklu ay seçimi
- Her periyot için bilgi: Tarih, Tutar, Durum (Paid/Unpaid/Overdue)
- Ödenmemiş aylar vurgulanır
- Gecikmiş aylar kırmızı ile işaretlenir

**Process Flow:**

1. Üye detay sayfasından "Ödeme Al" veya enrollment card'dan "Ödeme Ekle"
2. Modal açılır, ödenmemiş periyotlar listelenir
3. Ödeme türü seçilir (Aylık Aidat / Özel Ödeme)
4. Kaç ay ödeyeceği seçilir (1, 2, 3+ ay)
5. Tutar otomatik hesaplanır (değiştirilebilir)
6. Ödeme yöntemi seçilir
7. Açıklama eklenebilir (opsiyonel)
8. "Ödeme Al" → Her ay için ayrı payment kaydı oluşturulur
9. `member_logs` tablosuna işlem kaydı eklenir ⭐ YENİ
10. Next payment date otomatik güncellenir

**Validation:**

- En az 1 periyot seçilmeli
- Ödeme yöntemi seçilmeli
- Total amount > 0 olmalı
- Payment type seçilmeli

### 2.2 Payment Schedule (Ödeme Takvimi)

**Dosya:** `actions/payments.ts → getPaymentSchedule()`

**Algorithm (Kritik):**

```typescript
// 1. Başlangıç tarihi = Enrollment tarihi
startDate = memberClass.created_at

// 2. Commitment end date hesaplama
commitmentEndDate = max(
  lastPaidPeriod + 2 months,        // Payment-based
  startDate + payment_interval,     // Duration-based
  now + 1 month                     // Current date override
)

// 3. Schedule generation (frozen months SKIPPED)
for (month = startDate; month < commitmentEndDate; month++) {
  // CRITICAL: Skip frozen months
  if (isMonthFrozen(month)) continue

  schedule.push({
    periodMonth: month,
    status: isPaid ? 'paid' : (isOverdue ? 'overdue' : 'unpaid'),
    amount: memberClass.price
  })
}
```

**Schedule Items:**

```typescript
{
  periodMonth: '2025-01-01',  // Period start
  status: 'paid' | 'unpaid' | 'overdue',
  amount: 500,
  paidAmount?: 500,
  paidDate?: '2025-01-05',
  paymentMethod?: 'cash'
}
```

**Status Logic:**

- **paid**: Payment kaydı var
- **overdue**: Tarih geçmiş ama ödeme yok
- **unpaid**: Gelecek period veya ödenmemiş

### 2.3 Next Payment Date Calculation

**Dosya:** `components/members/MemberDetailView.tsx → getComputedNextDate()`

**Logic:**

1. Enrollment başlangıç tarihinden başla
2. Her ay için kontrol et:
   - Frozen mu? → Skip (CRITICAL FIX)
   - Ödenmiş mi? → Devam et
   - Ödenmemiş mi? → Return bu tarihi
3. 120 aylık max iterasyon (10 yıl)

**Freeze Awareness (Bug Fix):**

```typescript
const getComputedNextDate = (enrollment) => {
  const start = dayjs(enrollment.created_at);
  const paidMonths = new Set(
    payments.map((p) => dayjs(p.period_start).format('YYYY-MM'))
  );

  let check = start;
  for (let i = 0; i < 120; i++) {
    // CRITICAL: Skip frozen months
    if (isMonthFrozen(check)) {
      check = check.add(1, 'month');
      continue;
    }

    // Check if paid
    if (paidMonths.has(check.format('YYYY-MM'))) {
      check = check.add(1, 'month');
    } else {
      return check.format('YYYY-MM-DD'); // First unpaid non-frozen month
    }
  }
  return check.format('YYYY-MM-DD');
};
```

### 2.4 Ödeme Listesi (Payment History)

**Dosya:** `app/(dashboard)/payments/page.tsx`, `components/payments/PaymentsTable.tsx`

**Özellikler:**

- **Çoklu Filtreleme**: Üye, Ders, Ödeme Yöntemi
- **Tarih Aralığı**: Başlangıç - Bitiş tarihi filtresi
- **Server-Side Pagination**: Büyük veri setleri için
- **Sorting**: Her kolona göre sıralama
- **Total Amount**: Filtrelenmiş toplam tutar gösterimi

**Tablo Kolonları:**

1. Tarih (formatlanmış)
2. Üye (Ad Soyad)
3. Ders
4. Period (Ay-Yıl)
5. Tutar (TL formatında)
6. Yöntem (Badge)
7. Not (Tooltip)
8. Aksiyonlar (Detay, Sil)

**Actions:**

- **Detay**: PaymentDetailDrawer ile full bilgi
- **Sil**: Confirm modal ile güvenli silme
  - Next payment date otomatik güncellenir
  - Eğitmen commission'ı geri alınır (eğer varsa)

### 2.5 Ödeme Detayları (Payment Details)

**Dosya:** `components/payments/PaymentDetailDrawer.tsx`

**Bilgiler:**

- Ödeme tarihi
- Üye bilgileri (ad, telefon)
- Ders bilgileri (isim, eğitmen)
- Period bilgisi (Ocak 2025)
- Tutar
- Ödeme yöntemi
- Not (eğer varsa)
- Oluşturma tarihi (created_at)

---

## 🏫 Ders Yönetimi (Class Management)

### 3.1 Ders CRUD İşlemleri

**Dosya:** `app/(dashboard)/classes/page.tsx`, `actions/classes.ts`

**Özellikler:**

- **Ders Oluşturma**: Ad, varsayılan fiyat, eğitmen atama
- **Ders Düzenleme**: Bilgileri güncelleme
- **Arşivleme**: Soft delete (ders silinmez, active=false)
- **Geri Alma**: Arşivden çıkarma

**Class Fields:**

```typescript
{
  name: string,              // Ders adı (Salsa 101)
  default_price: number,     // Varsayılan aylık ücret
  instructor_id?: number,    // Sorumlu eğitmen
  active: boolean            // Aktif/arşiv durumu
}
```

### 3.2 Ders Üye Listesi

**Dosya:** `components/classes/ClassMembersDrawer.tsx`

**Özellikler:**

- Dersteki tüm üyeleri listeleme
- Her üye için:
  - Ad soyad
  - Kayıt tarihi (enrollment date)
  - Ödeme durumu
  - Freeze durumu (ders bazında)
  - Aktif/pasif durumu
- Üye detayına yönlendirme
- Filtreleme: Aktif, Dondurulmuş, Tümü

**Statistics:**

- Toplam üye sayısı
- Aktif üye sayısı
- Dondurulmuş üye sayısı
- Toplam aylık gelir

### 3.3 Ders Yönetimi İyileştirmeleri ⭐ YENİ

#### Arşivleme & Geri Alma

**Özellikler:**

- Tab bazlı görünüm: Aktif / Arşiv / Tümü
- Ders arşivlendiğinde **tüm enrollment'lar pasif** olur
- Arşivden geri alma (ders aktif olur, üye kayıtları manuel)
- Kalıcı silme (kayıtsız arşiv dersler)
- Toplu silme (arşiv sekmesinde checkbox ile)

**Kaldırılan Özellikler:**

- ~~Bulk Migration (Taşı ve Arşivle)~~ → Karmaşıklığı azaltmak için kaldırıldı
- ~~ClassMigrateModal~~ → Artık kullanılmıyor

**Neden Kaldırıldı?**

- Her üyenin farklı ödeme planı olabiliyor
- Toplu taşıma işlemi karmaşıklığa sebep oluyordu
- Bireysel yönetim daha esnek
- Arşivleme + Manuel yeniden kayıt daha kontrollü

---

## 👨‍🏫 Eğitmen Ödemeleri (Instructor Payments)

### 4.1 Commission Tracking (Komisyon Takibi)

**Dosya:** `actions/finance.ts`

**Sistem:**

- Her payment kaydında eğitmen commission'ı hesaplanır
- `instructor_ledger` tablosuna `pending` statüsünde kaydedilir
- Vade tarihinde `payable` olur

#### Ders Bazlı Komisyon Sistemi (Class-Based Commission) ⭐ YENİ

**Migration:** `supabase/migrations/017_class_based_commission.sql`

**Komisyon Öncelik Sırası:**

1. **Ders Özel Oranı**: `classes.instructor_commission_rate` (Her ders için özel)
2. **Eğitmen Varsayılan Oranı**: `instructors.default_commission_rate` (Eğitmenin genel oranı)
3. **Fallback**: 0 (Komisyon yok)

**Commission Calculation:**

```typescript
// Ders özel oranı öncelikli
let rate = 0;
if (classData.instructor_commission_rate !== null) {
  rate = classData.instructor_commission_rate; // ÖNCE ders bazlı
} else if (instructor.default_commission_rate) {
  rate = instructor.default_commission_rate; // SONRA eğitmen varsayılanı
}

// Komisyon hesaplama
commission = (payment.amount * rate) / 100;
```

**Avantajlar:**

- Her ders için farklı komisyon oranı belirlenebilir
- Özel dersler için özel oranlar
- Eğitmen değiştiğinde otomatik oran önerisi

**Ledger Entry:**

```typescript
{
  instructor_id: number,
  payment_id: number,
  amount: number,           // Commission amount
  status: 'pending' | 'payable' | 'paid',
  due_date: string,         // Payment date
  created_at: string
}
```

### 4.2 Payout Management (Hakediş Ödemesi)

**Dosya:** `app/(dashboard)/instructors/page.tsx`

**Özellikler:**

- **Pending Balance**: Eğitmen başına toplam bekleyen tutar
- **Payable Amount**: Ödemeye hazır tutar
- **Payment History**: Geçmiş ödemeler

**Payout Process:**

1. Eğitmen listesinde "Ödeme Yap" butonu
2. Confirm modal
3. Ledger'daki tüm `payable` kayıtlar `paid` olur
4. `instructor_payouts` tablosuna özet kaydı eklenir
5. Balance sıfırlanır

**Payout Record:**

```typescript
{
  instructor_id: number,
  amount: number,           // Total payout
  payment_date: string,
  payment_method?: string,
  notes?: string
}
```

### 4.3 Komisyon Detayları (Commission Details) ⭐ YENİ

**Dosya:** `components/payments/InstructorPaymentsTable.tsx`

**Özellikler:**

- **Yeni Sekme**: "Komisyon Detayları" sekmesi eklendi
- **Detaylı Görünüm**: Hangi öğrenciden ne kadar komisyon alındığı görünüyor

**Gösterilen Bilgiler:**

- Eğitmen adı
- Öğrenci adı (Hangi üyeden komisyon alındı)
- Ders adı (Hangi dersten komisyon alındı)
- Ödeme tutarı (Öğrencinin ödediği toplam)
- Komisyon tutarı (Eğitmenin kazandığı)
- Ödeme tarihi (Öğrenci ne zaman ödedi)
- Vade tarihi (Komisyon ne zaman ödenecek)
- Durum (Beklemede/Ödendi/İptal)

**Filtreleme Özellikleri:**

- Eğitmene göre filtreleme
- Duruma göre filtreleme (Tümü/Bekleyen/Ödenen)
- Toplam kayıt sayısı
- Toplam komisyon tutarı özeti

**Server Action:**

```typescript
getInstructorLedgerDetails(
  instructorId?: number,
  status?: 'pending' | 'paid' | 'all'
): Promise<ApiListResponse<LedgerWithDetails>>

// Relations dahil ediliyor:
// - payments (öğrenci ödemesi)
// - members (öğrenci bilgileri)
// - classes (ders bilgileri)
// - instructors (eğitmen bilgileri)
```

**Kullanım Senaryoları:**

1. "Bu ayın komisyonlarını kim ödedi?" → Eğitmen filtreleyip bekleyen kayıtlara bak
2. "X eğitmeninin Y öğrencisinden ne kadar komisyonu var?" → Detaylı listeleme
3. "Hangi dersten en çok komisyon alınıyor?" → Ders bazında analiz

### 4.4 Akıllı Eğitmen Değişikliği (Smart Instructor Change) ⭐ YENİ

**Dosya:** `components/classes/ClassDrawer.tsx`

**Senaryo:** Bir dersin eğitmeni değiştirildiğinde komisyon oranı ne olmalı?

**Sistem Davranışı:**

1. **Tespit**: Eğitmen dropdown'ında değişiklik algılanır
2. **Alert Gösterimi**: Kırmızı bilgilendirme kutusu görünür
3. **İki Seçenek Sunulur**:
   - "Yeni varsayılanı kullan (%X)" → Yeni eğitmenin default_commission_rate'i
   - "Mevcut oranı koru (%Y)" → Eski dersin instructor_commission_rate'i

**Alert İçeriği:**

```
🔵 Eğitmen Değişikliği Tespit Edildi

Eski Eğitmen: Ahmet Yılmaz
Bu derste özel komisyon: %35

Yeni Eğitmen: Mehmet Demir
Varsayılan komisyon: %30

Komisyon oranını nasıl güncellemek istersiniz?
[Yeni varsayılanı kullan (%30)] [Mevcut oranı koru (%35)]
```

**Avantajlar:**

- Eğitmen değişikliğinde komisyon unutulması önlenir
- Kullanıcı kontrolü sağlar
- Veri kaybı riski minimize edilir

---

## 📊 Dashboard & Raporlama

### 5.1 Dashboard Kartları

**Dosya:** `app/(dashboard)/page.tsx`

**KPI Cards:**

1. **Toplam Gelir**: Tüm zamanların toplam tahsilatı
2. **Aylık Gelir**: Bu ayki tahsilat
3. **Aktif Üyeler**: Aktif statüdeki üye sayısı
4. **Toplam Üyeler**: Tüm üyeler (arşiv hariç)

### 5.2 Grafikler

**Dosya:** `components/dashboard/`

**Revenue Chart:**

- Son 6 aylık gelir trendi
- Bar chart (Recharts)
- Tooltip ile detaylar

**Member Distribution:**

- Pie chart: Aktif, Dondurulmuş, Arşiv
- Yüzdelik dağılım

**Class Distribution:**

- Her dersin üye sayısı
- Bar chart

**Payment Methods:**

- Ödeme yöntemlerine göre dağılım
- Pie chart: Nakit, Kart, Havale

### 5.3 Recent Activities

**Özellikler:**

- Son 10 ödeme
- Son 10 üye kaydı
- Tarih, tutar, üye bilgileri

---

## ⚙️ Admin Özellikleri

### 6.1 Tarih Simülasyonu (Date Simulation)

**Dosya:** `app/admin/simulator/page.tsx`, `utils/server-date-helper.ts`

**Amaç:** Test ve demo için tarihi değiştirme

**Özellikler:**

- Admin panelinden tarih seçimi
- Cookie tabanlı (`x-simulation-date`)
- Sistem genelinde etkili
- Server-side date helper kullanır

**Usage:**

```typescript
// Server actions'da
const today = await getServerToday(); // Simulated or real date

// Logic
const isOverdue = dayjs(nextDate).isBefore(today, 'day');
```

**UI:**

- DatePicker ile tarih seçimi
- "Simülasyonu Aktifleştir" switch
- "Sıfırla" butonu (bugüne döner)
- Mevcut simülasyon tarihi gösterimi

### 6.2 Gelişmiş Admin Araçları

Simülasyon, test verisi yönetimi ve sistem sıfırlama gibi gelişmiş özellikler için **[06-ADMIN-GUIDE.md](./06-ADMIN-GUIDE.md)** dosyasına bakınız.

Bu belge şunları içerir:

- Sistem Simülatörü detayları
- Veri Sıfırlama (Wipe) ve Test Verisi Yükleme (Seed)
- Dans Türleri Yönetimi

---

## 📚 Yardım ve Dokümantasyon (Help System)

### 7.1 Uygulama İçi Yardım

**Dosya:** `app/(dashboard)/help/page.tsx`

Kullanıcıların sisteme adapte olmasını sağlamak için uygulama içinde entegre bir kullanım kılavuzu bulunur.

**İçerik:**

- **Hızlı Başlangıç Kartları:** En sık yapılan işlemler için kısa yollar.
- **Senaryo Bazlı Rehber:** "Yeni Üye Kaydı", "Ödeme Alma" gibi senaryoları adım adım anlatır. (Accordion yapısı)
- **Sıkça Sorulan Sorular:** Kullanıcıların sık yaşadığı sorunlar için çözüm önerileri.

---

## 🎨 UI/UX Özellikleri (Section 8)

### 7.1 URL State Management

**Kullanılan Yerler:**

- Member list tab filtering (?tab=active)
- Payment list filtering (?member=123&class=5)

**Avantajlar:**

- Paylaşılabilir linkler
- Browser back/forward desteği
- Sayfa yenilemede state korunur

### 7.2 Modal & Drawer Patterns

**Drawer (Yan Panel):**

- MemberDrawer: Üye oluştur/düzenle
- FreezeMemberDrawer: Dondurma yönetimi
- PaymentDetailDrawer: Ödeme detayları
- ClassMembersDrawer: Ders üye listesi

**Modal (Popup):**

- PaymentConfirmModal: Ödeme alma
- AddEnrollmentModal: Ders ekleme
- EditEnrollmentModal: Ders düzenleme
- TerminationModal: Ders sonlandırma
- Confirm Modals: Silme, arşivleme onayları

### 7.3 Empty States

**Özellikler:**

- Her liste için özel empty state
- Yönlendirici mesajlar
- Aksiyon butonları
- İkonlar ile görsellik

**Örnekler:**

- "Henüz ders kaydı bulunmuyor" → "İlk Dersi Ekle" butonu
- "Arşivlenmiş üye bulunmamaktadır" → Filtre değiştirme önerisi
- "Ödeme geçmişi bulunmuyor" → "İlk Ödemeyi Al" butonu

### 7.4 Loading States

**Skeleton Loaders:**

- DataTable loading state
- Card loading states
- Button loading spinners

**Progressive Loading:**

- Initial data load
- Action-specific loading (per button)
- Optimistic updates (hemen UI güncelle, sonra confirm)

### 7.5 Notifications (Toast)

**Dosya:** `utils/notifications.ts`

**Types:**

- Success (Yeşil): "Üye başarıyla eklendi"
- Error (Kırmızı): "Bir hata oluştu"
- Warning (Sarı): "Tüm derslere kayıtlısınız"
- Info (Mavi): Bilgilendirme mesajları

**Kullanım:**

```typescript
import { showSuccess, showError } from '@/utils/notifications';

showSuccess('İşlem başarılı');
showError('Hata oluştu');
```

### 7.6 Overdue Indicators

**Özellikler:**

- Üye listesinde kırmızı uyarı ikonu
- Tooltip: "Gecikmiş Ödeme"
- Enrollment card'larda kırmızı badge
- Payment schedule'da "overdue" status

**Logic:**

```typescript
const isOverdue = member.member_classes?.some((mc) => {
  if (!mc.active || !mc.next_payment_date) return false;
  return isPaymentOverdue(mc.next_payment_date, effectiveDate);
});
```

---

## 🔐 Güvenlik Özellikleri

### 8.1 Input Validation

**Server-Side:**

- `validateRequiredFields()` helper
- Type validation (TypeScript)
- SQL injection koruması (Supabase)

### 8.2 Error Handling

**Standardized Responses:**

```typescript
// Success
{ data: T, error: null }

// Error
{ data: null, error: string }
```

**Error Messages:**

- Kullanıcı dostu Türkçe mesajlar
- Supabase error code'larını anlamlı mesajlara çevirme
- Console logging (development)

### 8.3 Action Safety

**Confirm Modals:**

- Silme işlemlerinde onay
- Arşivleme onayı
- Geri alınamaz işlemlerde uyarı

**Soft Deletes:**

- Üyeler arşivlenir (silinmez)
- Dersler arşivlenir (silinmez)
- Sadece arşivdeki üyeler kalıcı silinebilir

---

## 📱 Responsive Design

**Özellikler:**

- Mobile-first approach
- Mantine Grid sistemi
- Responsive tablo (scroll on mobile)
- Mobile menüler (Drawer kullanımı)

**Breakpoints:**

- xs: 0-576px (Mobile)
- sm: 576-768px (Tablet)
- md: 768-992px (Desktop)
- lg: 992-1200px (Large Desktop)
- xl: 1200px+ (Extra Large)

---

## 🚀 Performance Optimizations

### 9.1 Data Fetching

**Server Components:**

- Default olarak server-side rendering
- Initial data load hızlı
- SEO friendly

**Client Components:**

- Sadece interaktif bileşenler
- Minimal client-side JavaScript

### 9.2 Caching

**Next.js Cache:**

- Automatic request memoization
- `revalidatePath()` ile cache invalidation
- Server action sonrası otomatik güncelleme

**Custom Hooks:**

- `useMembers`: Member list caching
- `usePayments`: Payment history caching
- `useClasses`: Class list caching

### 9.3 Database Optimization

**Indexes:**

- Primary keys (id)
- Foreign keys (member_id, class_id)
- Frequently queried columns (status, active)

**Selective Queries:**

- Sadece gerekli kolonları seç
- JOIN'ler minimize edilmiş
- Pagination ile veri limitleme

---

## 🔮 Gelecek Özellikler (Roadmap)

### Planlanan:

1. **Toplu SMS Gönderimi**: Gecikmiş ödemeler için otomatik hatırlatma
2. **Otomatik Fatura**: PDF fatura oluşturma ve e-posta gönderme
3. **Multi-Tenant**: Birden fazla stüdyo yönetimi
4. **Mobile App**: React Native ile mobil uygulama
5. **QR Check-in**: Derse giriş için QR kod sistemi
6. **Attendance Tracking**: Yoklama sistemi
7. **Online Payments**: Stripe/iyzico entegrasyonu
8. **WhatsApp Integration**: Ödeme hatırlatmaları
9. **Advanced Reporting**: Excel export, custom reports
10. **Role-Based Access**: Admin, Manager, Instructor rolleri

---

## 📚 Ek Kaynaklar

- **Architecture**: `docs/02-ARCHITECTURE.md` - Teknik mimari detayları
- **Database**: `docs/04-DATABASE.md` - Veritabanı şeması ve migration'lar
- **Changelog**: `docs/CHANGELOG.md` - Versiyon geçmişi ve değişiklikler

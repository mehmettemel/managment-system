# 📝 Changelog

Tüm önemli değişiklikler bu dosyada belgelenmiştir.

## [1.2.0] - 2025-12-11

### 🚀 Major Features: Enrollment System & Finance

#### [Unreleased]

### Critical Fixes & Logic Refactor

- **Freeze Logic**: Rewritten to shift dates for ALL active classes based on actual freeze duration (daysDiff).
- **Payment Deletion**: Added strict safety to delete `instructor_ledger` entries BEFORE deleting the payment to prevent ghost records.
- **Transfer Safety**: Fixed "Partial State" risk in Member Transfer and Bulk Migration. Now insert new records _before_ deactivating old ones to prevent data loss.
- **Commission Accuracy**: Updated logic to correctly calculate multi-month commissions when a student pays for multiple months upfront.
- **Payment Schedule**: Fixed "Period Match" issue. Schedules now respect the exact membership start day (e.g., 15th) instead of forcing calendar months.
- **Payout Safety**: Implemented protection against "Double Payouts" if the button is double-clicked. Added `payout_id` to ledger for strict linking.
- **DB Constraints**: Added `docs/011_critical_fixes.sql` with Unique Keys for Enrollment/Freeze and Cascade Deletes for Payments.

### Performance & Scalability

- **Overdue Members**: Optimized the database query (removed N+1 problem), significantly faster for large member bases.
- **Database Cleanup**: Removed legacy columns (`next_payment_due_date`, `monthly_fee`) that were causing data inconsistency.

### UX & Data Protection

- **Delete Protection**: The system now **blocks** deletion of users with payment history to prevent accidental loss of tax data.
- **Enrollment Integrity**: Added database constraints to prevent duplicate active enrollments in the same class.
- **Freeze Logic**: Added checks to prevent re-freezing users who are already frozen.

### Added

- **Payments**: Server-side pagination and advanced filtering (Member, Class, Payment Method) for the payments table.
- **Instructors**: "Payment History" (Geçmiş Ödemeler) tab with server-side pagination, sorting, and instructor filtering.
- **Notes**: Added `description` (Payment Note) column to payments tables with smart truncation and tooltip support.
- **UI**: Improved `DataTable` component with server-side sorting and controlled pagination props.

### Changed

- Refactored `getRecentPayments` to `getFilteredPayments` to support robust data fetching.
- Updated `InstructorPaymentsTable` to use the shared `DataTable` component for history.

#### Enrollment-Based Membership (Kayıt Bazlı Sistem)

- ✅ **Class Specific Enrollment**: Üyeler artık genel bir üyelik yerine spesifik derslere kayıt oluyor (`member_classes` tablosu genişletildi).
- ✅ **Active/Inactive Tracking**: Her ders kaydı ayrı ayrı aktif/pasif (arşivlenmiş) durumuna sahip.
- ✅ **Custom Pricing**: Her kayıt için özel fiyat belirleme imkanı (`custom_price`).
- ✅ **Price Protection**: Eski fiyattan devam etme özelliği (Grandfathering).

#### Class Management & Transfers

- ✅ **Class Archiving**: Dersleri silmeden arşivleme özelliği.
- ✅ **Bulk Migration**: Bir sınıfı topluca başka bir sınıfa taşıma (Fiyat korumalı).
- ✅ **Individual Transfer**: Üyeyi bir sınıftan diğerine taşıma sihirbazı.
- ✅ **Navigation**: Sınıf detayından üye detayına hızlı geçiş.

#### Finance & Instructor Payments

- ✅ **Instructor Ledger**: Eğitmen hakediş takibi (Hakediş defteri).
- ✅ **Commission Calculation**: Otomatik komisyon hesaplama (Varsayılan veya dans türüne göre özel oran).
- ✅ **Payout History**: Eğitmen ödeme geçmişi ve detaylı raporlama.
- ✅ **Tabs View**: Ödenecekler ve Geçmiş sekmeleri.

#### UI Components

- ✅ **EnrollmentCard**: Üye detayında her ders için ayrı kart görünümü.
- ✅ **Transfer Modals**: `MemberTransferModal` ve `ClassMigrateModal`.
- ✅ **InstructorPaymentsTable**: Tab yapısı ile geliştirilmiş ödeme tablosu.

### 🔧 Database Changes

- `member_classes`: `next_payment_date`, `active`, `payment_interval`, `custom_price` eklendi.
- `payments`: `class_id`, `snapshot_price` (tarihsel fiyat) eklendi.
- `classes`: `archived` kolunu eklendi.
- Yeni tablolar: `instructor_payouts`, `instructor_ledger`, `instructor_rates`, `dance_types`.

---

## [1.1.0] - 2025-12-11

### ✨ Yeni Özellikler

#### Ödeme Sistemi İyileştirmeleri

- ✅ **Ödeme Açıklaması**: Ödemeler için açıklama/not ekleme özelliği.
- ✅ **Payment Modals**: Yeni `PaymentConfirmModal` ve `PaymentDetailDrawer` (Dark mode uyumlu).
- ✅ **Aylık Planlama**: Yıllık üyeliklerde aylık ödeme satırları (12 ay).
- ✅ **Detaylı Görünüm**: Ödeme satırına tıklayarak detay görüntüleme.

#### Dashboard İyileştirmeleri

- ✅ **Mantine Charts** eklendi
- ✅ Aylık gelir trendi grafiği (Line Chart)
- ✅ Üye durumu dağılımı (Donut Chart)
- ✅ Son aktiviteler widget'ı
- ✅ Gelişmiş istatistik kartları (trend gösterimi ile)
- ✅ Responsive chart layout
- ✅ Suspense loading states

#### Üye Formu İyileştirmeleri

- ✅ **Gelişmiş form validasyonu** eklendi
  - Real-time validation (yazarken kontrol)
  - Türkçe karakter desteği
  - Telefon numarası formatı kontrolü
  - Minimum/maximum uzunluk kontrolleri
- ✅ **Yeni form alanları**:
  - Ödeme yöntemi seçimi (Select dropdown)
  - Ödeme açıklaması (Textarea)
  - Thousand separator (binlik ayraç)
- ✅ **İyileştirilmiş UX**:
  - Bölümlere ayrılmış form (Divider ile)
  - Açıklayıcı descriptions
  - Disabled state (ders yoksa)
  - Form reset on close
  - Loading states

### 🎨 UI/UX İyileştirmeleri

- ✅ Drawer overlay blur efekti
- ✅ Form section başlıkları
- ✅ Daha iyi placeholder metinleri
- ✅ Validation error mesajları (Türkçe)
- ✅ Success/Error toast notifications
- ✅ Disabled button states

### 📚 Dokümantasyon

- ✅ `docs/FEATURES.md` eklendi (Detaylı özellik kılavuzu)
- ✅ `docs/CHANGELOG.md` eklendi
- ✅ `docs/UI-COMPONENTS.md` güncellendi
- ✅ Form validation kuralları eklendi
- ✅ Dashboard özellikleri dokümante edildi

### 🔧 Teknik İyileştirmeler

- ✅ TypeScript type safety (any kullanımı ile)
- ✅ ESLint warnings düzeltildi
- ✅ Form validation logic iyileştirildi
- ✅ Trim() ile whitespace temizleme
- ✅ Number formatting (TR locale)
- ✅ Aktivasyon hatası için debug logları eklendi.
- ✅ Typescript tip tanımları güncellendi (`PaymentScheduleItem`).

---

## [1.0.0] - 2025-12-11

### 🎉 İlk Versiyon

#### Temel Altyapı

- ✅ Next.js 16 (App Router) kurulumu
- ✅ Mantine v8 entegrasyonu
- ✅ Supabase backend kurulumu
- ✅ TypeScript yapılandırması
- ✅ Tailwind CSS v4

#### Database

- ✅ PostgreSQL şeması oluşturuldu
- ✅ 6 tablo (members, classes, instructors, payments, member_classes, frozen_logs)
- ✅ Type definitions (`types/database.types.ts`)

#### Components

- ✅ **DataTable** - Tam özellikli tablo component'i
  - Arama
  - Sıralama
  - Filtreleme
  - Sayfalama
  - Checkbox selection
- ✅ **StatusBadge** - Durum göstergesi
- ✅ **EmptyState** - Boş durum ekranı
- ✅ **StatsCard** - İstatistik kartı
- ✅ **AppShellLayout** - Ana layout (sidebar + header)
- ✅ **MemberDrawer** - Üye ekleme/düzenleme drawer'ı

#### Pages

- ✅ Dashboard (Ana sayfa)
- ✅ Üyeler sayfası (tam fonksiyonel)
- ✅ Ödemeler (placeholder)
- ✅ Dersler (placeholder)
- ✅ Eğitmenler (placeholder)
- ✅ Profil (placeholder)
- ✅ Ayarlar (placeholder)

#### Server Actions

- ✅ `actions/members.ts` - Üye CRUD işlemleri
- ✅ `actions/payments.ts` - Ödeme işlemleri
- ✅ `actions/classes.ts` - Ders işlemleri
- ✅ `actions/instructors.ts` - Eğitmen işlemleri
- ✅ `actions/freeze.ts` - Dondurma işlemleri

#### Custom Hooks

- ✅ `useMembers()` - Üye listesi
- ✅ `useMember(id)` - Tek üye
- ✅ `useOverdueMembers()` - Gecikmiş ödemeler
- ✅ `useClasses()` - Ders listesi
- ✅ `useMemberPayments()` - Ödeme geçmişi

#### Utilities

- ✅ `utils/date-helpers.ts` - 28 günlük ödeme döngüsü
- ✅ `utils/notifications.ts` - Toast notifications
- ✅ `utils/response-helpers.ts` - API response utilities

#### Dokümantasyon

- ✅ `README.md` - Ana dokümantasyon
- ✅ `docs/project-overview.md` - Proje özeti
- ✅ `docs/developer-guide.md` - Geliştirici kılavuzu
- ✅ `docs/database-schema.sql` - Database şeması
- ✅ `docs/QUICK-START.md` - Hızlı başlangıç
- ✅ `docs/ROUTES.md` - URL rotaları
- ✅ `docs/UI-COMPONENTS.md` - Component dokümantasyonu
- ✅ `docs/SETUP-NOTES.md` - Kurulum notları

#### Theme & Design

- ✅ Turuncu (Orange) primary color
- ✅ Geist Sans font
- ✅ Responsive tasarım
- ✅ Dark mode hazırlığı (ColorSchemeScript)

---

## Gelecek Versiyonlar

### [1.2.0] - Planlanan

- [ ] Ödeme alma drawer'ı
- [ ] Üyelik dondurma drawer'ı
- [ ] Ders yönetimi sayfası
- [ ] Eğitmen yönetimi sayfası
- [ ] Member detail page

### [1.3.0] - Planlanan

- [ ] Raporlar ve analitikler
- [ ] Excel export
- [ ] PDF rapor oluşturma
- [ ] Toplu işlemler
- [ ] Authentication (Supabase Auth)

### [2.0.0] - Uzun Vadeli

- [ ] Yoklama sistemi
- [ ] WhatsApp bildirimleri
- [ ] Öğrenci mobil uygulaması
- [ ] Online ödeme entegrasyonu
- [ ] QR kod ile check-in

---

## Semantic Versioning

Proje [Semantic Versioning](https://semver.org/) kullanır:

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): Yeni özellikler (geriye uyumlu)
- **PATCH** (0.0.X): Bug fixes

---

**Mevcut Versiyon**: 1.1.0
**Son Güncelleme**: 2025-12-11

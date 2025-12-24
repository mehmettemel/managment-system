# 📝 Changelog

Tüm önemli değişiklikler bu dosyada belgelenmiştir.

## [1.4.0] - 2024-12-25

### 🚀 Pre-Deployment Verification System

- ✅ **Otomatik Deployment Kontrolleri**
  - `npm run verify`: Tüm kontrolleri tek komutta çalıştır
  - `npm run pre-deploy`: Production öncesi tam verification
  - `./scripts/pre-deploy.sh`: Detaylı raporlama ile verification script
  - Kontroller: TypeScript, ESLint, Prettier, Tests, Build

- ✅ **Yeni NPM Scripts**
  - `type-check`: TypeScript type checking
  - `lint:fix`: ESLint auto-fix
  - `format:check`: Prettier format validation
  - `validate`: Type-check + Lint + Format
  - `verify`: Validate + Tests + Build
  - `pre-deploy`: Alias for verify

- ✅ **CI/CD Pipeline (GitHub Actions)**
  - `.github/workflows/ci.yml`: Otomatik test ve build
  - Code quality checks (TypeScript, ESLint, Prettier)
  - Unit & Integration tests
  - E2E tests (Playwright)
  - Build verification
  - Coverage reporting
  - Automatic deployment verification

- ✅ **Deployment Dokümantasyonu Güncellendi**
  - Pre-deployment verification bölümü eklendi
  - CI/CD pipeline açıklamaları
  - GitHub Actions setup guide
  - Production checklist genişletildi

### 🧪 Testing Infrastructure

- ✅ **Kapsamlı Test Altyapısı Kuruldu**
  - **Vitest** integration (unit + integration tests)
  - **Playwright** E2E testing setup
  - **React Testing Library** component testing
  - **MSW** API mocking support
  - 60+ test (37 unit, 23 integration, 4 E2E specs)

- ✅ **Unit Tests** (`tests/unit/`)
  - `formatters.test.ts`: Para, telefon, ödeme yöntemi formatlama (11 test)
  - `date-helpers.test.ts`: Tarih hesaplamaları, ödeme dönemleri (26 test)

- ✅ **Integration Tests** (`tests/integration/`)
  - `member-workflow.test.tsx`: Üye kaydı, düzenleme, filtreleme (5 test)
  - `payment-workflow.test.tsx`: Ödeme toplama, geri alma, takvim (8 test)
  - `freeze-workflow.test.tsx`: Dondurma/dondurma kaldırma (10 test)

- ✅ **E2E Tests** (`tests/e2e/`)
  - `member-registration.spec.ts`: Tam üye kayıt journey
  - `payment-collection.spec.ts`: Ödeme toplama akışları
  - `freeze-unfreeze.spec.ts`: Dondurma workflow
  - `instructor-payment.spec.ts`: Eğitmen hakediş yönetimi

- ✅ **Test Senaryoları** (Help sayfasına göre)
  - Senaryo 1: Yeni Üye Kaydı → FULL ✅
  - Senaryo 2: Aylık Aidat Toplama → FULL ✅
  - Senaryo 3: Üyelik Dondurma → FULL ✅
  - Senaryo 4: Eğitmen Hakediş → FULL ✅
  - Senaryo 5: Gelir Takibi → PARTIAL ⚠️
  - Senaryo 6: Sınıf Yönetimi → PARTIAL ⚠️
  - Senaryo 7: Geçmişe Dönük Düzenleme → FULL ✅

- ✅ **Test Scripts**
  - `npm test`: Watch mode
  - `npm run test:unit`: Sadece unit testler
  - `npm run test:integration`: Sadece integration testler
  - `npm run test:e2e`: E2E testler
  - `npm run test:ui`: Vitest UI
  - `npm run test:e2e:ui`: Playwright UI
  - `npm run test:coverage`: Code coverage

- ✅ **Dokümantasyon**
  - `docs/07-TESTING.md`: Kapsamlı test dokümantasyonu
  - `tests/README.md`: Hızlı başlangıç rehberi
  - `TEST_SUMMARY.md`: Test özeti ve kapsam raporu

### 🐛 Bug Fixes

- ✅ **Freeze/Unfreeze UI State**: Ders aktifleştirildikten sonra freeze box hala görünüyordu
  - `router.refresh()` eklendi unfreeze fonksiyonlarına
  - `EnrollmentDetailView.tsx:359` - handleUnfreezeLog
  - `MemberDetailView.tsx:167` - handleUnfreezeAll
  - Server-side effectiveDate artık güncelleniyor

### 🎨 UI/UX Improvements

- ✅ **Live Clock Widget**: Header'a canlı saat eklendi
  - Gerçek zamanlı tarih ve saat gösterimi
  - Türkçe tarih formatı
  - Responsive (sm breakpoint'ten itibaren görünür)
  - `components/shared/LiveClock.tsx`

- ✅ **Full Responsive Design**
  - Tüm sayfalar mobil uyumlu hale getirildi
  - GlobalSearch, DataTable, Charts responsive
  - ScrollArea eklendi tüm tablolara
  - Expenses ve instructor payments sayfaları düzeltildi

- ✅ **Theme Toggle Fixed**
  - Login sayfası dark mode (forced)
  - App içinde light/dark toggle çalışıyor
  - Nested MantineProvider ile çözüldü

### 📚 Documentation

- ✅ **Help Page Rewrite**: Başlangıç rehberi tamamen yenilendi
  - 8 ana bölüm (Dashboard, Üye Yönetimi, Ödeme, Dondurma, vb.)
  - 4 quick access card
  - 7 sıkça sorulan soru
  - Sıfırdan başlayanlar için detaylı anlatım

- ✅ **Test Documentation**: `docs/07-TESTING.md`
  - Test yazma rehberi
  - Senaryo bazlı örnekler
  - CI/CD integration guide
  - Debugging tips
  - Coverage targets

## [1.3.0] - 2025-12-15

### 🚀 Major Features

#### Komisyon Sistemi İyileştirmeleri

- ✅ **Ders Bazlı Komisyon**: Dans türü yerine ders bazında komisyon sistemi
  - Her ders için özel komisyon oranı belirlenebilir (`instructor_commission_rate`)
  - Eğitmenlere varsayılan komisyon oranı (`default_commission_rate`)
  - Class-based priority: Ders özel oranı > Eğitmen varsayılan oranı

- ✅ **Eğitmen Komisyon Detayları**: Yeni "Komisyon Detayları" sekmesi
  - Hangi öğrenciden ne kadar komisyon alındığı görülebiliyor
  - Ders bazında detaylı komisyon dökümü
  - Durum filtreleme (Bekleyen/Ödenen)
  - Eğitmen bazında filtreleme
  - Toplam komisyon özeti
  - `getInstructorLedgerDetails()` server action

- ✅ **Akıllı Eğitmen Değişikliği**: Derste eğitmen değiştiğinde
  - Otomatik tespit sistemi
  - Yeni eğitmenin varsayılan oranını kullan / Mevcut oranı koru seçenekleri
  - Alert ile görsel bilgilendirme

#### Gecikmiş Ödeme Sistemi

- ✅ **Çoklu Gecikmiş Ay Desteği**: Sadece sonraki ay değil tüm gecikmiş aylar gösteriliyor
  - `getOverdueMonthsCount()` fonksiyonu: Tüm gecikmiş ayları hesaplıyor
  - Dondurulmuş aylar atlanıyor
  - Ödenen aylar doğru şekilde işaretleniyor

- ✅ **Üye Detay Sayfası Gecikmiş Göstergeleri**:
  - Üst kısımda kırmızı Alert card ile genel özet
  - Toplam gecikmiş ay sayısı
  - Ders bazında gecikmiş ay sayısı ve ilk gecikme tarihi
  - EnrollmentCard'da kırmızı uyarı ikonu + tooltip
  - "X Ay Gecikmiş" badge'i
  - Kırmızı vurgulu sonraki ödeme tarihi

- ✅ **Üye Listesi Gecikmiş Göstergeleri**:
  - Kırmızı uyarı ikonu + tooltip
  - Gecikmiş ödemesi olan üyeleri anında tespit

#### Dark Mode İyileştirmeleri

- ✅ **Payment Modal Dark Mode Uyumu**: Hardcoded `bg="gray.0"` kaldırıldı
- ✅ **Tüm Formlar Dark Mode Uyumlu**: Mantine theme-aware varsayılanlar kullanılıyor

#### Ödeme Yöntemi Çevirisi

- ✅ **Çoklu Dil Desteği**:
  - `formatPaymentMethod()` utility fonksiyonu
  - İngilizce/Türkçe otomatik çeviri (cash → Nakit, card → Kredi Kartı)

### 🐛 Critical Bug Fixes

- ✅ **Gecikmiş Ödeme Hesaplama Hataları**:
  - Ödeme yapıldığında gecikmiş göstergesi hemen kayboluyor
  - `period_start` tarihlerinde `.startOf('month')` eklendi
  - Paid months Set'i doğru şekilde oluşturuluyor

- ✅ **"0 Ay Gecikmiş" Sorunu**:
  - Tüm göstergelerde `typeof === 'number' && > 0` kontrolü
  - "0 ay gecikmiş" yerine hiçbir şey gösterilmiyor
  - `overdueMonthsCount === 1` için "1 ay gecikmiş" yazısı

- ✅ **Gecikmiş Ay Sayımı Hataları**:
  - Bugünün ayı artık "gecikmiş" sayılmıyor
  - `today.startOf('month')` ve `check.isSameOrAfter(today, 'month')` kontrolü
  - Tüm tarih karşılaştırmaları tutarlı hale getirildi

- ✅ **isOverdue Mantık Düzeltmeleri**:
  - `overdueMonthsCount` öncelikli kontrol
  - Freeze durumu doğru şekilde kontrol ediliyor
  - Fallback mekanizması eklendi

### 🔧 Technical Improvements

- ✅ **Type Safety**:
  - `MemberClassWithDetails & { overdueMonthsCount?: number }` interface genişletmesi
  - Strict null checks (`typeof === 'number'`)

- ✅ **Helper Functions**:
  - `isMonthFrozen()`: Bir ayın dondurulmuş olup olmadığını kontrol eder
  - `getComputedNextDate()`: Sonraki ödeme tarihini hesaplar
  - `getOverdueMonthsCount()`: Gecikmiş ay sayısını hesaplar

- ✅ **Date Handling**:
  - Tüm tarih işlemlerinde `.startOf('month')` kullanımı
  - `dayjs` ile tutarlı tarih karşılaştırmaları

### 🗄️ Database Changes

- ✅ **Migration 017**: `classes` tablosuna `instructor_commission_rate` kolonu
- ✅ **Migration**: `instructors` tablosuna `default_commission_rate` kolonu
- ✅ **Check Constraint**: Komisyon oranı 0-100 arası kontrolü

### 📚 Documentation

- ✅ CHANGELOG.md güncellendi (bu dosya)
- ✅ Tüm yeni özellikler belgelendi
- ✅ Bug fix'ler detaylı şekilde açıklandı

---

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

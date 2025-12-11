# 📝 Changelog

Tüm önemli değişiklikler bu dosyada belgelenmiştir.

## [1.1.0] - 2025-12-11

### ✨ Yeni Özellikler

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

# 🎭 Dans Okulu Yönetim Sistemi (DSMS)

Modern, ölçeklenebilir ve kullanıcı dostu dans okulu yönetim sistemi.

## 📚 Dokümantasyon

Projenin tüm detayları `docs/` klasörü altında sade ve anlaşılır bir şekilde belgelenmiştir:

1.  **[📘 Detaylı Kullanım Kılavuzu (Her Şey Burada)](./docs/user-guide.md)**
    - Adım adım resimli anlatım (gibi detaylı)
    - Başlangıçtan ileri seviyeye her işlem

2.  **[🌟 Proje Özeti](./docs/overview.md)**
    - Projesinin amacı ve kapsamı
    - Kimler için uygun?

3.  **[🎬 Kullanım Senaryoları](./docs/usage-scenarios.md)**
    - Günlük kullanım örnekleri
    - Kayıt, ödeme, dondurma işlemleri

4.  **[🚀 Kurulum ve Başlangıç](./docs/01-GETTING-STARTED.md)**
    - Önkoşullar (Node.js 20+, Supabase)
    - Kurulum adımları
    - Build kontrolleri

5.  **[🏗️ Mimari ve Teknoloji](./docs/02-ARCHITECTURE.md)**
    - Tech Stack (Next.js 16, Mantine, Supabase)
    - State Management stratejisi
    - Data Fetching yöntemleri

6.  **[💻 Geliştirme Kılavuzu](./docs/03-DEVELOPMENT.md)**
    - Yeni özellik ekleme adımları
    - Kod standartları ve Best Practices
    - Sık kullanılan komutlar

7.  **[🗄️ Veritabanı](./docs/04-DATABASE.md)**
    - Veritabanı şeması ve tablolar
    - TypeScript tip güncelleme

8.  **[🚀 Yayına Alma (Deployment)](./docs/05-DEPLOYMENT.md)**
    - Vercel deployment
    - Environment variables

9.  **[🧪 Testing (Test Dokümantasyonu)](./docs/07-TESTING.md)**
    - Unit, Integration ve E2E testler
    - 60+ test (37 unit, 23 integration, 4 E2E specs)
    - Test yazma rehberi
    - CI/CD integration

---

## ⚡ Hızlı Başlangıç

```bash
# 1. Projeyi klonlayın
git clone <repo-url>
cd managment-system

# 2. Node.js versiyonunu ayarlayın (Önemli!)
nvm use 20

# 3. Bağımlılıkları yükleyin
npm install

# 4. Env dosyasını oluşturun
cp .env.local.example .env.local

# 5. Geliştirme sunucusunu başlatın
npm run dev
```

_Detaylı kurulum için [01-GETTING-STARTED.md](./docs/01-GETTING-STARTED.md) dosyasını okuyun._

---

## 🔍 Pre-Deployment Verification

Canlıya çıkmadan önce tüm kontrolleri yapın:

```bash
# Tüm kontrolleri tek komutta (Önerilen)
npm run verify

# Veya detaylı raporlama ile
./scripts/pre-deploy.sh
```

**Kontrol edilenler:**
- ✅ TypeScript type-check
- ✅ ESLint (kod kalitesi)
- ✅ Prettier (kod formatı)
- ✅ Unit tests (37 test)
- ✅ Integration tests (23 test)
- ✅ Next.js build

Detaylı bilgi: [docs/05-DEPLOYMENT.md](./docs/05-DEPLOYMENT.md)

---

## 🏗️ Proje Hakkında

DSMS, dans okullarının ihtiyaç duyduğu üye takibi, ders programı, eğitmen yönetimi ve finansal takibi tek bir çatı altında toplar.

### Öne Çıkan Özellikler

- **Üye Yönetimi**: Kayıt, dondurma, arşivleme.
- **Finans**: Ödeme takibi, 28 günlük döngüler, gecikme uyarıları.
- **Dersler**: Esnek ders programı ve eğitmen atama.
- **Testing**: 60+ test ile %80+ coverage (unit + integration + E2E)
- **Teknoloji**: Next.js App Router, Server Actions, Supabase Auth & DB.

## 🧪 Testing

Proje kapsamlı testlerle donatılmıştır:

```bash
# Tüm testleri çalıştır
npm test

# Test türüne göre
npm run test:unit           # 37 unit test
npm run test:integration    # 23 integration test
npm run test:e2e            # E2E tests

# UI ile debug
npm run test:ui             # Vitest UI
npm run test:e2e:ui         # Playwright UI

# Coverage
npm run test:coverage
```

**Test Kapsamı:**
- ✅ 5/7 senaryo FULL coverage
- ✅ Unit tests: Utility functions
- ✅ Integration tests: Server actions
- ✅ E2E tests: Critical user journeys

Detaylı bilgi: [docs/07-TESTING.md](./docs/07-TESTING.md)

---

## 📝 Versiyon Geçmişi

Versiyon değişikliklerini görmek için [CHANGELOG.md](./docs/CHANGELOG.md) dosyasına bakabilirsiniz.

---

## 📂 Dokümantasyon Yapısı

```
docs/
├── 01-GETTING-STARTED.md    # Kurulum ve başlangıç
├── 02-ARCHITECTURE.md       # Teknik mimari
├── 02-FEATURES.md           # Özellikler
├── 03-DEVELOPMENT.md        # Geliştirme rehberi
├── 04-DATABASE.md           # Veritabanı şeması
├── 05-DEPLOYMENT.md         # Yayına alma
├── 06-ADMIN-GUIDE.md        # Admin rehberi
├── 07-TESTING.md            # Test dokümantasyonu
├── CHANGELOG.md             # Değişiklik geçmişi
├── overview.md              # Proje özeti
├── usage-scenarios.md       # Kullanım senaryoları
└── user-guide.md            # Kullanıcı rehberi

tests/
└── README.md                # Test hızlı başlangıç
```

Tüm dokümantasyon merkezi olarak `docs/` klasöründedir.

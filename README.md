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

## 🏗️ Proje Hakkında

DSMS, dans okullarının ihtiyaç duyduğu üye takibi, ders programı, eğitmen yönetimi ve finansal takibi tek bir çatı altında toplar.

### Öne Çıkan Özellikler

- **Üye Yönetimi**: Kayıt, dondurma, arşivleme.
- **Finans**: Ödeme takibi, 28 günlük döngüler, gecikme uyarıları.
- **Dersler**: Esnek ders programı ve eğitmen atama.
- **Teknoloji**: Next.js App Router, Server Actions, Supabase Auth & DB.

## 📝 Versiyon Geçmişi

Versiyon değişikliklerini görmek için [CHANGELOG.md](./docs/CHANGELOG.md) dosyasına bakabilirsiniz.

# 🚀 Production Deployment Rehberi

Bu belge, projenizi production ortamına almak için gereken tüm adımları detaylı olarak açıklar.

---

## 🎯 Hızlı Başlangıç

### Pre-Deployment Verification (Tek Komut)

Canlıya çıkmadan önce tüm kontrolleri tek komutla yapın:

```bash
# Otomatik verification script (Önerilen)
./scripts/pre-deploy.sh

# veya npm script ile
npm run pre-deploy

# veya manuel olarak
npm run verify
```

**Bu komut sırasıyla şunları kontrol eder:**
1. ✅ Node.js version (20.x)
2. ✅ TypeScript type-check
3. ✅ ESLint (kod kalitesi)
4. ✅ Prettier (kod formatı)
5. ✅ Unit tests
6. ✅ Integration tests
7. ✅ Next.js build

---

## 📋 Production Öncesi Detaylı Kontrol Listesi

### 1. ✅ Otomatik Kod Kontrolü

```bash
# Tüm kontrolleri tek komutla (Önerilen)
npm run verify

# Veya adım adım:

# TypeScript type check
npm run type-check

# ESLint kontrolü
npm run lint

# Prettier format kontrolü
npm run format:check

# Unit testler
npm run test:unit

# Integration testler
npm run test:integration

# Build
npm run build
```

**Hızlı Fix Komutları:**
```bash
# Lint hatalarını otomatik düzelt
npm run lint:fix

# Format hatalarını otomatik düzelt
npm run format
```

---

## 🤖 CI/CD Pipeline (GitHub Actions)

Proje otomatik test ve build sistemi ile gelir. Her push ve PR'da otomatik kontroller çalışır.

### GitHub Actions Workflow

`.github/workflows/ci.yml` dosyası otomatik olarak şunları yapar:

**1. Code Quality Check:**
- TypeScript type-check
- ESLint
- Prettier format check

**2. Tests:**
- Unit tests
- Integration tests
- E2E tests (Playwright)
- Coverage report

**3. Build:**
- Next.js production build
- Build artifacts upload

**4. Pre-deployment Verification:**
- Tüm checkler geçerse deployment ready

### GitHub Actions Kullanımı

```bash
# 1. Kodu push et
git add .
git commit -m "feat: new feature"
git push origin main

# 2. GitHub Actions otomatik başlar
# 3. GitHub > Actions sekmesinden takip et
# 4. Tüm checkler yeşil ✅ ise deployment yapabilirsiniz
```

### Secrets Ayarları (GitHub)

GitHub repo > Settings > Secrets and variables > Actions:

| Secret Name | Description |
|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production Supabase Anon Key |

---

### 2. ✅ Environment Variables Kontrolü

`.env.local` dosyanızda aşağıdaki değişkenlerin doğru ayarlandığından emin olun:

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PRODUCTION-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key

# Admin Authentication
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-strong-password-here
```

⚠️ **ÖNEMLİ:**
- Production ve development için **farklı Supabase projeleri** kullanın
- `ADMIN_PASSWORD` için **güçlü bir şifre** (min 12 karakter, özel karakterler) kullanın
- Hiçbir zaman `.env.local` dosyasını git'e commit etmeyin

### 3. ✅ Database Migration Kontrolü

Tüm migration dosyalarının Supabase production database'inde uygulandığından emin olun:

```bash
# Migration dosyalarını sırayla kontrol edin
ls -l supabase/migrations/

# Her migration dosyasını Supabase SQL Editor'de çalıştırın
# (001'den başlayarak 020'ye kadar)
```

### 4. ✅ Güvenlik Ayarları

#### Supabase RLS (Row Level Security) Aktivasyonu

⚠️ **KRİTİK:** Production ortamında mutlaka RLS politikalarını aktif edin!

```sql
-- Supabase SQL Editor'de çalıştırın:

-- 1. Members tablosu için RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users"
ON members
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Classes tablosu için RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users"
ON classes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Payments tablosu için RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users"
ON payments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Diğer tablolar için de aynı politikayı uygulayın
-- (member_classes, frozen_logs, instructors, vb.)
```

> **Not:** Şu anda sistem admin-only kullanım için tasarlandı. İleride role-based access control eklenebilir.

---

## 🌐 Vercel Deployment (Önerilen)

Vercel, Next.js projeleri için en iyi performansı sunar.

### Adım 1: Projeyi Git'e Yükleyin

```bash
# GitHub repository'nize push edin
git add .
git commit -m "Production hazırlıkları tamamlandı"
git push origin main
```

### Adım 2: Vercel'e Import Edin

1. [Vercel Dashboard](https://vercel.com/dashboard)'a gidin
2. "Add New Project" butonuna tıklayın
3. GitHub repository'nizi seçin ve "Import" edin

### Adım 3: Environment Variables Ekleyin

Vercel'de proje ayarlarına gidin: **Settings > Environment Variables**

Aşağıdaki değişkenleri **Production** ortamı için ekleyin:

| Variable Name                    | Value                                  | Environment |
| -------------------------------- | -------------------------------------- | ----------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | `https://xxx.supabase.co`              | Production  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | `your-production-anon-key`             | Production  |
| `ADMIN_EMAIL`                    | `admin@yourdomain.com`                 | Production  |
| `ADMIN_PASSWORD`                 | `your-strong-password`                 | Production  |

⚠️ **Güvenlik Notu:**
- `ADMIN_EMAIL` ve `ADMIN_PASSWORD` **asla** `NEXT_PUBLIC_` prefix'i ile başlamamalı
- Bu değişkenler sadece server-side'da kullanılır ve browser'a expose edilmez

### Adım 4: Deploy Edin

1. Vercel otomatik olarak ilk deploy'u başlatacak
2. Build loglarını takip edin
3. Deploy tamamlandığında size bir production URL verilecek (örn: `https://your-app.vercel.app`)

### Adım 5: Custom Domain Ekleyin (Opsiyonel)

1. Vercel Dashboard > Domains sekmesine gidin
2. "Add Domain" butonuna tıklayın
3. Kendi domain'inizi girin (örn: `app.yourdomain.com`)
4. DNS kayıtlarını güncelleyin (Vercel size yönlendirme yapacaktır)

---

## 🔧 Alternatif Deployment Seçenekleri

### Docker ile Deployment

```dockerfile
# Dockerfile örneği
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001
CMD ["npm", "start"]
```

```bash
# Build ve run
docker build -t dance-school-mgmt .
docker run -p 3001:3001 --env-file .env.local dance-school-mgmt
```

### VPS (Ubuntu Server) Deployment

```bash
# 1. Sunucuya bağlan
ssh user@your-server-ip

# 2. Node.js yükle
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. PM2 process manager yükle
sudo npm install -g pm2

# 4. Projeyi clone et
git clone https://github.com/your-username/your-repo.git
cd your-repo

# 5. Dependencies yükle ve build al
npm install
npm run build

# 6. .env.local oluştur
nano .env.local
# Environment variables'ları yapıştır ve kaydet

# 7. PM2 ile başlat
pm2 start npm --name "dance-school" -- start
pm2 save
pm2 startup

# 8. Nginx reverse proxy (opsiyonel)
sudo apt install nginx
sudo nano /etc/nginx/sites-available/dance-school

# Nginx config:
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

sudo ln -s /etc/nginx/sites-available/dance-school /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔐 Production Güvenlik Best Practices

### 1. HTTPS Kullanımı
- Vercel otomatik olarak SSL sertifikası sağlar
- VPS kullanıyorsanız Let's Encrypt ile SSL ekleyin:
  ```bash
  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx -d yourdomain.com
  ```

### 2. Environment Variables Güvenliği
- ✅ Asla `.env.local` dosyasını git'e eklemeyin (`.gitignore`'da olmalı)
- ✅ Production credentials'ları development'tan farklı tutun
- ✅ `ADMIN_PASSWORD` için güçlü şifre kullanın (min 12 karakter)
- ✅ Düzenli olarak şifreleri değiştirin

### 3. Database Güvenliği
- ✅ Supabase RLS politikalarını aktif edin
- ✅ Production database'ine sadece gerekli IP'lerden erişim verin
- ✅ Düzenli backup alın (Supabase otomatik yapar)

### 4. Rate Limiting
Supabase API rate limiting'i varsayılan olarak vardır. Gerekirse artırın.

### 5. Monitoring ve Logging
- Vercel Analytics kullanın (Built-in)
- Supabase logs takip edin
- Hata bildirimleri için Sentry gibi araçlar ekleyin (opsiyonel)

---

## 📊 Production Sonrası İzleme

### Vercel Logs

```bash
# Vercel CLI ile logs görüntüleme
npx vercel logs your-deployment-url --follow
```

### Supabase Dashboard

1. [Supabase Dashboard](https://supabase.com/dashboard) > Reports
2. Database Performance takibi
3. API Usage monitoring
4. Storage monitoring

### Health Check

Production URL'inizde şu sayfaları test edin:
- ✅ `/login` - Login sayfası çalışıyor mu?
- ✅ `/` - Dashboard yükleniyor mu?
- ✅ `/members` - Üye listesi görünüyor mu?
- ✅ `/payments` - Ödeme sistemi çalışıyor mu?

---

## 🔄 Güncelleme ve Yeni Deployment

### Vercel Otomatik Deployment

Vercel, GitHub'a her push yaptığınızda otomatik deploy eder:

```bash
git add .
git commit -m "Yeni özellik eklendi"
git push origin main
# Vercel otomatik olarak deploy edecek
```

### Manuel VPS Güncellemesi

```bash
# Sunucuya bağlan
ssh user@your-server-ip
cd your-repo

# Yeni kodu çek
git pull origin main

# Dependencies güncelle ve rebuild
npm install
npm run build

# PM2 restart
pm2 restart dance-school
```

---

## 🆘 Sorun Giderme

### Build Hataları

```bash
# Local'de production build test et
npm run build

# Hataları gör ve düzelt
# TypeScript hatalarını next.config.ts'de ignoreBuildErrors: true ile bypass ETME!
```

### Environment Variables Yüklenmedi

Vercel'de:
1. Settings > Environment Variables kontrol et
2. Değişkenleri ekledikten sonra **Redeploy** yap
3. Logs'da `console.log(process.env.ADMIN_EMAIL)` ile test et (sonra kaldır)

### Database Connection Hataları

1. Supabase URL doğru mu?
2. Anon Key doğru mu?
3. Supabase project pause olmuş olabilir (ücretsiz plan)

### Login Çalışmıyor

1. `ADMIN_EMAIL` ve `ADMIN_PASSWORD` Vercel'de tanımlı mı?
2. Server-side logları kontrol et
3. Browser console'da hata var mı?

---

## 📚 Ek Kaynaklar

- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Production Checklist**: https://supabase.com/docs/guides/platform/going-into-prod
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Security Best Practices**: https://nextjs.org/docs/advanced-features/security-headers

---

## 🎯 Production Checklist

Deploy öncesi son kontrol:

### Kod Kalitesi
- [ ] `npm run verify` başarılı ✅
- [ ] `npm run type-check` hatasız
- [ ] `npm run lint` hatasız
- [ ] `npm run format:check` başarılı
- [ ] `npm run test:unit` geçti
- [ ] `npm run test:integration` geçti
- [ ] `npm run build` başarılı
- [ ] GitHub Actions tüm checkler yeşil ✅

### Database & Environment
- [ ] `.env.local.example` güncel
- [ ] Supabase production project hazır
- [ ] Tüm migrations uygulandı
- [ ] RLS politikaları aktif
- [ ] Vercel environment variables ayarlandı
- [ ] ADMIN_EMAIL ve ADMIN_PASSWORD güçlü

### Infrastructure
- [ ] Custom domain yapılandırıldı (varsa)
- [ ] SSL sertifikası aktif
- [ ] Health check testleri geçti
- [ ] Backup stratejisi planlandı
- [ ] Monitoring araçları kuruldu

✅ Tüm maddeler tamamlandığında production'a hazırsınız!

---

## 📖 İlgili Dokümantasyon

- **[Testing Guide](./07-TESTING.md)** - Test yazma ve çalıştırma
- **[Development Guide](./03-DEVELOPMENT.md)** - Geliştirme süreçleri
- **[Architecture](./02-ARCHITECTURE.md)** - Teknik mimari

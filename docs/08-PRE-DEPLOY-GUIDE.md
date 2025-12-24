# 🚀 Pre-Deployment Verification Guide

Production'a gitmeden önce yapılması gereken tüm kontrollerin detaylı rehberi.

---

## 🎯 Hızlı Başlangıç

### Tek Komutla Tüm Kontroller

```bash
# Önerilen: Otomatik script (renkli output)
./scripts/pre-deploy.sh

# Alternatif: NPM script
npm run verify

# veya
npm run pre-deploy
```

---

## 📋 Kontrol Adımları

### 1. ✅ Node.js Version Check

```bash
node -v
# Beklenen: v20.x.x

# Eğer farklı ise:
nvm use 20
```

---

### 2. ✅ TypeScript Type Check

```bash
npm run type-check
```

**Ne kontrol eder:**
- TypeScript tip hataları
- Missing imports
- Type mismatches

**Hata varsa:**
- Hata mesajlarını oku
- İlgili dosyalarda düzelt
- Tekrar çalıştır

**Önemli:** E2E test dosyalarındaki hatalar göz ardı edilebilir (Playwright tipler).

---

### 3. ✅ ESLint Check

```bash
npm run lint
```

**Ne kontrol eder:**
- Kod kalitesi kuralları
- Unused variables
- Console.log statements (production'da olmamalı)
- Best practices violations

**Hata varsa:**
```bash
# Otomatik düzelt
npm run lint:fix

# Manuel düzeltme gerekirse
# Hata mesajındaki dosya ve satırı aç, düzelt
```

**Yaygın hatalar:**
- `console.log` kullanımı → Kaldır veya comment out
- Unused variables → Kaldır veya `_` ile başlat
- Missing dependencies in useEffect

---

### 4. ✅ Prettier Format Check

```bash
npm run format:check
```

**Ne kontrol eder:**
- Kod formatı tutarlılığı
- Indentation (2 spaces)
- Quotes (single vs double)
- Trailing commas
- Line endings

**Hata varsa:**
```bash
# Otomatik düzelt
npm run format

# Tüm dosyalar otomatik formatlanır
```

---

### 5. ✅ Unit Tests

```bash
npm run test:unit
```

**Ne kontrol eder:**
- Utility function'lar
- Helper fonksiyonlar
- Formatters (para, telefon, tarih)
- Date calculations
- Business logic helpers

**37 test çalışır:**
- `formatters.test.ts`: 11 test
- `date-helpers.test.ts`: 26 test

**Hata varsa:**
- Test hatasını oku
- İlgili function'ı düzelt
- Testi tekrar çalıştır

**Debug:**
```bash
# Watch mode ile çalıştır
npm test tests/unit/formatters.test.ts

# UI ile debug
npm run test:ui
```

---

### 6. ✅ Integration Tests

```bash
npm run test:integration
```

**Ne kontrol eder:**
- Server actions
- Database operations (mock)
- Business workflows
- Member operations
- Payment workflows
- Freeze/unfreeze logic

**23 test çalışır:**
- `member-workflow.test.tsx`: 5 test
- `payment-workflow.test.tsx`: 8 test
- `freeze-workflow.test.tsx`: 10 test

**Hata varsa:**
- Mock data kontrol et
- Server action logic gözden geçir
- Test expectations güncellenmiş mi kontrol et

---

### 7. ✅ Next.js Build

```bash
npm run build
```

**Ne kontrol eder:**
- Production build başarılı mı
- Tüm pages compile oluyor mu
- Static generation çalışıyor mu
- Client/Server component separation doğru mu

**Build süresi:** ~30-60 saniye

**Başarılı çıktı:**
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (x/x)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    ...      ...
├ ○ /login                               ...      ...
└ ○ /members                             ...      ...

○  (Static)  prerendered as static content
```

**Hata varsa:**
- Build error mesajını oku
- İlgili component/page'i düzelt
- Import paths kontrol et
- Environment variables kontrol et

**Yaygın build hataları:**
- Missing imports
- Server/Client component karışımı
- Environment variable missing
- Supabase connection (build time'da gerekli değil)

---

## 🔄 Verification Script Output

`./scripts/pre-deploy.sh` çalıştırdığınızda şöyle bir çıktı görürsünüz:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Pre-Deployment Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/7] Checking Node.js version...
✓ Node.js version: v20.19.6

[2/7] Running TypeScript type check...
✓ TypeScript type check passed

[3/7] Running ESLint...
✓ ESLint check passed

[4/7] Checking code formatting...
✓ Code formatting check passed

[5/7] Running unit tests...
✓ Unit tests passed

[6/7] Running integration tests...
✓ Integration tests passed

[7/7] Building application...
✓ Build successful

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ All pre-deployment checks passed!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Build output: .next/
📊 Coverage: coverage/

Ready for deployment! 🚀

Next steps:
  1. Push to main branch (git push origin main)
  2. Deploy to Vercel (automatic on push)
  3. Monitor deployment logs
```

---

## 🤖 CI/CD Pipeline (GitHub Actions)

Projeye her push yaptığınızda GitHub Actions otomatik çalışır.

### Workflow Adımları

**1. Code Quality Validation**
- TypeScript type-check
- ESLint
- Prettier format check

**2. Run Tests**
- Unit tests
- Integration tests
- Coverage report

**3. E2E Tests** (opsiyonel)
- Playwright browser tests
- Critical user journeys

**4. Build Application**
- Next.js production build
- Artifacts upload

**5. Pre-deployment Verification**
- Tüm checkler passed ise ✅

### GitHub Actions Kullanımı

```bash
# 1. Kodu commit et
git add .
git commit -m "feat: add new feature"

# 2. Push to GitHub
git push origin main

# 3. GitHub'da Actions sekmesine git
# https://github.com/YOUR_USERNAME/YOUR_REPO/actions

# 4. Workflow'u izle
# - Code Quality ✅
# - Tests ✅
# - Build ✅
# - Ready for deployment ✅
```

### Workflow Başarısız Olursa

1. **GitHub Actions sekmesine git**
2. **Başarısız job'a tıkla**
3. **Hata mesajını oku**
4. **Lokal'de düzelt:**
   ```bash
   npm run verify
   ```
5. **Tekrar push et**

---

## 📊 NPM Scripts Özeti

| Script | Açıklama | Süre |
|--------|----------|------|
| `npm run type-check` | TypeScript tip kontrolü | ~5s |
| `npm run lint` | ESLint kod kalitesi | ~3s |
| `npm run format:check` | Prettier format kontrolü | ~2s |
| `npm run test:unit` | Unit testler | ~5s |
| `npm run test:integration` | Integration testler | ~10s |
| `npm run build` | Next.js production build | ~45s |
| `npm run validate` | type-check + lint + format | ~10s |
| `npm run verify` | validate + tests + build | ~65s |
| `npm run pre-deploy` | verify alias | ~65s |

---

## 🎯 Production Checklist

Deployment öncesi son kontrol:

### Kod Kalitesi
- [ ] `npm run verify` başarılı ✅
- [ ] GitHub Actions tüm checkler yeşil ✅
- [ ] No console.log statements
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code formatted correctly

### Environment
- [ ] `.env.local.example` güncel
- [ ] Production Supabase credentials hazır
- [ ] ADMIN_EMAIL ve ADMIN_PASSWORD güçlü

### Database
- [ ] Tüm migrations uygulandı
- [ ] RLS policies aktif
- [ ] Backup stratejisi planlandı

### Vercel
- [ ] Environment variables ayarlandı
- [ ] Custom domain yapılandırıldı (varsa)

✅ Tüm checkler geçtikten sonra deployment yapabilirsiniz!

---

## 🔧 Troubleshooting

### "TypeScript errors in tests"

E2E test dosyalarındaki Playwright tip hataları normal. Production build'i etkilemez.

**Çözüm:** Göz ardı et veya `tsconfig.json`'da exclude ekle.

### "ESLint errors"

```bash
# Otomatik düzelt
npm run lint:fix

# Düzeltilemeyen hatalar için manuel düzeltme gerekir
```

### "Tests failing"

```bash
# UI ile debug
npm run test:ui

# Specific test
npm test tests/unit/formatters.test.ts

# Watch mode
npm test
```

### "Build fails"

```bash
# Detailed error output
npm run build 2>&1 | tee build.log

# Check environment
echo $NEXT_PUBLIC_SUPABASE_URL

# Clean and rebuild
rm -rf .next
npm run build
```

---

## 📖 İlgili Dokümantasyon

- **[Deployment Guide](./05-DEPLOYMENT.md)** - Full deployment process
- **[Testing Guide](./07-TESTING.md)** - Test writing and running
- **[Development Guide](./03-DEVELOPMENT.md)** - Development workflow

---

**Son Güncelleme:** 2024-12-25
**Versiyon:** 1.4.0

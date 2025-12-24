# 🧪 Test Dokümantasyonu

Bu proje, help sayfasındaki kullanım senaryolarına ve dokümantasyona göre kapsamlı testler içerir.

## 📖 İçindekiler

- [Test Türleri](#test-türleri)
- [Test Altyapısı](#test-altyapısı)
- [Testleri Çalıştırma](#testleri-çalıştırma)
- [Test Senaryoları](#test-senaryoları)
- [Test Yazma Rehberi](#test-yazma-rehberi)
- [Senaryo Bazlı Kapsam](#senaryo-bazlı-kapsam)
- [CI/CD Integration](#cicd-integration)
- [Debugging](#debugging)
- [Coverage](#coverage)

---

## Test Türleri

### 1. Unit Tests (Birim Testler)

Utility fonksiyonlar ve izole edilmiş kod parçalarının testleri.

**Kapsam:**
- `utils/formatters.ts` - Para, telefon, ödeme yöntemi formatlama
- `utils/date-helpers.ts` - Tarih hesaplamaları, ödeme dönemleri, freeze logic

**Konum:** `tests/unit/`

**Örnek:**
```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/utils/formatters';

describe('formatCurrency', () => {
  it('formats Turkish Lira correctly', () => {
    expect(formatCurrency(1500)).toBe('1.500 ₺');
    expect(formatCurrency(1000000)).toBe('1.000.000 ₺');
  });

  it('handles null and undefined', () => {
    expect(formatCurrency(null)).toBe('0 ₺');
    expect(formatCurrency(undefined)).toBe('0 ₺');
  });
});
```

**Test Sayısı:** 37 test

---

### 2. Integration Tests (Entegrasyon Testleri)

Server actions ve iş mantığı akışlarının testleri.

**Kapsam:**
- Üye kaydı ve düzenleme workflows
- Ödeme toplama ve geri alma logic
- Dondurma/dondurma kaldırma akışları
- Eğitmen komisyon hesaplama

**Konum:** `tests/integration/`

**Örnek:**
```typescript
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/actions/members', () => ({
  createMember: vi.fn().mockResolvedValue({
    data: { id: 1, first_name: 'Test' },
    error: null,
  }),
}));

describe('Member Registration', () => {
  it('should create new member with minimal info', async () => {
    const { createMember } = await import('@/actions/members');

    const result = await createMember({
      first_name: 'Ayşe',
      last_name: 'Kaya',
      phone: '5551112233',
    });

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      first_name: 'Ayşe',
      last_name: 'Kaya',
    });
  });
});
```

**Test Sayısı:** 23 test

---

### 3. E2E Tests (Uçtan Uca Testler)

Gerçek kullanıcı senaryolarının Playwright ile testleri.

**Kapsam:**
- Yeni üye kaydı ve ders ekleme journey
- Aylık aidat toplama (tek ay, peşin ödeme)
- Üyelik dondurma/dondurma kaldırma workflow
- Eğitmen hakedişi ödeme akışı

**Konum:** `tests/e2e/`

**Örnek:**
```typescript
import { test, expect } from '@playwright/test';

test('Complete member registration', async ({ page }) => {
  // Navigate to members page
  await page.goto('/members');

  // Click "Yeni Üye" button
  await page.click('button:has-text("Yeni Üye")');

  // Fill form
  await page.fill('input[name="first_name"]', 'Test');
  await page.fill('input[name="last_name"]', 'Kullanıcı');
  await page.fill('input[name="phone"]', '5551234567');

  // Submit
  await page.click('button[type="submit"]:has-text("Kaydet")');

  // Verify success
  await expect(page.locator('text=başarıyla eklendi')).toBeVisible();
  await expect(page.locator('text=Test Kullanıcı')).toBeVisible();
});
```

**Test Sayısı:** 4 spec dosyası (20+ test)

---

## Test Altyapısı

### Kullanılan Teknolojiler

| Tool | Amaç | Versiyou |
|------|------|----------|
| **Vitest** | Test runner (Jest alternative) | 4.0+ |
| **React Testing Library** | Component testing | 16.3+ |
| **Playwright** | E2E testing | 1.57+ |
| **MSW** | API mocking | 2.12+ |
| **Happy DOM** | DOM simulation | 20.0+ |
| **V8** | Coverage provider | Built-in |

### Dosya Yapısı

```
tests/
├── setup.ts                      # Global test setup
├── mocks/
│   └── mockData.ts              # Mock data (members, classes, payments)
├── utils/
│   └── test-utils.tsx           # Custom render with providers
├── unit/
│   ├── formatters.test.ts       # 11 tests
│   └── date-helpers.test.ts     # 26 tests
├── integration/
│   ├── member-workflow.test.tsx     # 5 tests
│   ├── payment-workflow.test.tsx    # 8 tests
│   └── freeze-workflow.test.tsx     # 10 tests
└── e2e/
    ├── member-registration.spec.ts   # Member journey
    ├── payment-collection.spec.ts    # Payment workflow
    ├── freeze-unfreeze.spec.ts       # Freeze journey
    └── instructor-payment.spec.ts    # Instructor payments

Config Files:
├── vitest.config.ts             # Vitest configuration
├── playwright.config.ts         # Playwright configuration
└── package.json                 # Test scripts
```

### Configuration

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

**playwright.config.ts:**
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3001',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
  },
});
```

---

## Testleri Çalıştırma

### Tüm Testler

```bash
# Watch mode (development)
npm test

# Single run (CI)
npm run test:all         # Unit + Integration + E2E
```

### Test Türüne Göre

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only (requires dev server)
npm run test:e2e
```

### UI ile Test Çalıştırma

```bash
# Vitest UI (unit + integration)
npm run test:ui

# Playwright UI (e2e)
npm run test:e2e:ui

# Playwright headed mode (browser visible)
npm run test:e2e:headed
```

### Code Coverage

```bash
npm run test:coverage

# Coverage report will be in: coverage/index.html
```

---

## Test Senaryoları

Testler, Help sayfasındaki gerçek kullanım senaryolarına göre yazılmıştır.

### Senaryo 1: Yeni Üye Kaydı ✅

**Kullanıcı Hikayesi:**
> Okulunuza yeni bir öğrenci geldi ve kayıt olmak istiyor.

**Test Coverage:**
- ✅ Ad, soyad, telefon ile basit kayıt
- ✅ Form validasyonu (zorunlu alanlar)
- ✅ Telefon numarası otomatik formatlama
- ✅ Üyeye ders ekleme workflow
- ✅ Birden fazla derse kayıt

**Test Dosyaları:**
- Unit: `formatters.test.ts` (telefon formatlama)
- Integration: `member-workflow.test.tsx`
- E2E: `member-registration.spec.ts`

---

### Senaryo 2: Aylık Aidat Toplama ✅

**Kullanıcı Hikayesi:**
> Ay başı geldi ve öğrencilerden ödeme almanız gerekiyor.

**Test Coverage:**
- ✅ Tek ay ödemesi alma
- ✅ 3 aylık peşin ödeme
- ✅ Farklı ödeme yöntemleri (Nakit, Kredi Kartı, Havale/EFT)
- ✅ Gecikmiş ödeme göstergesi (kırmızı ünlem)
- ✅ Ödeme takvimi otomatik oluşturma
- ✅ Yanlış ödemeyi geri alma

**Test Dosyaları:**
- Unit: `date-helpers.test.ts` (ödeme tarihleri)
- Unit: `formatters.test.ts` (para formatlama)
- Integration: `payment-workflow.test.tsx`
- E2E: `payment-collection.spec.ts`

---

### Senaryo 3: Üyelik Dondurma ✅

**Kullanıcı Hikayesi:**
> Bir öğrenci tatile gideceği için 2 ay ara vermek istiyor.

**Test Coverage:**
- ✅ Süreli dondurma (başlangıç + bitiş tarihi)
- ✅ Süresiz dondurma (sadece başlangıç)
- ✅ Birden fazla dersi aynı anda dondurma
- ✅ Dondurma kaldırma (unfreeze)
- ✅ Bitiş tarihinin bugün olarak ayarlanması
- ✅ Ödeme takviminin dondurmaya göre ayarlanması
- ✅ Dondurulan aylar için borç çıkmaması
- ✅ "Dondurulmuş" sekmesinde filtreleme
- ✅ Planlanmış dondurma iptal etme

**Test Dosyaları:**
- Unit: `date-helpers.test.ts` (tarih hesaplamaları)
- Integration: `freeze-workflow.test.tsx`
- E2E: `freeze-unfreeze.spec.ts`

---

### Senaryo 4: Eğitmen Hakediş Yönetimi ✅

**Kullanıcı Hikayesi:**
> Ay sonunda eğitmenlerinize maaş/prim ödemeniz gerekiyor.

**Test Coverage:**
- ✅ Otomatik komisyon hesaplama (ödeme alındığında)
- ✅ Bekleyen bakiye görüntüleme
- ✅ Eğitmene ödeme yapma
- ✅ Komisyon detaylarını görüntüleme
- ✅ Ödeme geçmişi
- ✅ Ödeme silindiğinde komisyonun geri alınması

**Test Dosyaları:**
- Integration: `payment-workflow.test.tsx` (komisyon logic)
- E2E: `instructor-payment.spec.ts`

---

### Senaryo 5: Gelir Takibi ve Raporlama ⚠️

**Kullanıcı Hikayesi:**
> Okulunuzun finansal durumunu görmek istiyorsunuz.

**Test Coverage:**
- ✅ Tarih aralığına göre filtreleme
- ⚠️ Dashboard grafikleri (manuel test gerekli)
- ⚠️ Toplam gelir hesaplama (manuel test)

**Test Dosyaları:**
- E2E: `payment-collection.spec.ts` (filtreleme)

---

### Senaryo 6: Sınıf Yönetimi ⚠️

**Kullanıcı Hikayesi:**
> Hangi sınıfta kaç kişi var görmek istiyorsunuz.

**Test Coverage:**
- ⚠️ Ders oluşturma (manual test)
- ⚠️ Ders üyelerini görme (manual test)
- ✅ Ders ekleme (Senaryo 1'de test edildi)

---

### Senaryo 7: Geçmişe Dönük Düzenleme ✅

**Kullanıcı Hikayesi:**
> Yanlış girilen bir ödemeyi düzeltmeniz gerekti.

**Test Coverage:**
- ✅ Ödeme silme
- ✅ Ödeme silme sonrası komisyon geri alma
- ✅ Ödeme takvimi güncelleme

**Test Dosyaları:**
- Integration: `payment-workflow.test.tsx`
- E2E: `payment-collection.spec.ts`

---

## Test Yazma Rehberi

### Unit Test Örneği

```typescript
// tests/unit/formatters.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/utils/formatters';

describe('formatCurrency', () => {
  it('formats number correctly', () => {
    expect(formatCurrency(1500)).toBe('1.500 ₺');
  });

  it('handles null and undefined', () => {
    expect(formatCurrency(null)).toBe('0 ₺');
  });
});
```

### Integration Test Örneği

```typescript
// tests/integration/member-workflow.test.tsx
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/actions/members', () => ({
  createMember: vi.fn().mockResolvedValue({
    data: { id: 1, first_name: 'Test' },
    error: null,
  }),
}));

describe('Member Registration', () => {
  it('should create new member', async () => {
    const { createMember } = await import('@/actions/members');

    const result = await createMember({
      first_name: 'Test',
      last_name: 'User',
      phone: '5551234567',
    });

    expect(result.error).toBeNull();
    expect(createMember).toHaveBeenCalledWith({
      first_name: 'Test',
      last_name: 'User',
      phone: '5551234567',
    });
  });
});
```

### E2E Test Örneği

```typescript
// tests/e2e/member-registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Member Registration Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Login logic
  });

  test('Complete member registration', async ({ page }) => {
    // Navigate
    await page.goto('/members');

    // Click button
    await page.click('button:has-text("Yeni Üye")');

    // Fill form
    await page.fill('input[name="first_name"]', 'Test');
    await page.fill('input[name="last_name"]', 'User');
    await page.fill('input[name="phone"]', '5551234567');

    // Submit
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('text=başarıyla eklendi')).toBeVisible();
  });
});
```

---

## Senaryo Bazlı Kapsam

### Test Kapsama Tablosu

| Senaryo | Unit | Integration | E2E | Kapsam |
|---------|------|-------------|-----|--------|
| 1. Üye Kaydı | ✅ 3 | ✅ 3 | ✅ 3 | FULL ✅ |
| 2. Ödeme Toplama | ✅ 9 | ✅ 8 | ✅ 5 | FULL ✅ |
| 3. Dondurma | ✅ 6 | ✅ 10 | ✅ 6 | FULL ✅ |
| 4. Eğitmen Hakediş | - | ✅ 2 | ✅ 6 | FULL ✅ |
| 5. Raporlama | - | - | ✅ 1 | PARTIAL ⚠️ |
| 6. Sınıf Yönetimi | - | - | - | PARTIAL ⚠️ |
| 7. Düzenleme | - | ✅ 2 | ✅ 1 | FULL ✅ |

**Toplam:** 5/7 senaryo FULL coverage

---

## CI/CD Integration

### GitHub Actions Örneği

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Debugging

### Vitest Debug

```bash
# Watch mode (otomatik reload)
npm test

# UI mode (visual debugging)
npm run test:ui

# Specific test file
npx vitest run tests/unit/formatters.test.ts
```

### Playwright Debug

```bash
# UI mode (step by step execution)
npm run test:e2e:ui

# Headed mode (browser visible)
npm run test:e2e:headed

# Debug mode (pause on breakpoints)
npx playwright test --debug

# Specific test file
npx playwright test tests/e2e/member-registration.spec.ts
```

### VSCode Integration

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["test"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Playwright Tests",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["playwright", "test", "--debug"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## Coverage

### Coverage Hedefleri

| Tip | Hedef | Mevcut |
|-----|-------|--------|
| Unit Tests | %80+ | - |
| Integration Tests | %70+ | - |
| E2E Tests | 7 kritik senaryo | 5/7 ✅ |

### Coverage Raporu

```bash
# Coverage oluştur
npm run test:coverage

# HTML raporu görüntüle
open coverage/index.html

# Terminal'de özet
npm run test:coverage -- --reporter=text
```

### Coverage Ayarları

`vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '.next/',
      ],
      // Thresholds
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
});
```

---

## Mock Data

`tests/mocks/mockData.ts`:

```typescript
export const mockMember = {
  id: 1,
  first_name: 'Ahmet',
  last_name: 'Yılmaz',
  phone: '5551234567',
  join_date: '2024-01-15',
  status: 'active',
};

export const mockClass = {
  id: 1,
  name: 'Salsa Başlangıç',
  default_price: 1500,
  instructor_id: 1,
  active: true,
};

export const mockEnrollment = {
  id: 1,
  member_id: 1,
  class_id: 1,
  price: 1500,
  duration: 12,
  active: true,
};

export const mockPayment = {
  id: 1,
  member_id: 1,
  amount: 1500,
  payment_date: '2024-02-01',
  payment_method: 'cash',
  type: 'monthly',
};
```

---

## Önemli Notlar

### 1. E2E Testler İçin Dev Server Gerekli

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e
```

### 2. Test Database

E2E testler için ayrı test database kullanın:

```bash
# .env.test
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-key
```

### 3. Login Credentials

E2E testlerde login için environment variable kullanın:

```typescript
// tests/e2e/setup.ts
process.env.TEST_EMAIL = 'admin@test.com';
process.env.TEST_PASSWORD = 'test123';
```

### 4. Async Timing Issues

```typescript
// ❌ Bad
await page.click('button');
expect(page.locator('text=Success')).toBeVisible();

// ✅ Good
await page.click('button');
await expect(page.locator('text=Success')).toBeVisible();
```

### 5. Parallel Execution

```typescript
// Integration tests run in parallel by default
// E2E tests run sequentially

// playwright.config.ts
export default defineConfig({
  fullyParallel: true, // Enable for E2E if needed
  workers: process.env.CI ? 1 : undefined,
});
```

---

## Prod'a Gitmeden Checklist

### ✅ Otomatik Testler

- [ ] Unit testler başarılı (`npm run test:unit`)
- [ ] Integration testler başarılı (`npm run test:integration`)
- [ ] E2E testler başarılı (`npm run test:e2e`)
- [ ] Coverage hedeflerine ulaşıldı (`npm run test:coverage`)

### ✅ Manuel Test Senaryoları

#### 1. Üye Kayıt ve Ders Ekleme
- [ ] Yeni üye ekle (ad, soyad, telefon)
- [ ] Üyeye ders ekle
- [ ] Birden fazla derse kaydet
- [ ] Özel fiyat ver

#### 2. Ödeme Toplama
- [ ] Tek ay ödemesi al
- [ ] 3 ay peşin ödemesi al
- [ ] Farklı ödeme yöntemleri test et
- [ ] Yanlış ödemeyi sil ve komisyonun geri alındığını kontrol et

#### 3. Dondurma
- [ ] Üyeyi dondur (başlangıç + bitiş)
- [ ] Süresiz dondur
- [ ] Dondurma kaldır
- [ ] Ödeme takviminin güncellendiğini kontrol et

#### 4. Eğitmen Ödemeleri
- [ ] Komisyonun otomatik eklendiğini gör
- [ ] Eğitmene ödeme yap
- [ ] Ödeme silme işlemini test et

#### 5. Raporlama
- [ ] Dashboard'da grafikleri kontrol et
- [ ] Tarih filtreleme test et

---

## Test Stack Özeti

```
Testing Framework:
├── Vitest (Jest alternative, Next.js 16 compatible)
├── React Testing Library (Component testing)
├── Playwright (E2E browser testing)
├── MSW (API mocking)
├── Happy DOM (Fast DOM simulation)
└── V8 (Built-in coverage)

Test Types:
├── Unit Tests (37 tests) - Utility functions
├── Integration Tests (23 tests) - Server actions
└── E2E Tests (4 specs) - User journeys

Coverage:
├── 5/7 scenarios fully covered
├── 60+ total tests
└── %80+ target for critical paths
```

---

## Yeni Test Ekleme Süreci

1. **Help sayfasına** yeni senaryo ekle
2. **Unit test** yaz (eğer yeni utility function varsa)
3. **Integration test** yaz (server action için)
4. **E2E test** yaz (kritik user journey ise)
5. Bu dokümantasyonu güncelle
6. `CHANGELOG.md`'ye ekle

---

## Kaynaklar

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Son Güncelleme:** 2025-12-24
**Test Coverage:** 60+ tests, 5/7 senaryolar FULL
**Status:** Production Ready ✅

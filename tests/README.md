# Test Dokümantasyonu

> **📚 Tam dokümantasyon için:** [docs/07-TESTING.md](../docs/07-TESTING.md)

Bu klasör, projenin tüm testlerini içerir.

## Hızlı Başlangıç

```bash
# Tüm testleri çalıştır
npm test

# Test türüne göre
npm run test:unit           # 37 unit test
npm run test:integration    # 23 integration test
npm run test:e2e            # E2E tests (requires dev server)

# UI ile
npm run test:ui             # Vitest UI
npm run test:e2e:ui         # Playwright UI
```

## Klasör Yapısı

```
tests/
├── setup.ts                 # Global test setup
├── mocks/                   # Mock data
│   └── mockData.ts
├── utils/                   # Test utilities
│   └── test-utils.tsx
├── unit/                    # Unit tests (37 tests)
│   ├── formatters.test.ts
│   └── date-helpers.test.ts
├── integration/             # Integration tests (23 tests)
│   ├── member-workflow.test.tsx
│   ├── payment-workflow.test.tsx
│   └── freeze-workflow.test.tsx
└── e2e/                     # E2E tests (4 specs)
    ├── member-registration.spec.ts
    ├── payment-collection.spec.ts
    ├── freeze-unfreeze.spec.ts
    └── instructor-payment.spec.ts
```

## Test Kapsamı

| Senaryo | Coverage |
|---------|----------|
| 1. Üye Kaydı | FULL ✅ |
| 2. Ödeme Toplama | FULL ✅ |
| 3. Dondurma | FULL ✅ |
| 4. Eğitmen Hakediş | FULL ✅ |
| 5. Raporlama | PARTIAL ⚠️ |
| 6. Sınıf Yönetimi | PARTIAL ⚠️ |
| 7. Düzenleme | FULL ✅ |

**Toplam:** 60+ test, 5/7 senaryo tam kapsam

## Daha Fazla Bilgi

Detaylı dokümantasyon için: **[docs/07-TESTING.md](../docs/07-TESTING.md)**

İçindekiler:
- Test yazma rehberi
- Senaryo bazlı örnekler
- CI/CD integration
- Debugging ipuçları
- Coverage hedefleri
- Mock data kullanımı

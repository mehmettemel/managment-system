# 🌟 Proje Özeti (Project Overview)

Hoş geldiniz! **Dans Okulu Yönetim Sistemi (DSMS)**, dans okullarının ve spor salonlarının karmaşık yönetim işlerini basitleştirmek için tasarlanmış modern bir web uygulamasıdır.

## 🎯 Bu Proje Ne İşe Yarar?

Bu sistemi kullanarak şunları kolayca yapabilirsiniz:

- **Öğrenci Yönetimi:** Yeni öğrenci kaydetmek, telefon numarası veya isimle öğrenci bulmak saniyeler sürer.
- **Sınıf Takibi:** Hangi derste kaç kişi var, kimler aktif, kimler bıraktı anında görüntüleyin.
- **Ödeme Takibi:** "Kim bu ay ödemesini yaptı?", "Kimin borcu var?" sorularının cevabı tek tıkla karşınızda.
- **Üyelik Dondurma:** Öğrencilerin üyeliklerini tatile veya sakatlığa göre geçici olarak dondurun, sistem ödeme takvimini otomatik ayarlasın.
- **Eğitmen Hakedişleri:** Eğitmenlerinize ne kadar ödeme yapmanız gerektiğini sistem otomatik hesaplar.

## 🚀 Kimler İçin Uygundur?

- Dans Okulları
- Yoga / Pilates Stüdyoları
- Üyelik bazlı çalışan spor salonları
- Kurs merkezleri

## 🗺️ Nasıl Başlamalıyım?

### Kullanıcılar İçin

Eğer projeye yeni katıldıysanız, aşağıdaki sırayı takip etmenizi öneririz:

1. **[📘 Detaylı Kullanım Kılavuzu](./user-guide.md):** (Tavsiye Edilen) Adım adım resimli anlatım gibi detaylı rehber.
2. **[Kullanım Senaryoları](./usage-scenarios.md):** Günlük hayatta sistemi nasıl kullanacağınızı anlatan pratik örnekler. (ÖNCE BUNU OKUYUN)
3. **[Kurulum Rehberi](./01-GETTING-STARTED.md):** Projeyi kendi bilgisayarınızda nasıl çalıştıracağınızı anlatır.
4. **[Özellikler Kılavuzu](./02-FEATURES.md):** Sistemin tüm özelliklerinin detaylı açıklaması.

### Geliştiriciler İçin

Eğer kodu geliştirecek bir yazılımcıysanız:

1. **[Kurulum](./01-GETTING-STARTED.md):** Development environment setup
2. **[Mimari](./02-ARCHITECTURE.md):** Teknik yapı ve kod organizasyonu
3. **[Testing](./07-TESTING.md):** Test yazma ve çalıştırma rehberi
4. **[Development](./03-DEVELOPMENT.md):** Geliştirme süreçleri

## 🏗️ Teknik Yapı

- **Frontend:** Next.js 16 (App Router), Mantine UI
- **Backend:** Supabase (PostgreSQL, Auth), Server Actions
- **Dil:** TypeScript
- **Testing:** Vitest, Playwright, React Testing Library
- **Coverage:** 60+ tests (37 unit, 23 integration, 4 E2E specs)

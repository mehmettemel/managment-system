# 🗄️ Veritabanı ve Şema

Proje veritabanı olarak **PostgreSQL** (Supabase üzerinde) kullanmaktadır.

## 📊 Veritabanı Şeması

Detaylı SQL şeması için [`docs/database-schema.sql`](./database-schema.sql) dosyasına bakabilirsiniz.

Temel tablolar şunlardır:

1.  **`members`**: Üyelerin temel bilgileri (Ad, Soyad, Telefon, Durum, Aylık Ücret).
2.  **`instructors`**: Eğitmen bilgileri.
3.  **`classes`**: Ders tanımları (Ad, Gün, Saat, Eğitmen ID).
4.  **`member_classes`**: Hangi üyenin hangi derse kayıtlı olduğu (Çoka-çok ilişki).
5.  **`payments`**: Ödeme kayıtları.
6.  **`frozen_logs`**: Üyelik dondurma geçmişi (Süresiz dondurma destekler, `end_date` nullable).

## 🛡️ Güvenlik (RLS - Row Level Security)

Supabase üzerinde RLS açılmalı ve politikalar (Policies) tanımlanmalıdır. Varsayılan olarak anonim erişime izin verilebilir veya Auth entegrasyonu sonrası sadece giriş yapmış kullanıcılara yetki verilebilir.

Şu anki geliştirme aşamasında **Service Role** yerine **Anon Key** ile istemci tarafında kısıtlı, sunucu tarafında (Server Actions) tam yetkili işlemler yapılması hedeflenmiştir. Ancak Server Actions `supabase-js` kullanırken RLS kurallarına tabidir. Bu yüzden policy'lerin doğru ayarlandığından emin olun.

## 🔄 TypeScript Tiplerini Güncelleme

Veritabanında bir değişiklik yaptığınızda (yeni tablo, yeni kolon vb.), projedeki TypeScript tiplerini de güncellemelisiniz.

Bunu otomatik yapmak için Supabase CLI kullanabilirsiniz:

1.  CLI'ı yükleyin (bir kereye mahsus): `npm install -g supabase`
2.  Giriş yapın: `supabase login`
3.  Tipleri oluşturun:

```bash
npx supabase gen types typescript --project-id "SİZİN_PROJE_ID" > types/database.types.ts
```

Bu işlem `types/database.types.ts` dosyasını güncelleyecek ve kodunuzda otomatik tamamlama (intellisense) çalışmaya devam edecektir.

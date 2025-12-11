# 🏗️ Proje Mimarisi

Bu belge, projenin teknik altyapısını, kullanılan teknolojileri ve temel mimari kararları açıklar.

## 💻 Teknoloji Yığını (Tech Stack)

| Kategori | Teknoloji | Açıklama |
|----------|-----------|----------|
| **Framework** | Next.js 16 (App Router) | React tabanlı full-stack framework. |
| **Dil** | TypeScript | Tip güvenliği için. |
| **UI Kütüphanesi** | Mantine v7/v8 | Hazır UI bileşenleri, hooklar ve form yönetimi. |
| **Stil** | Tailwind CSS v4 | Utility-first CSS framework (Mantine ile birlikte kullanılır). |
| **Veritabanı & Auth** | Supabase | PostgreSQL tabanlı BaaS (Backend as a Service). |
| **İkonlar** | Tabler Icons | Modern SVG ikon seti. |

## 📂 Proje Yapısı

```
/
├── actions/        # Server Actions (Backend mantığı burada çalışır)
├── app/            # Next.js App Router sayfaları ve layout'ları
├── components/     # Tekrar kullanılabilir React bileşenleri
├── docs/           # Proje dokümantasyonu
├── hooks/          # Custom React Hooks (Client-side mantık)
├── lib/            # Yapılandırma ve kütüphane başlatıcıları (Supabase client vb.)
├── public/         # Statik dosyalar (resimler, fontlar)
├── types/          # TypeScript tip tanımları
└── utils/          # Yardımcı fonksiyonlar (Tarih formatlama, hata yönetimi vb.)
```

## 🧠 State Management (Durum Yönetimi)

Projede karmaşık bir global state management kütüphanesi (Redux, Zustand vb.) **kullanılmamaktadır**. Bunun yerine şu strateji izlenir:

1.  **Server State**: Veriler (Üyeler, Ödemeler vb.) sunucudan gelir ve Next.js'in cache mekanizması ile yönetilir.
2.  **URL State**: Filtreleme, sayfalama ve arama durumları URL parametrelerinde (searchParams) tutulur. Bu sayede sayfalar paylaşılabilir olur.
3.  **Local State**: Form inputları, modal açıp kapatma gibi UI durumları için `useState` veya Mantine `useForm` kullanılır.
4.  **Context**: Sadece uygulama genelinde çok sık erişilen (örn: Auth User, Theme) veriler için React Context kullanılır.

## 📡 Data Fetching (Veri Çekme)

Veri alışverişi için **Server Actions** birincil yöntemdir.

### 1. Server Components (Önerilen)
Sayfa yüklenirken veriler sunucuda çekilir ve bileşene prop olarak verilir. Bu SEO ve performans için en iyisidir.

```typescript
// app/members/page.tsx
import { getMembers } from '@/actions/members'

export default async function MembersPage() {
  const { data } = await getMembers()
  return <MembersList members={data} />
}
```

### 2. Client Components
Kullanıcı etkileşimi sonucu veri çekilmesi gerekiyorsa (örn: butona basınca detay getirme), Server Action'lar client bileşenlerinden direkt çağrılabilir veya Supabase Client (`lib/supabase/client.ts`) kullanılabilir.

## 🔐 Güvenlik & Doğrulama

- **RLS (Row Level Security)**: Supabase tarafında veritabanı seviyesinde güvenlik kuralları tanımlanmıştır.
- **Zod / Validation**: Server Action'larda gelen veriler işlenmeden önce doğrulanır.
- **Environment Variables**: Hassas bilgiler `.env` dosyalarında tutulur ve repo'ya atılmaz.

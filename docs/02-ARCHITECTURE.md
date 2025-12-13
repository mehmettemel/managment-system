# 🏗️ Proje Mimarisi

Bu belge, projenin teknik altyapısını, kullanılan teknolojileri ve temel mimari kararları açıklar.

## 💻 Teknoloji Yığını (Tech Stack)

| Kategori              | Teknoloji               | Versiyon | Açıklama                                                       |
| --------------------- | ----------------------- | -------- | -------------------------------------------------------------- |
| **Framework**         | Next.js (App Router)    | 16.0.8   | React tabanlı full-stack framework.                            |
| **UI Framework**      | React                   | 19.2.1   | Modern UI library                                              |
| **Dil**               | TypeScript              | 5        | Tip güvenliği için.                                            |
| **UI Kütüphanesi**    | Mantine                 | 8.3.10   | Kapsamlı UI bileşenleri, forms, charts, modals                 |
| **Stil**              | Tailwind CSS            | 4        | Utility-first CSS framework (Mantine ile birlikte).            |
| **Veritabanı & Auth** | Supabase                | Latest   | PostgreSQL tabanlı BaaS (Backend as a Service).                |
| **İkonlar**           | Tabler Icons            | Latest   | Modern SVG ikon seti.                                          |
| **Animasyon**         | Framer Motion           | Latest   | Sayfa geçişleri ve animasyonlar                                |
| **Tarih İşlemleri**   | Day.js                  | Latest   | Hafif tarih kütüphanesi                                        |
| **Grafikler**         | Recharts                | Latest   | Dashboard grafikleri                                           |

## 📂 Proje Yapısı

```
/
├── app/                    # Next.js 16 App Router sayfaları ve layout'ları
│   ├── (dashboard)/       # Protected dashboard routes (middleware ile korunuyor)
│   │   ├── members/       # Üye yönetimi sayfası
│   │   ├── classes/       # Ders yönetimi sayfası
│   │   ├── payments/      # Ödeme yönetimi sayfası
│   │   ├── instructors/   # Eğitmen yönetimi sayfası
│   │   ├── settings/      # Ayarlar sayfası
│   │   └── page.tsx       # Ana dashboard
│   ├── admin/             # Admin özel sayfalar
│   │   └── simulator/     # Tarih simülasyonu
│   └── layout.tsx         # Root layout
│
├── actions/               # Server Actions (Backend mantığı burada çalışır)
│   ├── members.ts        # Üye CRUD ve ders yönetimi
│   ├── payments.ts       # Ödeme işlemleri ve schedule logic
│   ├── freeze.ts         # Dondurma/çözme mantığı
│   ├── classes.ts        # Ders CRUD
│   ├── finance.ts        # Eğitmen komisyon hesaplama
│   ├── instructors.ts    # Eğitmen CRUD
│   ├── dashboard.ts      # Dashboard istatistikleri
│   ├── simulation.ts     # Tarih simülasyonu
│   └── seed.ts           # Test data generation
│
├── components/            # Tekrar kullanılabilir React bileşenleri (48 dosya)
│   ├── members/          # Üye bileşenleri (13 dosya)
│   │   ├── MembersContent.tsx          # Liste + filtreler
│   │   ├── MemberDrawer.tsx            # Oluştur/düzenle (sadeleştirilmiş)
│   │   ├── MemberDetailView.tsx        # Detay sayfası
│   │   ├── EnrollmentCard.tsx          # Ders kartı
│   │   ├── AddEnrollmentModal.tsx      # Ders ekle modal
│   │   ├── EditEnrollmentModal.tsx     # Ders düzenle modal
│   │   ├── TerminationModal.tsx        # Ders sonlandırma
│   │   ├── FreezeMemberDrawer.tsx      # Dondurma drawer
│   │   ├── FreezeStatusCard.tsx        # Dondurma durumu
│   │   └── PaymentScheduleTable.tsx    # Ödeme takvimi
│   │
│   ├── payments/         # Ödeme bileşenleri (5 dosya)
│   │   ├── PaymentsTable.tsx
│   │   ├── PaymentConfirmModal.tsx
│   │   ├── PaymentDetailDrawer.tsx
│   │   └── ...
│   │
│   ├── classes/          # Ders bileşenleri (4 dosya)
│   ├── instructors/      # Eğitmen bileşenleri (3 dosya)
│   ├── dashboard/        # Dashboard grafikler (5 dosya)
│   ├── shared/           # Ortak bileşenler (9 dosya)
│   │   ├── DataTable.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── CurrencyInput.tsx
│   │   ├── MaskedPhoneInput.tsx
│   │   ├── TruncatedTooltip.tsx
│   │   └── ...
│   │
│   ├── settings/         # Ayarlar bileşenleri
│   ├── admin/            # Admin paneli bileşenleri
│   └── layout/           # Layout bileşenleri
│
├── hooks/                 # Custom React Hooks (Client-side mantık)
│   ├── use-members.ts    # Member list fetching + caching
│   ├── use-payments.ts   # Payment history fetching
│   └── use-classes.ts    # Class list fetching
│
├── lib/                   # Yapılandırma ve kütüphane başlatıcıları
│   └── supabase/
│       ├── client.ts     # Browser-side Supabase client
│       └── server.ts     # Server-side Supabase client (SSR)
│
├── public/                # Statik dosyalar (resimler, fontlar)
│
├── types/                 # TypeScript tip tanımları
│   ├── database.types.ts # Supabase auto-generated types
│   └── index.ts          # Application-specific types
│
├── utils/                 # Yardımcı fonksiyonlar
│   ├── date-helpers.ts           # Tarih formatlama ve hesaplama
│   ├── server-date-helper.ts    # Server-side tarih (simülasyon desteği)
│   ├── formatters.ts             # Para, telefon formatlama
│   ├── response-helpers.ts       # API response standardı
│   └── notifications.ts          # Toast bildirimleri
│
├── supabase/migrations/   # Database migration dosyaları (12 dosya)
│
└── docs/                  # Proje dokümantasyonu (bu dosyalar)
```

## 🧠 State Management (Durum Yönetimi)

Projede karmaşık bir global state management kütüphanesi (Redux, Zustand vb.) **kullanılmamaktadır**. Bunun yerine şu strateji izlenir:

1.  **Server State**: Veriler (Üyeler, Ödemeler vb.) sunucudan gelir ve Next.js'in cache mekanizması ile yönetilir.
2.  **URL State**: Filtreleme, sayfalama ve arama durumları URL parametrelerinde (searchParams) tutulur. Bu sayede sayfalar paylaşılabilir olur.
3.  **Local State**: Form inputları, modal açıp kapatma gibi UI durumları için `useState` veya Mantine `useForm` kullanılır.
4.  **Custom Hooks**: Data fetching ve caching için özel hook'lar (`use-members`, `use-payments`, `use-classes`)

**Örnek URL State Kullanımı:**
```typescript
// URL: /members?tab=frozen
const searchParams = useSearchParams()
const activeTab = searchParams.get('tab') || 'active'

// Tab değiştirince URL güncellenir
const handleTabChange = (newTab: string) => {
  const params = new URLSearchParams(searchParams)
  params.set('tab', newTab)
  router.replace(`${pathname}?${params.toString()}`)
}
```

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

Kullanıcı etkileşimi sonucu veri çekilmesi gerekiyorsa (örn: butona basınca detay getirme), Server Action'lar client bileşenlerinden direkt çağrılabilir.

```typescript
'use client'
import { getMemberById } from '@/actions/members'

const handleClick = async () => {
  const result = await getMemberById(memberId)
  if (result.data) {
    setMember(result.data)
  }
}
```

## 🏛️ Mimari Kararlar

### 1. Enrollment-Based Architecture (Kayıt Tabanlı Mimari)

Proje, "Genel Üyelik" yerine **"Ders Bazlı Kayıt"** (Enrollment) mantığıyla çalışır.

**Avantajları:**
- Bir üye birden fazla derse kayıt olabilir
- Her dersin kendi ödeme döngüsü, fiyatı ve durumu vardır
- Esnek fiyatlandırma (custom_price per enrollment)
- Per-enrollment freeze desteği

**Database Yapısı:**
```
members (Üyeler)
    ↓
member_classes (Kayıtlar - Her üye-ders kombinasyonu)
    ↓
payments (Ödemeler - Her kayıta ait)
    ↓
frozen_logs (Dondurma kayıtları - Her kayıta ait)
```

### 2. Server Actions Pattern

Tüm backend işlemleri Server Actions ile yapılır:

```typescript
// Standart action yapısı
export async function createMember(
  formData: MemberFormData
): Promise<ApiResponse<Member>> {
  try {
    // 1. Validation
    const validation = validateRequiredFields(formData, ['first_name', 'last_name'])
    if (!validation.valid) {
      return errorResponse('Gerekli alanlar eksik')
    }

    // 2. Database operation
    const { data, error } = await supabase
      .from('members')
      .insert(memberData)
      .select()
      .single()

    if (error) {
      return errorResponse(handleSupabaseError(error))
    }

    // 3. Cache invalidation
    revalidatePath('/members')

    // 4. Return standardized response
    return successResponse(data)
  } catch (error) {
    logError('createMember', error)
    return errorResponse(handleSupabaseError(error))
  }
}
```

**Standart Response Format:**
```typescript
// Success
{
  data: T,
  error: null
}

// Error
{
  data: null,
  error: string
}
```

### 3. Payment Schedule Logic

Ödeme takvimi akıllı bir algoritma ile oluşturulur:

```typescript
// Başlangıç tarihi = Enrollment tarihi (member_classes.created_at)
startDate = memberClass.created_at

// Commitment end date hesaplama
commitmentEndDate = max(
  lastPaidPeriod + 2 months,        // Payment-based
  startDate + payment_interval,     // Duration-based
  now + 1 month                     // Current date override
)

// Schedule generation (frozen months skipped)
for (month = startDate; month < commitmentEndDate; month++) {
  if (isMonthFrozen(month)) continue  // SKIP frozen months

  schedule.push({
    periodMonth: month,
    status: isPaid ? 'paid' : (isOverdue ? 'overdue' : 'unpaid'),
    amount: memberClass.price
  })
}
```

**Frozen Period Skip Logic:**
```typescript
const isMonthFrozen = (month: Dayjs): boolean => {
  return frozenLogs.some(log => {
    const freezeStart = dayjs(log.start_date).startOf('month')
    const freezeEnd = log.end_date
      ? dayjs(log.end_date).endOf('month')
      : dayjs('2099-12-31') // Indefinite freeze

    return month.isSameOrAfter(freezeStart) && month.isSameOrBefore(freezeEnd)
  })
}
```

### 4. Date Simulation System

Test ve demo amaçlı tarih simülasyonu desteği:

```typescript
// utils/server-date-helper.ts
const SIMULATION_COOKIE = 'x-simulation-date'

export async function getServerToday(): Promise<string> {
  const cookies = await import('next/headers').then(m => m.cookies())
  const simulationDate = cookies.get(SIMULATION_COOKIE)?.value

  if (simulationDate && isValidDate(simulationDate)) {
    return simulationDate
  }

  return dayjs().format('YYYY-MM-DD')
}
```

**Admin Simulator UI** (`admin/simulator/page.tsx`):
- Tarih seçme
- Simülasyonu aktifleştir/kapat
- Sistem genelinde etkili olur

### 5. Type Safety

Tüm proje TypeScript ile yazılmıştır ve strict mode kullanır:

```typescript
// Supabase auto-generated types
import type { Database } from '@/types/database.types'

// Application-specific types
export type Member = Database['public']['Tables']['members']['Row']
export type MemberInsert = Database['public']['Tables']['members']['Insert']
export type MemberUpdate = Database['public']['Tables']['members']['Update']

// Extended types
export interface MemberWithClasses extends Member {
  member_classes: MemberClassWithDetails[]
  frozen_logs: FrozenLog[]
}

export interface MemberClassWithDetails extends MemberClass {
  classes?: Class
}
```

## 🔐 Güvenlik & Doğrulama

- **RLS (Row Level Security)**: Supabase tarafında veritabanı seviyesinde güvenlik kuralları (şu anda development için disable, production'da enable edilmeli)
- **Input Validation**: Server Action'larda `validateRequiredFields()` ve `sanitizeInput()` kullanılır
- **Environment Variables**: Hassas bilgiler `.env.local` dosyasında tutulur ve repo'ya atılmaz
- **Server-Side Actions**: Tüm kritik işlemler server'da yapılır, client-side manipulation önlenir

## 🎨 UI/UX Patterns

### Component Organization
- **Container Components**: Data fetching ve state management
- **Presentation Components**: Sadece UI rendering
- **Modal/Drawer Pattern**: Form işlemleri için modal/drawer kullanımı
- **Empty States**: Veri yoksa kullanıcıyı yönlendiren boş durum bileşenleri

### Form Pattern
```typescript
'use client'

export function MyForm() {
  const form = useForm({
    initialValues: { ... },
    validate: { ... }
  })

  const handleSubmit = async (values) => {
    const result = await myServerAction(values)
    if (result.error) {
      showError(result.error)
    } else {
      showSuccess('İşlem başarılı')
      onSuccess?.()
    }
  }

  return <form onSubmit={form.onSubmit(handleSubmit)}>...</form>
}
```

### Toast Notifications
```typescript
import { showSuccess, showError } from '@/utils/notifications'

// Success
showSuccess('Üye başarıyla eklendi')

// Error
showError('Bir hata oluştu')
```

## 📊 Performance Optimizations

- **Server Components**: Default olarak server-side rendering
- **Selective Client Components**: Sadece interaktif bileşenler 'use client'
- **Revalidation**: `revalidatePath()` ile cache invalidation
- **Lazy Loading**: Dynamic imports kullanılmıyor (şu an gerek yok)
- **Database Indexes**: Sık sorgulanan kolonlarda index (migrations'da tanımlı)

## 🔄 Development Workflow

1. **Feature Development**: Component → Server Action → Database
2. **Testing**: Manual testing (E2E testler henüz yok)
3. **Database Changes**: Migration dosyası oluştur → Supabase'e push
4. **Type Updates**: `npx supabase gen types typescript > types/database.types.ts`
5. **Deployment**: Vercel (Next.js) + Supabase (Database)

## 🚀 Build & Deploy

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type generation
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

## 📝 Best Practices

1. ✅ **Type Safety**: Her zaman TypeScript types kullan
2. ✅ **Server Actions**: Form submission'lar için server actions
3. ✅ **Revalidation**: Veri değiştikten sonra cache'i temizle
4. ✅ **Error Handling**: Try-catch + standardized error responses
5. ✅ **Input Sanitization**: Kullanıcı girdilerini sanitize et
6. ✅ **Separation of Concerns**: Her component tek bir işe odaklansın
7. ✅ **Component Reusability**: Shared components klasöründe ortak bileşenler
8. ✅ **Consistent Naming**: TypeScript naming conventions
9. ✅ **Documentation**: Kritik fonksiyonlarda JSDoc comments

## 🔮 Future Architecture Considerations

- Redis caching layer for frequently accessed data
- Background job queue (Bull/BullMQ) for heavy operations
- Event-driven architecture (webhooks for payment notifications)
- API rate limiting
- Multi-tenancy support (multiple studios)
- Mobile app (React Native with shared types)

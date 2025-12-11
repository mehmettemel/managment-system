# 💻 Geliştirme Kılavuzu

Yeni özellik eklerken veya mevcut kodu düzenlerken izlenmesi gereken adımlar ve standartlar.

## 🚀 Yeni Bir Özellik Ekleme Akışı

Standart bir özellik (örn: "Ders Programı") eklerken şu sırayı takip edin:

1.  **Veritabanı**: Gerekirse `docs/database-schema.sql` dosyasına bakarak yeni tablo oluşturun veya mevcut tabloyu güncelleyin.
    - *Not:* Tablo değişikliği yaptıysanız tipleri güncellemeyi unutmayın.
2.  **Types**: `types/` klasöründe gerekli tip tanımlarını yapın. (Supabase tiplerini generate etmek işi kolaylaştırır).
3.  **Server Actions**: `actions/` klasöründe CRUD işlemleri için (create, read, update, delete) fonksiyonlarınızı yazın.
    - Fonksiyonların başına `'use server'` eklemeyi unutmayın.
    - Hata yönetimi için `try-catch` blokları kullanın.
    - `revalidatePath` ile veriyi tazeleyin.
4.  **UI Bileşenleri**: `components/` altında gerekli form veya lise bileşenlerini oluşturun.
5.  **Sayfa (Page)**: `app/` altında ilgili rotayı oluşturun ve bileşenleri birleştirin.

## 📏 Kod Standartları ve Best Practices

### 1. Tip Güvenliği (TypeScript)
`any` kullanmaktan kaçının. Her zaman tanımlı tipleri (`Member`, `Payment` vb.) kullanın.

```typescript
// ✅ Doğru
function MemberCard({ member }: { member: Member }) { ... }

// ❌ Yanlış
function MemberCard({ member }: { member: any }) { ... }
```

### 2. Form Yönetimi
Mantine `useForm` hook'unu kullanarak form validasyonlarını yönetin.

```typescript
const form = useForm({
  initialValues: { email: '' },
  validate: {
    email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Geçersiz email'),
  },
});
```

### 3. Build Kontrolleri
Geliştirme yaparken terminalde herhangi bir hata olmadığından emin olun. Kodunuzu pushlamadan önce mutlaka build alın:

```bash
npm run build
```

Eğer "Type error" veya "Lint error" alıyorsanız, bunları düzeltmeden production'a çıkmayın.

### 4. İsimlendirme
- **Dosyalar**: `kebab-case` (örn: `member-card.tsx`, `auth-actions.ts`)
- **Componentler**: `PascalCase` (örn: `MemberCard`, `MainLayout`)
- **Fonksiyonlar**: `camelCase` (örn: `getMembers`, `calculateTotal`)

### 5. Formatlama ve Özel Inputlar
Projeye tutarlılık sağlamak için aşağıdaki yardımcıları kullanın:

- **Para Birimi**: `utils/formatters.ts` -> `formatCurrency(val)` (Çıktı: 1.200 ₺)
- **Telefon**: `utils/formatters.ts` -> `formatPhone(val)` (Çıktı: +90 555 ...)
- **Inputlar**: Standart `TextInput` veya `NumberInput` yerine;
    - `components/shared/MaskedPhoneInput`: Telefon girişi için.
    - `components/shared/CurrencyInput`: Para girişi için.
    - `components/shared/DataTable`: Gelişmiş tablo (Filtreleme ve Arama destekli).

## 🛠️ Sık Kullanılan Komutlar

- `npm run dev`: Geliştirme sunucusunu başlatır.
- `npm run build`: Production için derler.
- `npm run start`: Build edilmiş projeyi çalıştırır.
- `npm run lint`: Kod stil hatalarını denetler.

## 🐞 Hata Ayıklama (Debugging)

- **Server-Side Loglar**: `console.log` Server Action içinde kullanıldığında terminalde görünür.
- **Client-Side Loglar**: `console.log` bileşen içinde kullanıldığında tarayıcı konsolunda görünür.
- **Supabase Hataları**: Network tabını kontrol ederek Supabase isteklerinin başarısız olup olmadığını ve dönen hata mesajını inceleyebilirsiniz.

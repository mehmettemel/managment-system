# 🚀 Kurulum ve Başlangıç

Bu proje, Dans Okulu Yönetim Sistemi (DSMS) için modern bir web uygulamasıdır. Başlamadan önce aşağıdaki gereksinimleri sağlayın.

## 📋 Önkoşullar

Projeyi çalıştırmak için bilgisayarınızda şunların yüklü olması gerekir:

- **Node.js 20+** (LTS sürümü önerilir)
- **npm** (Node.js ile gelir)
- **Git**
- **Supabase Hesabı** (Veritabanı için)

> **Önemli:** Proje Node.js 20 sürümünü kullanır. `nvm` (Node Version Manager) kullanıyorsanız:
>
> ```bash
> nvm use 20
> ```
>
> komutunu çalıştırarak doğru sürüme geçin.

## 🛠️ Kurulum Adımları

### 1. Projeyi Klonlayın

```bash
git clone <proje-url>
cd managment-system
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Ortam Değişkenlerini (Environment Variables) Ayarlayın

Projenin kök dizininde `.env.local` adlı bir dosya oluşturun:

```bash
cp .env.local.example .env.local
```

`.env.local` dosyasını açın ve Supabase proje bilgilerinizi girin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> Bu bilgileri [Supabase Dashboard](https://supabase.com/dashboard) -> Project Settings -> API kısmından alabilirsiniz.

### 4. Veritabanını Hazırlayın

1. Supabase Panelinde **SQL Editor**'e gidin.
2. `docs/database-schema.sql` dosyasının içeriğini kopyalayıp yapıştırın.
3. **Run** butonuna basarak tabloları ve ilişkileri oluşturun.

### 5. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine giderek uygulamayı görüntüleyebilirsiniz.

## 🧪 Build Kontrolleri

Projenin sorunsuz çalıştığını doğrulamak için (veya production'a çıkmadan önce) build almayı deneyebilirsiniz:

```bash
npm run build
```

Eğer TypeScript veya ESLint hataları varsa bu aşamada görünecektir.

## 📚 Yardım ve Destek

Uygulama çalıştıktan sonra, kullanım senaryoları ve özellikleri öğrenmek için sol menüdeki **Yardım** butonuna (`/help`) tıklayabilirsiniz. Burada detaylı bir kullanım kılavuzu bulunmaktadır.

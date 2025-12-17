# 🛠️ Yönetici Kılavuzu (Admin Guide)

Bu belge, sistem yöneticileri ve geliştiriciler için mevcut olan gelişmiş araçları ve yapılandırma seçeneklerini açıklar.

---

## 🕒 Sistem Simülatörü (System Simulator)

**Konum:** `Admin Paneli > Simülatör` (`/admin/simulator`)

Simülatör, sistemi gelecekteki bir tarihte çalışıyormuş gibi test etmenizi sağlayan güçlü bir araçtır. Bu özellik, özellikle ödeme gecikmelerini ve otomatik faiz/ceza hesaplamalarını test etmek için kullanılır.

### Özellikler:

1. **Zaman Yolculuğu (Time Travel):**
   - "Sanal Bugün" tarihini gelecekteki bir tarihe ayarlayabilirsiniz.
   - Sistemdeki tüm fonksiyonlar (gecikme hesaplama, dashboard grafikleri vb.) bu tarihi "bugün" olarak kabul eder.
   - Örneğin: Bugün 1 Ocak ise ve simülatörü 1 Nisan'a ayarlarsanız, Ocak-Mart arası ödenmemiş tüm borçlar "Gecikmiş" olarak görünür.

2. **Dondurma Testleri (Freeze Testing):**
   - Dondurma senaryolarını test etmek için hızlı araçlar sunar.

### 1. Sistem Simülatörü

**Amaç:** Geliştirme ve test süreçleri için gerçekçi veri ve senaryolar oluşturur.

**Erişim:** `/admin/simulator`

**Özellikler:**

- **Veri Yönetimi:**
  - **Tüm Verileri Temizle:** Veritabanını tamamen sıfırlar (Admin kullanıcısı hariç).
  - **Test Verisi Yükle (Seed):** Aşağıdaki senaryoları otomatik oluşturur:
    1.  **Ahmet Standart:** Kayıtlı, ödemelerini yapmış aktif üye.
    2.  **Ayşe Yeni:** Yeni kayıt olmuş, ilk ay ödemesini yapmış üye.
    3.  **Mehmet Gecikmiş:** Ödemesi 10 gün gecikmiş aktif üye.
    4.  **Veli Çokgeç:** 3 aydır ödeme yapmamış (kritik) üye.
    5.  **Zeynep Donuk:** Üyeliği dondurulmuş (Frozen) üye.
    6.  **Can Legacy:** Özel fiyattan (eski fiyat) ödeme yapan üye.
    7.  **Burak Eski:** Arşivlenmiş (pasif) eski üye.
    8.  **Aslı Gelecek:** Gelecek tarihli dondurma testi için aktif üye.
    9.  **Osman Dönüş:** Eski üyeliğini pasife çekip yeni kayıt açan üye.
    10. **Ece Sabit:** Fiyat değişikliğinden etkilenmeyen (sabit fiyatlı) üye.
    11. **Kaan Karma:** Sadece tek bir dersi dondurulmuş karma durumlu üye.

- **Zaman Makinesi (Time Travel):** Sistem tarihini ileri/geri alarak gelecek tarihli senaryoları (örn. otomatik pasife düşme, gecikme faizi vb.) test etmenizi sağlar.

---

## 💾 Veri Yönetimi (Data Management)

**Konum:** `Admin Paneli > Simülatör > Test Verisi Yönetimi`

Geliştirme ve test süreçlerini hızlandırmak için veritabanı üzerinde toplu işlemler yapabilirsiniz.

> [!WARNING]
> Bu işlemler geri alınamaz ve **yıkıcıdır**. Production ortamında dikkatli kullanılmalıdır.

### 3. Hızlı İşlemler (Quick Actions)

Veritabanını silmeden, mevcut verilerin üzerine tekil test kayıtları eklemenizi sağlar.

- `+1 Rastgele Üye`: Sisteme sahte isim ve telefonlu yeni bir üye ekler.
- `+1 Rastgele Sınıf`: Rastgele fiyat ve eğitmene sahip yeni bir sınıf oluşturur.

---

## ⚙️ Sistem Ayarları ve Konfigürasyon

**Konum:** `Ayarlar` (`/settings`)

### 💃 Dans Türleri Yönetimi (Dance Types)

**Konum:** `Ayarlar > Dans Türleri`

Sistemdeki eğitmen komisyonlarını ve ders kategorilerini yönetmek için kullanılan dans türlerini (branşları) buradan yapılandırabilirsiniz.

- **Kullanım:** Yeni bir dans türü (Örn: "Kizomba") eklediğinizde, eğitmenlere bu branş için özel komisyon oranı tanımlayabilirsiniz.
- **Özellikler:** Ekleme, düzenleme ve silme işlemleri yapılabilir.

---

## 🚧 Geliştirme Aşamasındaki Özellikler

Aşağıdaki sayfalar şu anda menüde yer almakla birlikte **geliştirme aşamasındadır (Placeholder):**

- **Profil Sayfası (`/profile`):** Kullanıcı profil ayarları.
- **Genel Ayarlar (`/settings`):** Sistem genel ayarları (Dans Türleri hariç).

Bu sayfalara girdiğinizde "Yakında Gelecek" uyarısı ile karşılaşırsınız.

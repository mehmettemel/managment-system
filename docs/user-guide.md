# 📘 Detaylı Kullanım Kılavuzu (User Guide)

Bu kılavuz, **Dans Okulu Yönetim Sistemi (DSMS)** uygulamasını ilk kez kullanacak yöneticiler ve çalışanlar için hazırlanmıştır. Sistemin kurulumundan günlük operasyonlarına kadar her adım detaylandırılmıştır.

---

## 🏁 Başlarken

Uygulama açıldığında sizi **Dashboard (Ana Panel)** karşılar. Burası okulunuzun kokpitidir.

### Dashboard'da Neler Var?

1.  **Özet Kartları:**
    - **Toplam Ciro:** Okulun açıldığı günden beri kasaya giren toplam para.
    - **Bu Ay:** Sadece içinde bulunduğumuz ayda yapılan tahsilatlar.
    - **Aktif Üyeler:** Şu anda kaydı devam eden (bırakmamış) öğrenci sayısı.
    - **Toplam Üye:** Geçmiş ve mevcut tüm öğrenci veritabanı.

2.  **Grafikler:**
    - **Aylık Gelir:** Son 6 ayın gelir grafiği. Okulun büyüyor mu yoksa küçülüyor mu olduğunu buradan anlarsınız.
    - **Üye Dağılımı:** Aktif, dondurulmuş (tatilde/hasta) ve arşivlenmiş (bırakmış) üyelerin oranı.

---

## 👥 1. Bölüm: Üye İşlemleri

Sistemin kalbi üyelerdir. Tüm işlemler "Üyeler" menüsünden başlar.

### 1.1 Yeni Üye Kaydetme

Okulun kapısından içeri yeni biri girdi ve kayıt olmak istiyor.

1.  Soldaki menüden **"Üyeler"**e tıklayın.
2.  Sağ üstteki **"Yeni Üye"** butonuna basın.
3.  Sağ taraftan bir panel açılır:
    - **Ad & Soyad:** Girilmesi zorunludur.
    - **Telefon:** `5XX XXX XX XX` formatında girin.
    - **Not:** İsteğe bağlı (Örn: "Referansla geldi").
4.  **"Kaydet"** butonuna basın.
    - _Tebrikler! Üye sisteme eklendi ama henüz hiçbir derse kayıtlı değil._

### 1.2 Üyeyi Bir Derse Kaydetme (Enrollment)

Üyeyi oluşturduktan sonra onu bir sınıfa yerleştirmelisiniz.

1.  Üye listesinden yeni eklediğiniz kişinin ismine tıklayın veya **"Detay"** butonuna basın.
2.  Üye profilinde **"Ders Ekle"** butonunu göreceksiniz. Tıklayın.
3.  Açılan pencerede:
    - **Dersler:** Listeden bir veya birden fazla ders seçin (Örn: Salsa 101).
    - **Aylık Ücret:** Sistem dersin standart fiyatını getirir, isterseniz o kişiye özel değiştirebilirsiniz.
    - **Ödeme Aralığı:** Genelde "1 Ay" seçilir. (3 aylık paket satıyorsanız 3 seçebilirsiniz).
4.  **"Derslere Kaydet"** deyin.
    - _Artık üyenin profilinde bir "Ders Kartı" oluştu. Borç işlemeye başladı._

### 1.3 Üyeliği Dondurma (Freeze)

Öğrenci geldi ve "Hocam ben 1 ay tatile gideceğim, üyeliğim yanmasın" dedi.

1.  Üyenin profiline gidin.
2.  Sağ üstteki **"Diğer İşlemler"** menüsünden **"Dondur"** seçeneğini bulun.
3.  **Başlangıç Tarihi:** Bugün veya gelecekteki bir tarih.
4.  **Bitiş Tarihi:** Dönüş tarihi belliyse seçin, belli değilse boş bırakın (Süresiz Dondurma).
5.  **Kaydet** dediğinizde:
    - Üyenin durumu **"Donduruldu"** olur.
    - Dondurulan dönem için sistem otomatik olarak ödeme istemez.
    - Ödeme tarihleri tatil süresi kadar ileri atılır.

---

## 💰 2. Bölüm: Ödeme ve Finans

### 2.1 Ödeme Alma (Tahsilat)

Ay başı geldi, öğrenci aidatını ödemek istiyor.

1.  **Üyeler** sayfasında, ödemesi gecikenlerin yanında **Kırmızı Ünlem (!)** işareti görürsünüz.
2.  Üyenin ismine tıklayıp profiline girin.
3.  İlgili ders kartındaki (Örn: Tango) **"Ödeme Ekle"** veya üstteki genel **"Ödeme Al"** butonuna basın.
4.  Açılan ekranda:
    - Sistem ödenmemiş ayları listeler (Örn: Ocak 2024, Şubat 2024).
    - Öğrenci ne kadar ödeyecekse o ayları seçin.
    - **Yöntem:** Nakit, Kredi Kartı veya Havale seçin.
5.  **"Ödemeyi Kaydet"** deyin.
    - _Sistem makbuzu kaydeder, üyenin borcu silinir ve bir sonraki ödeme tarihi güncellenir._

### 2.2 Eğitmen Ödemeleri

Eğitmenlerinize maaş veya prim ödemesi yapacağınız zaman:

1.  Menüden **"Eğitmenler"** sayfasına gidin.
2.  Listedeki her eğitmenin karşısında **"Bekleyen Bakiye"** görürsünüz.
    - _Bu rakam, o eğitmenin dersine giren öğrencilerden aldığınız ödemelerin toplam komisyonudur (Örn: %50)._
3.  **"Ödeme Yap"** butonuna tıklayın.
4.  Tutar ve tarih bilgilerini onaylayın.
    - _Bakiye sıfırlanır ve işlem "Geçmiş Ödemeler"e kaydedilir._

---

## 🏫 3. Bölüm: Yönetim İşleri

### 3.1 Yeni Ders (Sınıf) Açma

Yeni bir sınıf açmak istiyorsunuz (Örn: Bachata Orta Seviye).

1.  Menüden **"Dersler"** sayfasına gidin.
2.  **"Yeni Ders"** butonuna basın.
3.  **Ders Adı:** (Örn: Bachata Level 2)
4.  **Eğitmen:** Dersi kimin vereceğini seçin.
5.  **Varsayılan Fiyat:** Bu dersin aylık ücreti ne kadar? (Örn: 1500 TL).
6.  **Kaydet** diyerek sınıfı oluşturun.
    - _Artık yeni üye kaydederken bu sınıfı listede görebilirsiniz._

### 3.2 Ayarlar ve Tarih Simülasyonu

Yazılımı test etmek veya geçmiş/gelecek tarihli işlemler yapmak isterseniz:

- Menüden **Admin > Simülatör** sayfasına gidin.
- Buradan sistemi sanki "3 ay sonrasındaymış" gibi çalıştırıp, kimlerin borcu gecikecek görebilirsiniz.
- **Dikkat:** Bu özellik sadece yönetim/test amaçlıdır. Günlük kullanımda "Simülasyon Kapalı" olmalıdır.

---

## ❓ Sıkça Sorulan Sorular (SSS)

**S: Bir öğrenci dersi tamamen bıraktı, ne yapmalıyım?**
C: Üye profiline gidin, ilgili dersin kartındaki üç nokta menüsünden **"Üyeliği Sonlandır"** (Terminate) seçeneğini kullanın. Bu, üyeyi tamamen silmez (veriler korunur) ama artık borç işlemez ve "Pasif" duruma geçer.

**S: Yanlışlıkla ödeme aldım, nasıl iptal ederim?**
C: **"Ödemeler"** menüsüne gidin. Son yapılan ödemeyi listede bulun ve "Sil" (Çöp Kutusu) ikonuna tıklayın. Sistem her şeyi (bakiye, tarih, eğitmen primi) otomatik geri alır.

**S: Öğrenci numarasını değiştirdi, nasıl güncellerim?**
C: Üye profilinde ismin yanındaki **"Düzenle"** (Kalem) ikonuna tıklayarak bilgileri güncelleyebilirsiniz.

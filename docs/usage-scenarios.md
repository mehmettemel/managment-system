# 🎬 Kullanım Senaryoları (Usage Scenarios)

Bu proje, bir dans okulunun veya benzeri üyelik bazlı işletmelerin günlük operasyonlarını yönetmek için tasarlanmıştır. İşte projenin kullanılabileceği temel senaryolar:

## 1. Yeni Üye Kaydı (New Member Registration)

**Senaryo:** Okulunuza yeni bir öğrenci geldi ve kayıt olmak istiyor.

1. **Hızlı Kayıt:** "Üyeler" sayfasına gidin, "Yeni Üye" butonuna tıklayıp sadece Ad, Soyad ve Telefon girerek kaydı oluşturun. Uzun formlarla uğraşmanıza gerek yok.
2. **Ders Seçimi:** Üye profilinden "Ders Ekle" diyerek öğrencinin katılacağı sınıfları (Örn: Salsa 101, Bachata Başlangıç) seçin.
3. **Fiyatlandırma:** Her ders için varsayılan fiyatı kullanabilir veya öğrenciye özel indirimli fiyat belirleyebilirsiniz (Örn: Öğrenci indirimi).

## 2. Aylık Aidat Toplama (Payment Collection)

**Senaryo:** Ay başı geldi ve öğrencilerden ödeme almanız gerekiyor.

1. **Borç Kontrolü:** Üye listesinde isminin yanında "kırmızı ünlem" olan öğrenciler, ödemesi gecikenlerdir.
2. **Ödeme Alma:** Üyenin profiline gidin, "Ödeme Al" butonuna tıklayın.
3. **Esnek Ödeme:** Öğrenci 3 aylık peşin ödemek isterse, listeden 3 ayı seçip tek seferde tahsilat yapabilirsiniz.
4. **Makbuz:** Sistem her ay için ayrı ödeme kaydı oluşturur, böylece muhasebeniz şaşmaz.

## 3. Üyelik Dondurma (Membership Freezing)

**Senaryo:** Bir öğrenci tatile gideceği veya sakatlandığı için 2 ay ara vermek istiyor.

1. **Dondurma İşlemi:** Üye profilinden "Üyeliği Dondur" seçeneğini kullanın.
2. **Tarih Seçimi:** "Başlangıç" ve "Bitiş" tarihlerini girin.
3. **Otomatik Hesaplama:** Sistem, öğrencinin ödeme takvimini otomatik olarak kaydırır. Yani dondurulan aylar için borç çıkmaz, üyelik süresi dondurulan süre kadar uzar.

## 4. Eğitmen Hakediş Yönetimi (Instructor Payroll)

**Senaryo:** Ay sonunda eğitmenlerinize maaş veya ders başı/üye başı prim ödemeniz gerekiyor.

1. **Otomatik Hesaplama:** Sistem, her öğrenci ödemesinden eğitmenin payını (örn. %40) otomatik olarak "Bekleyen Bakiye" hesabına ekler.
2. **Ödeme Yapma:** "Eğitmenler" sayfasına gidin, biriken bakiyeyi görüntüleyin ve "Ödeme Yap" diyerek eğitmeninizin hesabını sıfırlayın.

## 5. Gelir Takibi ve Raporlama (Financial Reporting)

**Senaryo:** Okulunuzun finansal durumunu görmek istiyorsunuz.

1. **Dashboard:** Ana sayfadaki grafiklerden bu ayki toplam cironuzu, aktif üye sayınızı ve en popüler derslerinizi anlık görün.
2. **Ödeme Geçmişi:** "Ödemeler" sayfasından tarih aralığı seçerek (Örn: Geçen ay) ne kadar Sınıf Geliri, ne kadar Özel Ders geliri olduğunu listeleyin.

## 6. Sınıf Yoklama ve Kapasite (Class Management)

**Senaryo:** Hangi sınıfta kaç kişi var, kimler aktif görmek istiyorsunuz.

1. **Sınıf Listesi:** "Dersler" sayfasından bir derse tıklayın (Örn: Tango 2. Seviye).
2. **Aktif Öğrenciler:** O sınıfa kayıtlı, ödemesini yapan aktif öğrencileri listeleyin. Kaydı silinmiş veya dondurulmuş öğrencileri ayırt edin.

## 7. Geçmişe Dönük Düzenleme (Admin)

**Senaryo:** Yanlış girilen bir ödemeyi veya kaydı düzeltmeniz gerekti.

1. **Esnek Düzenleme:** Yöneticiler, geçmiş tarihli ödemeleri silebilir, ödeme tarihlerini veya tutarlarını güncelleyebilir.
2. **Not Ekleme:** Her işleme (ödeme, dondurma) özel notlar ekleyerek ileride "Bu neden böyle yapılmıştı?" sorusunu cevaplayabilirsiniz.

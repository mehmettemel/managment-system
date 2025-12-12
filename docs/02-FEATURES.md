# 🚀 Özellikler Kılavuzu (Features Guide)

Bu belge, **Management System** projesinin temel özelliklerini ve nasıl çalıştıklarını detaylandırır.

## 👥 Üye Yönetimi (Membership Management)

### Kayıt Bazlı Sistem (Enrollment System)

Proje, "Genel Üyelik" yerine **"Ders Bazlı Kayıt"** (Enrollment) mantığıyla çalışır.

- Bir üye birden fazla derse kayıt olabilir.
- Her dersin kendi ödeme döngüsü, fiyatı ve durumu vardır.
- Bir üye "Salsa 101" dersinde aktifken, "Bachata" dersinde ödemesi gecikmiş olabilir.

### Üye Transferi & Sınıf Geçişleri

- **Bireysel Transfer**: Üye detay sayfasından bir üye başka bir sınıfa transfer edilebilir.
  - **Fiyat Koruma (Price Protection)**: Transfer sırasında "Eski Fiyatı Koru" seçeneği ile üyenin zammı etkilenmeden devam etmesi sağlanabilir.
- **Toplu Taşıma (Bulk Migration)**: Bir sınıf tamamen kapatılıp (arşivlenip) öğrencileri topluca yeni bir sınıfa taşınabilir.

---

## 💰 Finans & Ödemeler

### 3. Ödeme Yönetimi

- **Detaylı Takip**: Ödemelerin tarih, tutar, yöntem ve üye bazlı takibi.
- **Gelişmiş Filtreleme**: Üye, Ders ve Ödeme Yöntemine göre çoklu filtreleme imkanı.
- **Sayfalama**: Yüksek veri hacimleri için sunucu taraflı sayfalama ve sıralama.
- **Eğitmen Ödemeleri**:
  - Eğitmen hakedişlerinin hesaplanması (sabit oran veya ders bazlı).
  - Hakediş ödemelerinin kaydı ve "Ödenecekler" listesi.
  - Detaylı "Ödeme Geçmişi" tablosu (Filtrelenebilir ve Sıralanabilir).
- **Notlar**: Ödemelere dair açıklamaların tooltip ile görüntülenebilmesi.

Sistem, eğitmenlerin ne kadar kazanacağını otomatik hesaplar.

1. **Komisyon Takibi (Ledger)**:
   - Öğrenci ödeme yaptığında, eğitmenin komisyon oranı (`%`) üzerinden hakediş hesaplanır.
   - Bu hakediş `instructor_ledger` tablosuna "Bekleyen" (`pending`) olarak eklenir.
   - Ödeme vadesi geldiğinde `payable` olur.

2. **Hakediş Ödemesi (Payout)**:
   - Yönetici, "Eğitmen Ödemeleri" sayfasından biriken hakedişleri görüntüleyebilir.
   - "Ödeme Yap" butonu ile hakediş sıfırlanır ve `instructor_payouts` tablosuna bir geçmiş kaydı atılır.
   - **Ödeme Geçmişi** sekmesinden eski ödemeler takip edilebilir.

---

## 📊 Dashboard & Raporlar

- **Gelir Grafiği**: Aylık tahsilat trendleri.
- **Üye Dağılımı**: Aktif, pasif, dondurulmuş üye oranları.
- **Son Aktiviteler**: Son kayıtlar ve ödemeler.
- **KPI Kartları**: Toplam gelir, aktif üye sayısı vb.

---

## 🏫 Ders Yönetimi

- **Aktif/Arşiv**: Dersler silinmek yerine arşivlenebilir. Arşivlenen dersler listelerde gözükmez ancak veri bütünlüğü korunur.
- **Eğitmen Atama**: Her dersin bir sorumlu eğitmeni vardır (Hakediş buna göre hesaplanır).
- **Dans Türleri**: Dans türüne göre (Salsa, Tango) farklı komisyon oranları tanımlanabilir.

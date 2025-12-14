'use client';

import {
  Accordion,
  Alert,
  Box,
  Card,
  Container,
  Group,
  List,
  SimpleGrid,
  Text,
  ThemeIcon,
  Title,
  Divider,
} from '@mantine/core';
import {
  IconInfoCircle,
  IconUserPlus,
  IconCreditCard,
  IconSchool,
  IconSnowflake,
  IconHelp,
  IconBook,
  IconChartBar,
} from '@tabler/icons-react';

export default function HelpPage() {
  return (
    <Container size="xl" py="lg">
      <Group mb="xl">
        <ThemeIcon
          size={40}
          radius="md"
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan' }}
        >
          <IconHelp size={24} />
        </ThemeIcon>
        <div>
          <Title order={2}>Kullanım Kılavuzu</Title>
          <Text c="dimmed">
            Dans Okulu Yönetim Sistemi (DSMS) için detaylı rehber
          </Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb={40}>
        <Card withBorder padding="lg" radius="md">
          <ThemeIcon size="lg" radius="md" variant="light" color="blue" mb="md">
            <IconUserPlus size={20} />
          </ThemeIcon>
          <Text fw={700} size="lg" mb="xs">
            Hızlı Başlangıç
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            Yeni öğrenci kaydı, sınıf oluşturma ve temel ayarlar.
          </Text>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <ThemeIcon
            size="lg"
            radius="md"
            variant="light"
            color="green"
            mb="md"
          >
            <IconCreditCard size={20} />
          </ThemeIcon>
          <Text fw={700} size="lg" mb="xs">
            Ödeme & Finans
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            Aidat tahsilatı, eğitmen ödemeleri ve gelir takibi.
          </Text>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <ThemeIcon
            size="lg"
            radius="md"
            variant="light"
            color="orange"
            mb="md"
          >
            <IconSnowflake size={20} />
          </ThemeIcon>
          <Text fw={700} size="lg" mb="xs">
            Dondurma İşlemleri
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            Üyelik dondurma, iptal ve değişiklik işlemleri.
          </Text>
        </Card>
      </SimpleGrid>

      <Title order={3} mb="md">
        Adım Adım İşlemler
      </Title>

      <Accordion variant="separated" radius="md" chevronPosition="left">
        {/* Dashboard Section */}
        <Accordion.Item value="dashboard">
          <Accordion.Control
            icon={
              <IconChartBar size={20} color="var(--mantine-color-blue-6)" />
            }
          >
            <Text fw={600}>Dashboard ve Raporlama (Senaryo 5)</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text mb="sm">
              Dashboard, okulunuzun finansal kokpitidir. Buradan anlık
              durumunuzu takip edebilirsiniz:
            </Text>
            <List spacing="xs" size="sm" mb="md">
              <List.Item>
                <b>Toplam Ciro:</b> Okulun açılışından itibaren kasaya giren
                toplam para.
              </List.Item>
              <List.Item>
                <b>Bu Ay:</b> Sadece içinde bulunulan aydaki tahsilatlar. Okulun
                büyüme trendini buradan izleyebilirsiniz.
              </List.Item>
              <List.Item>
                <b>Aktif Üyeler:</b> Şu an kaydı devam eden (bırakmamış) öğrenci
                sayısı.
              </List.Item>
              <List.Item>
                <b>Gelir Grafiği:</b> Son 6 ayın performans karşılaştırması.
              </List.Item>
            </List>
            <Alert variant="light" color="blue" title="Raporlama İpucu">
              Detaylı gelir raporu için <b>Ödemeler</b> sayfasına gidip tarih
              filtresi kullanabilir, Sınıf Geliri ve Özel Ders geliri dağılımını
              görebilirsiniz.
            </Alert>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Member Operations */}
        <Accordion.Item value="members">
          <Accordion.Control
            icon={
              <IconUserPlus size={20} color="var(--mantine-color-teal-6)" />
            }
          >
            <Text fw={600}>Üye Kaydı ve Ders Atama (Senaryo 1)</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text fw={700} mb="xs">
              1. Hızlı Kayıt
            </Text>
            <List type="ordered" spacing="xs" size="sm" mb="lg">
              <List.Item>
                Soldaki menüden <b>Üyeler</b> sayfasına gidin.
              </List.Item>
              <List.Item>
                Sağ üstteki <b>Yeni Üye</b> butonuna tıklayın.
              </List.Item>
              <List.Item>
                Sadece <b>Ad, Soyad ve Telefon</b> girerek kaydı oluşturun. Uzun
                formlarla vakit kaybetmeyin.
              </List.Item>
            </List>

            <Divider my="sm" />

            <Text fw={700} mb="xs">
              2. Derse Kaydetme (Enrollment)
            </Text>
            <Text size="sm" mb="xs">
              Üyeyi oluşturmak yetmez, onu bir sınıfa eklemelisiniz:
            </Text>
            <List type="ordered" spacing="xs" size="sm">
              <List.Item>
                Üye detay sayfasında <b>Ders Ekle</b> butonuna tıklayın.
              </List.Item>
              <List.Item>
                Listeden bir veya birden fazla ders seçin (Örn: Salsa 101,
                Bachata).
              </List.Item>
              <List.Item>
                <b>Fiyatlandırma:</b> Sistem dersin varsayılan fiyatını getirir.
                Öğrenciye özel indirim yapacaksanız fiyatı buradan
                değiştirebilirsiniz.
              </List.Item>
              <List.Item>
                <b>Kayıt:</b> Kaydet dediğinizde üyenin borç takvimi işlemeye
                başlar.
              </List.Item>
            </List>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Payments */}
        <Accordion.Item value="payments">
          <Accordion.Control
            icon={
              <IconCreditCard size={20} color="var(--mantine-color-green-6)" />
            }
          >
            <Text fw={600}>
              Ödeme Alma ve Eğitmen Hakedişleri (Senaryo 2 & 4)
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text fw={700} mb="xs">
              Öğrenciden Ödeme Alma:
            </Text>
            <List spacing="xs" size="sm" mb="md">
              <List.Item>
                <b>Borç Takibi:</b> Üye listesinde isminin yanında kırmızı ünlem
                (!) olanlar ödemesi gecikenlerdir.
              </List.Item>
              <List.Item>
                <b>Tahsilat:</b> Üye profilinde <b>Ödeme Al</b> butonuna basın.
                Sistem ödenmemiş ayları listeler.
              </List.Item>
              <List.Item>
                <b>Esnek Ödeme:</b> Öğrenci 3 aylık peşin ödemek isterse,
                listeden ilgili ayları seçip tek işlemde tahsilat
                yapabilirsiniz.
              </List.Item>
            </List>

            <Divider my="sm" />

            <Text fw={700} mb="xs">
              Eğitmen Ödemeleri:
            </Text>
            <Text size="sm" mb="xs">
              Sistem eğitmen maaş/prim hesabını otomatik tutar.
            </Text>
            <List spacing="xs" size="sm">
              <List.Item>
                Her öğrenci ödemesinden eğitmenin payı (Örn: %40) otomatik
                olarak eğitmen bakiyesine eklenir.
              </List.Item>
              <List.Item>
                <b>Eğitmenler</b> sayfasında biriken bakiyeyi görebilirsiniz.
              </List.Item>
              <List.Item>
                Ödeme yaptığınızda <b>Ödeme Yap</b> butonunu kullanarak bakiyeyi
                sıfırlayın.
              </List.Item>
            </List>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Freeze */}
        <Accordion.Item value="freeze">
          <Accordion.Control
            icon={
              <IconSnowflake size={20} color="var(--mantine-color-cyan-6)" />
            }
          >
            <Text fw={600}>Üyelik Dondurma (Senaryo 3)</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" mb="md">
              Bir öğrenci tatile gideceği veya sakatlandığı için ara vermek
              isteyebilir. Üyeliği silmek yerine <b>Dondurun</b>.
            </Text>
            <List type="ordered" spacing="xs" size="sm">
              <List.Item>
                Üye profilinde sağ üstteki menüden <b>Dondur</b> seçeneğini
                kullanın.
              </List.Item>
              <List.Item>
                <b>Başlangıç Tarihi:</b> Dondurmanın başlayacağı gün.
              </List.Item>
              <List.Item>
                <b>Bitiş Tarihi:</b> Dönüş tarihi belliyse girin, belli değilse
                boş bırakın (Süresiz Dondurma).
              </List.Item>
              <List.Item>
                <b>Otomatik Hesaplama:</b> Sistem ödeme takvimini otomatik
                kaydırır. Dondurulan süre için borç çıkmaz, üyelik süresi uzar.
              </List.Item>
            </List>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Class Management */}
        <Accordion.Item value="classes">
          <Accordion.Control
            icon={
              <IconSchool size={20} color="var(--mantine-color-orange-6)" />
            }
          >
            <Text fw={600}>Sınıf Yönetimi ve Yoklama (Senaryo 6)</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" mb="md">
              Hangi sınıfta kaç kişi var, kimler aktif görmek istiyorsunuz:
            </Text>
            <List spacing="xs" size="sm">
              <List.Item>
                <b>Yeni Sınıf:</b> <b>Dersler</b> sayfasından yeni bir sınıf
                (Örn: Tango 2. Seviye) oluşturun, eğitmenini ve fiyatını
                belirleyin.
              </List.Item>
              <List.Item>
                <b>Sınıf Listesi:</b> Dersler sayfasında bir derse
                tıkladığınızda o sınıfa kayıtlı tüm öğrencileri görürsünüz.
              </List.Item>
              <List.Item>
                <b>Aktif/Pasif:</b> Listede kimlerin aktif ödeme yapan öğrenci,
                kimlerin dondurulmuş veya bırakmış olduğunu ayırt edebilirsiniz.
              </List.Item>
            </List>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Admin Operations */}
        <Accordion.Item value="admin">
          <Accordion.Control
            icon={<IconBook size={20} color="var(--mantine-color-grape-6)" />}
          >
            <Text fw={600}>Yönetici İşlemleri ve Simülasyon (Senaryo 7)</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text fw={700} mb="xs">
              Geçmişe Dönük Düzenleme
            </Text>
            <Text size="sm" mb="md">
              Yanlış girilen bir ödemeyi veya kaydı düzeltebilirsiniz.
              Yöneticiler geçmiş tarihli ödemeleri silebilir veya tutarlarını
              güncelleyebilir.
            </Text>

            <Divider my="sm" />

            <Text fw={700} mb="xs">
              Zaman Simülatörü (Test Amaçlı)
            </Text>
            <Text size="sm" mb="xs">
              Gelecek senaryolarını test etmek için <b>Admin &gt; Simülatör</b>
              sayfasını kullanın.
            </Text>
            <List spacing="xs" size="sm">
              <List.Item>
                Sistemi sanki "3 ay sonrasındaymış" gibi çalıştırıp, kimlerin
                borcunun gecikeceğini görebilirsiniz.
              </List.Item>
              <List.Item>
                <b>Uyarı:</b> Bu özellik sadece test amaçlıdır. Günlük
                kullanımda simülasyon kapalı olmalıdır.
              </List.Item>
            </List>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Card mt={40} p="xl" radius="md" withBorder>
        <Title order={4} mb="md">
          Sıkça Sorulan Sorular
        </Title>
        <Group align="flex-start" mb="md">
          <ThemeIcon variant="light" color="gray">
            <IconBook size={16} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="sm">
              Yanlışlıkla ödeme aldım, nasıl düzeltirim?
            </Text>
            <Text size="sm" c="dimmed">
              Ödemeler sayfasına gidin, ilgili ödemeyi bulup Sil (Çöp Kutusu)
              butonuna basın. Her şey otomatik geri alınır.
            </Text>
          </div>
        </Group>
        <Group align="flex-start">
          <ThemeIcon variant="light" color="gray">
            <IconBook size={16} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="sm">
              Öğrenci tamamen bıraktı, ne yapmalıyım?
            </Text>
            <Text size="sm" c="dimmed">
              Üye profilinde ders kartındaki menüden "Üyeliği Sonlandır"
              seçeneğini kullanın. Bu işlem üyeyi pasife alır ama verilerini
              silmez.
            </Text>
          </div>
        </Group>
      </Card>
    </Container>
  );
}

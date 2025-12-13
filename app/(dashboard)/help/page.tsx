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
            <Text fw={600}>Dashboard (Ana Panel) Nedir?</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text mb="sm">
              Dashboard, uygulamanın ana kontrol merkezidir. Burada şunları
              görebilirsiniz:
            </Text>
            <List spacing="xs" size="sm" mb="md">
              <List.Item>
                <b>Toplam Ciro:</b> Okulun açılışından itibaren toplam gelir.
              </List.Item>
              <List.Item>
                <b>Bu Ay:</b> İçinde bulunulan aydaki toplam tahsilat.
              </List.Item>
              <List.Item>
                <b>Aktif Üyeler:</b> Şu an kaydı devam eden öğrenci sayısı.
              </List.Item>
              <List.Item>
                <b>Gelir Grafiği:</b> Son 6 ayın performans karşılaştırması.
              </List.Item>
            </List>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Member Operations */}
        <Accordion.Item value="members">
          <Accordion.Control
            icon={
              <IconUserPlus size={20} color="var(--mantine-color-teal-6)" />
            }
          >
            <Text fw={600}>Üye İşlemleri (Kayıt, Ders Ekleme)</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text fw={700} mb="xs">
              1. Yeni Üye Kaydetme
            </Text>
            <List type="ordered" spacing="xs" size="sm" mb="lg">
              <List.Item>
                Soldaki menüden <b>Üyeler</b> sayfasına gidin.
              </List.Item>
              <List.Item>
                Sağ üstteki <b>Yeni Üye</b> butonuna tıklayın.
              </List.Item>
              <List.Item>
                Ad, Soyad ve Telefon girerek <b>Kaydet</b>'e basın.
              </List.Item>
            </List>

            <Divider my="sm" />

            <Text fw={700} mb="xs">
              2. Derse Kaydetme (Enrollment)
            </Text>
            <Text size="sm" mb="xs">
              Üyeyi oluşturduktan sonra bir sınıfa eklemelisiniz:
            </Text>
            <List type="ordered" spacing="xs" size="sm">
              <List.Item>
                Üye detay sayfasında <b>Ders Ekle</b> butonuna tıklayın.
              </List.Item>
              <List.Item>Listeden dersi seçin (Örn: Salsa 101).</List.Item>
              <List.Item>
                Gerekirse fiyatı düzenleyin ve <b>Kaydet</b> deyin.
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
            <Text fw={600}>Ödeme Alma ve Takip</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Alert
              variant="light"
              color="blue"
              title="İpucu"
              icon={<IconInfoCircle />}
              mb="md"
            >
              Ödemesi geciken öğrencilerin yanında kırmızı ünlem (!) işareti
              görünür.
            </Alert>

            <Text fw={700} mb="xs">
              Ödeme Alma Adımları:
            </Text>
            <List type="ordered" spacing="xs" size="sm">
              <List.Item>Üyenin profiline gidin.</List.Item>
              <List.Item>
                Ders kartındaki veya üst menüdeki <b>Ödeme Al</b> butonuna
                tıklayın.
              </List.Item>
              <List.Item>
                Sistem ödenmemiş ayları listeler. Ödenecek ayları seçin.
              </List.Item>
              <List.Item>
                Ödeme yöntemini (Nakit/Kart) seçip <b>Kaydet</b>'e basın.
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
            <Text fw={600}>Üyelik Dondurma (Freeze)</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" mb="md">
              Öğrenciler tatile gittiğinde veya ara vermek istediğinde,
              üyeliklerini silmek yerine dondurabilirsiniz. Bu sayede ödeme
              takvimi otomatik olarak kayar ve üye hak kaybına uğramaz.
            </Text>
            <List type="ordered" spacing="xs" size="sm">
              <List.Item>
                Üye profilinde sağ üstteki menüden <b>Dondur</b>'u seçin.
              </List.Item>
              <List.Item>Başlangıç tarihini seçin.</List.Item>
              <List.Item>
                Bitiş tarihi belliyse girin, değilse boş bırakın (Süresiz
                Dondurma).
              </List.Item>
            </List>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Instructors */}
        <Accordion.Item value="instructors">
          <Accordion.Control
            icon={
              <IconSchool size={20} color="var(--mantine-color-orange-6)" />
            }
          >
            <Text fw={600}>Eğitmen ve Sınıf Yönetimi</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text fw={700} mb="xs">
              Yeni Sınıf Açma:
            </Text>
            <List spacing="xs" size="sm" mb="lg">
              <List.Item>
                <b>Dersler</b> sayfasına gidin ve <b>Yeni Ders</b> deyin.
              </List.Item>
              <List.Item>Ders adı ve varsayılan ücreti belirleyin.</List.Item>
              <List.Item>Dersi verecek eğitmeni seçin.</List.Item>
            </List>

            <Divider my="sm" />

            <Text fw={700} mb="xs">
              Eğitmen Ödemeleri:
            </Text>
            <Text size="sm">
              Sistem, öğrencilerden alınan ödemelerden eğitmen payını (komisyon)
              otomatik hesaplar.
              <b>Eğitmenler</b> sayfasında biriken bakiyeyi görebilir ve{' '}
              <b>Ödeme Yap</b> butonu ile ödemeyi sıfırlayabilirsiniz.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Box
        mt={40}
        p="xl"
        className="bg-gray-100 dark:bg-zinc-800/50"
        style={{ borderRadius: 8 }}
      >
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
      </Box>
    </Container>
  );
}

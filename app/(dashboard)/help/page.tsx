'use client';

import {
  Accordion,
  Alert,
  Badge,
  Box,
  Card,
  Container,
  Divider,
  Group,
  List,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconBook,
  IconCalendar,
  IconChartBar,
  IconChalkboard,
  IconCreditCard,
  IconHelp,
  IconInfoCircle,
  IconSchool,
  IconSearch,
  IconSnowflake,
  IconTrash,
  IconUserPlus,
  IconUsers,
  IconSettings,
  IconCash,
  IconReceipt,
} from '@tabler/icons-react';

export default function HelpPage() {
  return (
    <Container size="xl" py="lg">
      {/* Header */}
      <Group mb="xl">
        <ThemeIcon
          size={50}
          radius="md"
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan' }}
        >
          <IconHelp size={28} />
        </ThemeIcon>
        <div>
          <Title order={1}>Kullanım Kılavuzu</Title>
          <Text c="dimmed" size="lg">
            Dans Okulu Yönetim Sistemi - Detaylı Kullanım Rehberi
          </Text>
        </div>
      </Group>

      <Alert
        icon={<IconInfoCircle />}
        title="Hoş Geldiniz!"
        color="blue"
        mb="xl"
      >
        Bu kılavuz, sistemdeki tüm özellikleri ve kullanım şekillerini
        adım adım anlatmaktadır. Sıfırdan başlayan biri için her şey
        açıklanmıştır. Herhangi bir konuda detaylı bilgi için ilgili bölümü
        açabilirsiniz.
      </Alert>

      {/* Quick Start Cards */}
      <Title order={2} mb="md">
        Hızlı Erişim
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb={40}>
        <Card withBorder padding="lg" radius="md" style={{ cursor: 'pointer' }}>
          <ThemeIcon size="xl" radius="md" variant="light" color="blue" mb="md">
            <IconUsers size={24} />
          </ThemeIcon>
          <Text fw={700} size="md" mb="xs">
            Üye Yönetimi
          </Text>
          <Text size="xs" c="dimmed">
            Üye ekleme, düzenleme ve ders kayıt işlemleri
          </Text>
        </Card>

        <Card withBorder padding="lg" radius="md" style={{ cursor: 'pointer' }}>
          <ThemeIcon size="xl" radius="md" variant="light" color="green" mb="md">
            <IconCreditCard size={24} />
          </ThemeIcon>
          <Text fw={700} size="md" mb="xs">
            Ödeme İşlemleri
          </Text>
          <Text size="xs" c="dimmed">
            Aidat tahsilatı ve ödeme takibi
          </Text>
        </Card>

        <Card withBorder padding="lg" radius="md" style={{ cursor: 'pointer' }}>
          <ThemeIcon size="xl" radius="md" variant="light" color="cyan" mb="md">
            <IconSnowflake size={24} />
          </ThemeIcon>
          <Text fw={700} size="md" mb="xs">
            Dondurma
          </Text>
          <Text size="xs" c="dimmed">
            Üyelik dondurma ve devam ettirme
          </Text>
        </Card>

        <Card withBorder padding="lg" radius="md" style={{ cursor: 'pointer' }}>
          <ThemeIcon size="xl" radius="md" variant="light" color="orange" mb="md">
            <IconChalkboard size={24} />
          </ThemeIcon>
          <Text fw={700} size="md" mb="xs">
            Eğitmen Ödemeleri
          </Text>
          <Text size="xs" c="dimmed">
            Komisyon hesaplama ve hakediş ödemesi
          </Text>
        </Card>
      </SimpleGrid>

      {/* Main Content */}
      <Title order={2} mb="md">
        Detaylı Kullanım Kılavuzu
      </Title>

      <Accordion
        variant="separated"
        radius="md"
        defaultValue="dashboard"
        chevronPosition="left"
      >
        {/* DASHBOARD */}
        <Accordion.Item value="dashboard">
          <Accordion.Control
            icon={<IconChartBar size={20} color="var(--mantine-color-blue-6)" />}
          >
            <Group>
              <Text fw={600} size="md">
                Dashboard (Ana Sayfa)
              </Text>
              <Badge size="sm" variant="light">
                Başlangıç
              </Badge>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <Text>
                Dashboard, sistemin ana sayfasıdır ve okulunuzun genel durumunu
                görmenizi sağlar. Giriş yaptığınızda ilk gördüğünüz sayfa
                budur.
              </Text>

              <Divider label="Dashboard'da Neler Var?" />

              <Box>
                <Text fw={600} mb="xs">
                  1. İstatistik Kartları
                </Text>
                <List size="sm" spacing="xs">
                  <List.Item>
                    <b>Toplam Gelir:</b> Okulun açılışından bu yana kasaya giren
                    toplam para miktarı
                  </List.Item>
                  <List.Item>
                    <b>Aylık Gelir:</b> Bu ay içinde tahsil edilen toplam tutar
                  </List.Item>
                  <List.Item>
                    <b>Aktif Üyeler:</b> Şu anda kaydı devam eden toplam üye
                    sayısı
                  </List.Item>
                  <List.Item>
                    <b>Toplam Üyeler:</b> Sistemde kayıtlı tüm üyeler (aktif +
                    dondurulmuş)
                  </List.Item>
                </List>
              </Box>

              <Box>
                <Text fw={600} mb="xs">
                  2. Grafikler ve Analizler
                </Text>
                <List size="sm" spacing="xs">
                  <List.Item>
                    <b>Gelir Analizi:</b> Son 6 aylık gelir-gider karşılaştırması
                  </List.Item>
                  <List.Item>
                    <b>Ders Dağılımı:</b> Her derste kaç aktif üye olduğunu
                    gösterir
                  </List.Item>
                  <List.Item>
                    <b>Ödeme Durumu:</b> Aktif üyelerin ödeme durumlarının dağılımı
                  </List.Item>
                </List>
              </Box>

              <Alert icon={<IconInfoCircle />} color="blue" variant="light">
                Dashboard sadece görüntüleme içindir. İşlem yapmak için sol
                menüdeki ilgili sayfalara gitmeniz gerekir.
              </Alert>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* ÜYE YÖNETİMİ */}
        <Accordion.Item value="members">
          <Accordion.Control
            icon={<IconUsers size={20} color="var(--mantine-color-teal-6)" />}
          >
            <Group>
              <Text fw={600} size="md">
                Üye Yönetimi
              </Text>
              <Badge size="sm" variant="light" color="teal">
                Temel
              </Badge>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="lg">
              {/* Üye Ekleme */}
              <Box>
                <Group mb="xs">
                  <IconUserPlus size={18} />
                  <Text fw={700}>Yeni Üye Ekleme</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Yeni bir öğrenci kaydetmek için:
                </Text>
                <List type="ordered" size="sm" spacing="xs">
                  <List.Item>
                    Sol menüden <b>Üyeler</b> sayfasına gidin
                  </List.Item>
                  <List.Item>
                    Sağ üstteki <b>"Yeni Üye"</b> butonuna tıklayın
                  </List.Item>
                  <List.Item>
                    Açılan formda <b>sadece</b> şu bilgileri girin:
                    <List withPadding size="sm" mt="xs">
                      <List.Item>Ad</List.Item>
                      <List.Item>Soyad</List.Item>
                      <List.Item>Telefon Numarası</List.Item>
                    </List>
                  </List.Item>
                  <List.Item>
                    <b>"Kaydet"</b> butonuna basın
                  </List.Item>
                </List>
                <Alert
                  icon={<IconInfoCircle />}
                  color="blue"
                  variant="light"
                  mt="sm"
                >
                  Üye kaydı bu kadar basittir! Ders ataması ayrı bir işlemdir ve
                  üye detay sayfasından yapılır.
                </Alert>
              </Box>

              <Divider />

              {/* Ders Kayıt İşlemi */}
              <Box>
                <Group mb="xs">
                  <IconSchool size={18} />
                  <Text fw={700}>Üyeye Ders Ekleme (Enrollment)</Text>
                </Group>
                <Text size="sm" mb="xs" c="dimmed">
                  Bir üyeyi oluşturmak yetmez, onu bir veya birden fazla derse
                  kaydetmeniz gerekir.
                </Text>
                <List type="ordered" size="sm" spacing="xs">
                  <List.Item>
                    Üyeler listesinden bir üyenin <b>adına tıklayın</b> (detay
                    sayfasına gider)
                  </List.Item>
                  <List.Item>
                    Detay sayfasında <b>"Ders Ekle"</b> butonuna basın
                  </List.Item>
                  <List.Item>
                    Açılan pencerede kaydetmek istediğiniz dersleri seçin (birden
                    fazla seçebilirsiniz)
                  </List.Item>
                  <List.Item>
                    Her ders için:
                    <List withPadding size="sm" mt="xs">
                      <List.Item>
                        <b>Aylık Ücret:</b> Sistem dersin varsayılan fiyatını
                        getirir. İsterseniz değiştirebilirsiniz (özel fiyat)
                      </List.Item>
                      <List.Item>
                        <b>Süre:</b> Kaç aylık taahhütle kayıt yapılacağını seçin
                        (1, 3, 6, 12 ay)
                      </List.Item>
                    </List>
                  </List.Item>
                  <List.Item>
                    <b>"Derslere Kaydet"</b> butonuna basın
                  </List.Item>
                </List>
                <Alert
                  icon={<IconAlertCircle />}
                  color="orange"
                  variant="light"
                  mt="sm"
                >
                  <b>Önemli:</b> Ders kaydı yapıldığı andan itibaren ödeme takvimi
                  otomatik oluşur ve üyenin borcu işlemeye başlar!
                </Alert>
              </Box>

              <Divider />

              {/* Üye Arama */}
              <Box>
                <Group mb="xs">
                  <IconSearch size={18} />
                  <Text fw={700}>Üye Arama ve Filtreleme</Text>
                </Group>
                <List size="sm" spacing="xs">
                  <List.Item>
                    <b>Arama Çubuğu (Header):</b> En üstte sağdaki büyüteç ikonuna
                    tıklayarak üye adı veya telefon ile arama yapabilirsiniz
                  </List.Item>
                  <List.Item>
                    <b>Tab'lar:</b> Üyeler sayfasında filtreleme yapabilirsiniz:
                    <List withPadding size="sm" mt="xs">
                      <List.Item>
                        <b>Aktif:</b> Kaydı devam eden üyeler
                      </List.Item>
                      <List.Item>
                        <b>Dondurulmuş:</b> Tüm dersleri dondurulmuş üyeler
                      </List.Item>
                      <List.Item>
                        <b>Arşiv:</b> Sistemden silinen/arşivlenen üyeler
                      </List.Item>
                      <List.Item>
                        <b>Tümü:</b> Hepsi bir arada
                      </List.Item>
                    </List>
                  </List.Item>
                  <List.Item>
                    <b>Sıralama:</b> Kolon başlıklarına tıklayarak alfabetik veya
                    tarihe göre sıralama yapabilirsiniz
                  </List.Item>
                </List>
              </Box>

              <Divider />

              {/* Üye Düzenleme */}
              <Box>
                <Group mb="xs">
                  <IconSettings size={18} />
                  <Text fw={700}>Üye Bilgilerini Düzenleme</Text>
                </Group>
                <List size="sm" spacing="xs">
                  <List.Item>
                    Üye satırındaki <b>üç nokta (...) menüsüne</b> tıklayın
                  </List.Item>
                  <List.Item>
                    <b>"Düzenle"</b> seçeneğini seçin
                  </List.Item>
                  <List.Item>
                    Ad, soyad veya telefon bilgilerini güncelleyebilirsiniz
                  </List.Item>
                </List>
              </Box>

              <Divider />

              {/* Gecikmiş Ödemeler */}
              <Box>
                <Group mb="xs">
                  <IconAlertCircle size={18} color="red" />
                  <Text fw={700}>Gecikmiş Ödeme Göstergeleri</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Sistemde ödemesi gecikmiş üyeler otomatik olarak işaretlenir:
                </Text>
                <List size="sm" spacing="xs">
                  <List.Item>
                    <b>Kırmızı Ünlem (!):</b> Üye listesinde ismin yanında görünür
                  </List.Item>
                  <List.Item>
                    <b>Detay Sayfası:</b> Üye detayında kırmızı uyarı kartı gösterir
                  </List.Item>
                  <List.Item>
                    <b>Ders Kartları:</b> Her gecikmiş ders için "X Ay Gecikmiş"
                    badge'i görünür
                  </List.Item>
                </List>
              </Box>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* ÖDEME İŞLEMLERİ */}
        <Accordion.Item value="payments">
          <Accordion.Control
            icon={
              <IconCreditCard size={20} color="var(--mantine-color-green-6)" />
            }
          >
            <Group>
              <Text fw={600} size="md">
                Ödeme İşlemleri
              </Text>
              <Badge size="sm" variant="light" color="green">
                Önemli
              </Badge>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="lg">
              {/* Ödeme Alma */}
              <Box>
                <Group mb="xs">
                  <IconCash size={18} />
                  <Text fw={700}>Üyeden Ödeme Alma</Text>
                </Group>
                <List type="ordered" size="sm" spacing="xs">
                  <List.Item>
                    Üye detay sayfasına gidin (üye adına tıklayın)
                  </List.Item>
                  <List.Item>
                    İlgili ders kartında <b>"Ödeme Ekle"</b> butonuna basın
                  </List.Item>
                  <List.Item>
                    Açılan pencerede:
                    <List withPadding size="sm" mt="xs">
                      <List.Item>
                        <b>Ödeme Türü:</b> "Aylık Aidat" veya "Özel Ödeme" seçin
                      </List.Item>
                      <List.Item>
                        <b>Dönemler:</b> Hangi ayları ödeyeceğini seçin (Sistem
                        ödenmemiş ayları listeler)
                      </List.Item>
                      <List.Item>
                        <b>Ödeme Yöntemi:</b> Nakit, Kredi Kartı veya Havale/EFT
                      </List.Item>
                      <List.Item>
                        <b>Açıklama:</b> İsteğe bağlı not ekleyebilirsiniz
                      </List.Item>
                    </List>
                  </List.Item>
                  <List.Item>
                    <b>"Ödeme Al"</b> butonuna basın
                  </List.Item>
                </List>
                <Alert icon={<IconInfoCircle />} color="blue" variant="light" mt="sm">
                  <b>Çoklu Ay Ödemesi:</b> Üye 3 ay peşin ödemek isterse, listeden
                  3 ayı seçip tek işlemde tahsil edebilirsiniz!
                </Alert>
              </Box>

              <Divider />

              {/* Ödeme Takvimi */}
              <Box>
                <Group mb="xs">
                  <IconCalendar size={18} />
                  <Text fw={700}>Ödeme Takvimi Nasıl Çalışır?</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Her ders kaydı için otomatik ödeme takvimi oluşturulur:
                </Text>
                <List size="sm" spacing="xs">
                  <List.Item>
                    <b>Başlangıç:</b> Üyenin derse kayıt olduğu tarih
                  </List.Item>
                  <List.Item>
                    <b>Aylık Dönemler:</b> Her ay için bir ödeme dönemi oluşur
                  </List.Item>
                  <List.Item>
                    <b>Sonraki Ödeme:</b> Bir ödeme alındığında, bir sonraki ay
                    otomatik "Sonraki Ödeme" olur
                  </List.Item>
                  <List.Item>
                    <b>Gecikme:</b> Tarih geçince "Gecikmiş" olarak işaretlenir
                  </List.Item>
                  <List.Item>
                    <b>Dondurma:</b> Üye dondurulursa, dondurma süresindeki aylar
                    atlanır
                  </List.Item>
                </List>
              </Box>

              <Divider />

              {/* Ödeme Geçmişi */}
              <Box>
                <Group mb="xs">
                  <IconReceipt size={18} />
                  <Text fw={700}>Ödeme Geçmişini Görüntüleme</Text>
                </Group>
                <Text size="sm" mb="xs">
                  İki farklı yerden ödeme geçmişine bakabilirsiniz:
                </Text>
                <List size="sm" spacing="xs">
                  <List.Item>
                    <b>Üye Bazında:</b> Üye detay sayfasında "Ödeme Geçmişi"
                    sekmesinde o üyenin tüm ödemeleri
                  </List.Item>
                  <List.Item>
                    <b>Genel Liste:</b> Sol menüden <b>Finans &gt; Gelirler</b>
                    sekmesinde tüm ödemeler
                  </List.Item>
                </List>
              </Box>

              <Divider />

              {/* Ödeme Silme */}
              <Box>
                <Group mb="xs">
                  <IconTrash size={18} />
                  <Text fw={700}>Yanlış Ödemeyi Geri Alma</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Yanlışlıkla ödeme aldıysanız:
                </Text>
                <List type="ordered" size="sm" spacing="xs">
                  <List.Item>
                    <b>Finans &gt; Gelirler</b> sayfasına gidin
                  </List.Item>
                  <List.Item>İlgili ödemeyi bulun (filtre kullanabilirsiniz)</List.Item>
                  <List.Item>
                    Satırın sağındaki <b>Çöp Kutusu</b> ikonuna tıklayın
                  </List.Item>
                  <List.Item>Onay verin</List.Item>
                </List>
                <Alert
                  icon={<IconAlertCircle />}
                  color="orange"
                  variant="light"
                  mt="sm"
                >
                  Ödeme silindiğinde, eğitmen komisyonu da otomatik geri alınır ve
                  üyenin ödeme takvimi güncellenir!
                </Alert>
              </Box>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* DONDURMA İŞLEMLERİ */}
        <Accordion.Item value="freeze">
          <Accordion.Control
            icon={<IconSnowflake size={20} color="var(--mantine-color-cyan-6)" />}
          >
            <Group>
              <Text fw={600} size="md">
                Üyelik Dondurma
              </Text>
              <Badge size="sm" variant="light" color="cyan">
                Özel
              </Badge>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="lg">
              <Text>
                Dondurma, bir üyenin geçici olarak ara vermesi durumunda kullanılır.
                Tatil, hastalık veya kişisel nedenlerle üye derslere gelemiyor
                olabilir. Bu durumda üyeliği silmek yerine <b>dondurma</b>{' '}
                yaparsınız.
              </Text>

              <Box>
                <Group mb="xs">
                  <IconSnowflake size={18} />
                  <Text fw={700}>Üye Dondurma İşlemi</Text>
                </Group>
                <List type="ordered" size="sm" spacing="xs">
                  <List.Item>
                    Üye detay sayfasına gidin
                  </List.Item>
                  <List.Item>
                    Sağ üstteki <b>üç nokta (...)</b> menüsüne tıklayın
                  </List.Item>
                  <List.Item>
                    <b>"Dondur"</b> seçeneğini seçin
                  </List.Item>
                  <List.Item>
                    Açılan pencerede:
                    <List withPadding size="sm" mt="xs">
                      <List.Item>
                        <b>Hangi Dersleri?</b> Birden fazla derse kayıtlıysa,
                        hangilerini donduracağınızı seçin
                      </List.Item>
                      <List.Item>
                        <b>Başlangıç Tarihi:</b> Dondurmanın başlayacağı tarihi
                        girin
                      </List.Item>
                      <List.Item>
                        <b>Bitiş Tarihi:</b> Dönüş tarihi belliyse girin. Belli
                        değilse boş bırakın (süresiz dondurma)
                      </List.Item>
                      <List.Item>
                        <b>Sebep:</b> İsteğe bağlı not (örn: "Ameliyat oldu")
                      </List.Item>
                    </List>
                  </List.Item>
                  <List.Item>
                    <b>"Dondur"</b> butonuna basın
                  </List.Item>
                </List>
              </Box>

              <Divider />

              <Box>
                <Group mb="xs">
                  <IconCalendar size={18} />
                  <Text fw={700}>Dondurma Sistemi Nasıl Çalışır?</Text>
                </Group>
                <List size="sm" spacing="xs">
                  <List.Item>
                    Dondurma yapıldığında, dondurma süresindeki aylar <b>ödeme
                    takviminden atlanır</b>
                  </List.Item>
                  <List.Item>
                    Örnek: Üye Ocak'ta kayıt oldu, Mart-Nisan-Mayıs dondurdu.
                    Sistem Mart-Nisan-Mayıs için ödeme beklemez, Haziran'dan devam
                    eder
                  </List.Item>
                  <List.Item>
                    Üyenin <b>borcu donmaz</b>, sadece süre uzar
                  </List.Item>
                  <List.Item>
                    Dondurulmuş üye "Dondurulmuş" sekmesinde görünür
                  </List.Item>
                </List>
              </Box>

              <Divider />

              <Box>
                <Group mb="xs">
                  <IconSnowflake size={18} />
                  <Text fw={700}>Dondurma Açma (Devam Ettirme)</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Üye geri döndüğünde dondurma işlemini sonlandırın:
                </Text>
                <List type="ordered" size="sm" spacing="xs">
                  <List.Item>
                    Üye detay sayfasına gidin
                  </List.Item>
                  <List.Item>
                    Dondurulmuş ders kartında <b>"Dondurma Aç"</b> butonuna basın
                  </List.Item>
                  <List.Item>
                    Bitiş tarihi otomatik bugün olarak ayarlanır
                  </List.Item>
                  <List.Item>
                    Ödeme takvimi güncellenir ve bir sonraki ödeme tarihi yeniden
                    hesaplanır
                  </List.Item>
                </List>
              </Box>

              <Alert icon={<IconInfoCircle />} color="blue" variant="light">
                <b>İpucu:</b> Süresiz dondurma yaptıysanız ve üye dönüş tarihini
                bildirdiyse, dondurma açmayı unutmayın! Aksi halde sistem sürekli
                "dondurulmuş" olarak gösterir.
              </Alert>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* DERSLER */}
        <Accordion.Item value="classes">
          <Accordion.Control
            icon={<IconSchool size={20} color="var(--mantine-color-orange-6)" />}
          >
            <Group>
              <Text fw={600} size="md">
                Ders Yönetimi
              </Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="lg">
              {/* Ders Ekleme */}
              <Box>
                <Group mb="xs">
                  <IconSchool size={18} />
                  <Text fw={700}>Yeni Ders Oluşturma</Text>
                </Group>
                <List type="ordered" size="sm" spacing="xs">
                  <List.Item>
                    Sol menüden <b>Dersler</b> sayfasına gidin
                  </List.Item>
                  <List.Item>
                    <b>"Yeni Ders"</b> butonuna tıklayın
                  </List.Item>
                  <List.Item>
                    Formda doldurun:
                    <List withPadding size="sm" mt="xs">
                      <List.Item>
                        <b>Ders Adı:</b> Örn: "Salsa Başlangıç", "Bachata İleri
                        Seviye"
                      </List.Item>
                      <List.Item>
                        <b>Varsayılan Fiyat:</b> Bu dersin normal aylık ücreti
                      </List.Item>
                      <List.Item>
                        <b>Eğitmen:</b> Dersi verecek eğitmeni seçin (önce eğitmen
                        eklemeniz gerekir)
                      </List.Item>
                      <List.Item>
                        <b>Komisyon Oranı:</b> Bu ders için özel komisyon oranı
                        (yoksa eğitmenin varsayılan oranı kullanılır)
                      </List.Item>
                    </List>
                  </List.Item>
                  <List.Item>
                    <b>"Kaydet"</b> butonuna basın
                  </List.Item>
                </List>
              </Box>

              <Divider />

              {/* Ders Üyeleri */}
              <Box>
                <Group mb="xs">
                  <IconUsers size={18} />
                  <Text fw={700}>Ders Üyelerini Görme</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Bir derste kimler var, kaç kişi aktif görmek için:
                </Text>
                <List type="ordered" size="sm" spacing="xs">
                  <List.Item>
                    <b>Dersler</b> sayfasında ilgili dersin satırına tıklayın
                  </List.Item>
                  <List.Item>
                    Açılan sayfada:
                    <List withPadding size="sm" mt="xs">
                      <List.Item>Derse kayıtlı tüm üyelerin listesi</List.Item>
                      <List.Item>Her üyenin durumu (Aktif/Dondurulmuş/Pasif)</List.Item>
                      <List.Item>Kayıt tarihleri</List.Item>
                      <List.Item>Toplam gelir istatistiği</List.Item>
                    </List>
                  </List.Item>
                </List>
              </Box>

              <Divider />

              {/* Ders Arşivleme */}
              <Box>
                <Group mb="xs">
                  <IconTrash size={18} />
                  <Text fw={700}>Ders Arşivleme</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Bir ders artık verilmiyorsa arşivleyebilirsiniz:
                </Text>
                <List size="sm" spacing="xs">
                  <List.Item>
                    Ders satırındaki <b>üç nokta (...)</b> menüsünden "Arşivle"yi
                    seçin
                  </List.Item>
                  <List.Item>
                    Arşivlenen ders <b>"Arşiv"</b> sekmesinde görünür
                  </List.Item>
                  <List.Item>
                    Bu derse kayıtlı tüm üyelerin kayıtları pasif olur
                  </List.Item>
                  <List.Item>
                    Ödeme geçmişi korunur, yeni kayıt alınamaz
                  </List.Item>
                </List>
                <Alert
                  icon={<IconAlertCircle />}
                  color="orange"
                  variant="light"
                  mt="sm"
                >
                  Ders arşivlediğinizde tüm üye kayıtları pasif olur! Dikkatli
                  kullanın.
                </Alert>
              </Box>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* EĞİTMEN ÖDEMELERİ */}
        <Accordion.Item value="instructors">
          <Accordion.Control
            icon={
              <IconChalkboard size={20} color="var(--mantine-color-violet-6)" />
            }
          >
            <Group>
              <Text fw={600} size="md">
                Eğitmen Ödemeleri ve Komisyon
              </Text>
              <Badge size="sm" variant="light" color="violet">
                Gelişmiş
              </Badge>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="lg">
              <Text>
                Sistem, öğrencilerden alınan her ödemenin eğitmene düşen payını
                otomatik hesaplar. Eğitmen maaş/prim/komisyon takibini manuel
                yapmak yerine sisteme bırakabilirsiniz.
              </Text>

              {/* Komisyon Nasıl Çalışır */}
              <Box>
                <Group mb="xs">
                  <IconCash size={18} />
                  <Text fw={700}>Komisyon Sistemi Nasıl Çalışır?</Text>
                </Group>
                <List type="ordered" size="sm" spacing="xs">
                  <List.Item>
                    Bir öğrenciden ödeme alındığında (örn: 1500 TL)
                  </List.Item>
                  <List.Item>
                    Sistem, o dersin eğitmeninin komisyon oranına bakar (örn: %40)
                  </List.Item>
                  <List.Item>
                    Hesaplama yapar: 1500 × 0.40 = 600 TL
                  </List.Item>
                  <List.Item>
                    Bu 600 TL otomatik olarak eğitmenin <b>"Bekleyen Hakediş"</b>
                    bakiyesine eklenir
                  </List.Item>
                </List>
                <Alert icon={<IconInfoCircle />} color="blue" variant="light" mt="sm">
                  Tüm bu işlemler otomatiktir! Siz sadece öğrenciden ödeme alırsınız,
                  sistem eğitmen payını kaydeder.
                </Alert>
              </Box>

              <Divider />

              {/* Eğitmen Ödemesi Yapma */}
              <Box>
                <Group mb="xs">
                  <IconCash size={18} />
                  <Text fw={700}>Eğitmene Ödeme Yapma</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Eğitmene hakediş ödemesi yapmak için:
                </Text>
                <List type="ordered" size="sm" spacing="xs">
                  <List.Item>
                    Sol menüden <b>Eğitmenler &gt; Ödemeler</b> sayfasına gidin
                  </List.Item>
                  <List.Item>
                    <b>"Ödenecekler"</b> sekmesinde bekleyen ödemeler görünür
                  </List.Item>
                  <List.Item>
                    Her eğitmen için:
                    <List withPadding size="sm" mt="xs">
                      <List.Item>Toplam bakiyesi</List.Item>
                      <List.Item>İşlem sayısı (kaç öğrenci ödemesinden geldiği)</List.Item>
                    </List>
                  </List.Item>
                  <List.Item>
                    <b>"Ödeme Yap"</b> butonuna basın
                  </List.Item>
                  <List.Item>
                    Açılan pencerede:
                    <List withPadding size="sm" mt="xs">
                      <List.Item>Ödeme yöntemini seçin (Nakit/Havale)</List.Item>
                      <List.Item>İsteğe bağlı not ekleyin</List.Item>
                    </List>
                  </List.Item>
                  <List.Item>Onaylayın</List.Item>
                </List>
                <Alert icon={<IconInfoCircle />} color="green" variant="light" mt="sm">
                  Ödeme yapıldığında, eğitmenin bakiyesi sıfırlanır ve işlem
                  geçmişine kaydedilir.
                </Alert>
              </Box>

              <Divider />

              {/* Komisyon Detayları */}
              <Box>
                <Group mb="xs">
                  <IconReceipt size={18} />
                  <Text fw={700}>Komisyon Detayları</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Eğitmen ödemelerinin detayını görmek için:
                </Text>
                <List size="sm" spacing="xs">
                  <List.Item>
                    <b>"Komisyon Detayları"</b> sekmesine tıklayın
                  </List.Item>
                  <List.Item>
                    Bu sayfada:
                    <List withPadding size="sm" mt="xs">
                      <List.Item>Hangi öğrenciden ne kadar komisyon alındığı</List.Item>
                      <List.Item>Hangi dersten geldiği</List.Item>
                      <List.Item>Ödeme tarihi</List.Item>
                      <List.Item>Durum (Bekleyen/Ödenen)</List.Item>
                    </List>
                  </List.Item>
                  <List.Item>Eğitmen ve duruma göre filtreleme yapabilirsiniz</List.Item>
                </List>
              </Box>

              <Divider />

              {/* Ödeme Geçmişi */}
              <Box>
                <Group mb="xs">
                  <IconBook size={18} />
                  <Text fw={700}>Ödeme Geçmişi</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Geçmiş ödemeleri görmek için:
                </Text>
                <List size="sm" spacing="xs">
                  <List.Item>
                    <b>"Ödeme Geçmişi"</b> sekmesine tıklayın
                  </List.Item>
                  <List.Item>
                    Tüm hakediş ödemelerinin listesi görünür
                  </List.Item>
                  <List.Item>Tarih, tutar, ödeme yöntemi ve not bilgileri</List.Item>
                </List>
              </Box>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* FİNANS */}
        <Accordion.Item value="finance">
          <Accordion.Control
            icon={<IconCash size={20} color="var(--mantine-color-teal-6)" />}
          >
            <Group>
              <Text fw={600} size="md">
                Finans ve Raporlama
              </Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="lg">
              {/* Gelir Takibi */}
              <Box>
                <Group mb="xs">
                  <IconCreditCard size={18} />
                  <Text fw={700}>Gelir Takibi (Gelirler Sekmesi)</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Tüm ödemeleri görmek ve filtrelemek için:
                </Text>
                <List size="sm" spacing="xs">
                  <List.Item>
                    Sol menüden <b>Finans</b> sayfasına gidin
                  </List.Item>
                  <List.Item>
                    <b>"Gelirler"</b> sekmesinde tüm ödemeler listelenir
                  </List.Item>
                  <List.Item>
                    Filtreleme yapabilirsiniz:
                    <List withPadding size="sm" mt="xs">
                      <List.Item>Üye adına göre</List.Item>
                      <List.Item>Derse göre</List.Item>
                      <List.Item>Ödeme yöntemine göre</List.Item>
                    </List>
                  </List.Item>
                  <List.Item>Sıralama ve arama yapabilirsiniz</List.Item>
                </List>
              </Box>

              <Divider />

              {/* Gider Takibi */}
              <Box>
                <Group mb="xs">
                  <IconReceipt size={18} />
                  <Text fw={700}>Gider Takibi (Giderler Sekmesi)</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Okulun harcamalarını kaydetmek için:
                </Text>
                <List type="ordered" size="sm" spacing="xs">
                  <List.Item>
                    <b>Finans &gt; Giderler</b> sekmesine gidin
                  </List.Item>
                  <List.Item>
                    <b>"Gider Ekle"</b> butonuna tıklayın
                  </List.Item>
                  <List.Item>
                    Formda doldurun:
                    <List withPadding size="sm" mt="xs">
                      <List.Item>Tarih</List.Item>
                      <List.Item>
                        Kategori (Kira, Elektrik, Su, Temizlik, Maaş, vb.)
                      </List.Item>
                      <List.Item>Tutar</List.Item>
                      <List.Item>Açıklama</List.Item>
                      <List.Item>Fiş Numarası (opsiyonel)</List.Item>
                    </List>
                  </List.Item>
                </List>
              </Box>

              <Divider />

              {/* Raporlama */}
              <Box>
                <Group mb="xs">
                  <IconChartBar size={18} />
                  <Text fw={700}>Raporlama ve Analiz</Text>
                </Group>
                <List size="sm" spacing="xs">
                  <List.Item>
                    <b>Dashboard:</b> Genel istatistikler ve grafikler
                  </List.Item>
                  <List.Item>
                    <b>Gelir Tablosu:</b> Finans &gt; Gelirler'de tarih filtresiyle
                    dönemsel gelir raporu
                  </List.Item>
                  <List.Item>
                    <b>Gider Tablosu:</b> Finans &gt; Giderler'de kategori bazlı
                    harcama analizi
                  </List.Item>
                  <List.Item>
                    <b>Dışa Aktarma:</b> Giderler sayfasında "Dışa Aktar" butonu ile
                    CSV formatında rapor alabilirsiniz
                  </List.Item>
                </List>
              </Box>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* AYARLAR */}
        <Accordion.Item value="settings">
          <Accordion.Control
            icon={<IconSettings size={20} color="var(--mantine-color-gray-6)" />}
          >
            <Group>
              <Text fw={600} size="md">
                Ayarlar ve Özelleştirmeler
              </Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="lg">
              {/* Dans Türleri */}
              <Box>
                <Group mb="xs">
                  <IconSchool size={18} />
                  <Text fw={700}>Dans Türleri Yönetimi</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Okulunuzdaki dans türlerini özelleştirmek için:
                </Text>
                <List type="ordered" size="sm" spacing="xs">
                  <List.Item>
                    Sol menüden <b>Ayarlar &gt; Dans Türleri</b> sayfasına gidin
                  </List.Item>
                  <List.Item>
                    Mevcut dans türlerini görebilir, yeni ekleyebilir veya
                    düzenleyebilirsiniz
                  </List.Item>
                  <List.Item>
                    Her dans türü için:
                    <List withPadding size="sm" mt="xs">
                      <List.Item>Ad (örn: Salsa, Bachata, Tango)</List.Item>
                      <List.Item>Açıklama</List.Item>
                      <List.Item>Aktif/Pasif durumu</List.Item>
                    </List>
                  </List.Item>
                </List>
                <Alert icon={<IconInfoCircle />} color="blue" variant="light" mt="sm">
                  Dans türleri ders oluştururken seçim listesinde kullanılır.
                </Alert>
              </Box>

              <Divider />

              {/* Tema */}
              <Box>
                <Group mb="xs">
                  <IconSettings size={18} />
                  <Text fw={700}>Görünüm Ayarları</Text>
                </Group>
                <Text size="sm" mb="xs">
                  Header'daki tema değiştirme butonu ile Dark/Light mode arasında
                  geçiş yapabilirsiniz.
                </Text>
              </Box>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {/* FAQ Section */}
      <Card mt={40} p="xl" radius="md" withBorder>
        <Title order={3} mb="lg">
          Sıkça Sorulan Sorular
        </Title>

        <Stack gap="lg">
          <Box>
            <Group mb="xs">
              <ThemeIcon variant="light" color="blue" size="sm">
                <IconBook size={14} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Yanlışlıkla ödeme aldım, nasıl düzeltirim?
              </Text>
            </Group>
            <Text size="sm" c="dimmed" ml={36}>
              Finans &gt; Gelirler sayfasına gidin, ilgili ödemeyi bulup sağındaki
              Çöp Kutusu ikonuna basın. Ödeme silindiğinde eğitmen komisyonu ve
              üye takvimi otomatik güncellenir.
            </Text>
          </Box>

          <Box>
            <Group mb="xs">
              <ThemeIcon variant="light" color="blue" size="sm">
                <IconBook size={14} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Öğrenci tamamen bıraktı, ne yapmalıyım?
              </Text>
            </Group>
            <Text size="sm" c="dimmed" ml={36}>
              Üye detay sayfasında ilgili ders kartındaki menüden "Üyeliği
              Sonlandır" seçeneğini kullanın. Bu işlem kaydı pasife alır ama
              ödeme geçmişi ve verileri korunur.
            </Text>
          </Box>

          <Box>
            <Group mb="xs">
              <ThemeIcon variant="light" color="blue" size="sm">
                <IconBook size={14} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Bir üye birden fazla derse kayıtlı olabilir mi?
              </Text>
            </Group>
            <Text size="sm" c="dimmed" ml={36}>
              Evet! Sistem ders bazlı kayıt sistemi kullanır. Bir üye istediği
              kadar derse kayıt olabilir. Her ders için ayrı ödeme takvimi ve
              fiyatlandırma yapılır.
            </Text>
          </Box>

          <Box>
            <Group mb="xs">
              <ThemeIcon variant="light" color="blue" size="sm">
                <IconBook size={14} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Eğitmen komisyon oranı nasıl belirlenir?
              </Text>
            </Group>
            <Text size="sm" c="dimmed" ml={36}>
              İki şekilde: 1) Ders oluştururken o ders için özel oran
              belirleyebilirsiniz. 2) Eğitmenin varsayılan komisyon oranı
              kullanılır. Ders bazlı oran önceliklidir.
            </Text>
          </Box>

          <Box>
            <Group mb="xs">
              <ThemeIcon variant="light" color="blue" size="sm">
                <IconBook size={14} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Dondurulan üyenin ödemesi nasıl hesaplanır?
              </Text>
            </Group>
            <Text size="sm" c="dimmed" ml={36}>
              Dondurma süresindeki aylar ödeme takviminden atlanır. Örneğin 3 ay
              donduran bir üye, 3 ay sonra kaldığı aydan devam eder. Dondurma
              süresi üyelik süresini uzatır.
            </Text>
          </Box>

          <Box>
            <Group mb="xs">
              <ThemeIcon variant="light" color="blue" size="sm">
                <IconBook size={14} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Geçmiş tarihli işlem yapabilir miyim?
              </Text>
            </Group>
            <Text size="sm" c="dimmed" ml={36}>
              Evet. Ödeme eklerken veya gider kaydederken tarih seçebilirsiniz.
              Sistem geçmiş tarihli işlemleri destekler.
            </Text>
          </Box>

          <Box>
            <Group mb="xs">
              <ThemeIcon variant="light" color="blue" size="sm">
                <IconBook size={14} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Verilerim güvende mi?
              </Text>
            </Group>
            <Text size="sm" c="dimmed" ml={36}>
              Tüm veriler Supabase (PostgreSQL) veritabanında güvenle saklanır.
              Düzenli yedekleme yapılması önerilir. Silinen üyeler arşivlenir,
              kalıcı silinmez.
            </Text>
          </Box>
        </Stack>
      </Card>

      {/* Footer Note */}
      <Alert icon={<IconInfoCircle />} color="gray" variant="light" mt="xl">
        <Text size="sm">
          <b>Ekstra Yardıma İhtiyacınız Var mı?</b>
          <br />
          Bu kılavuzda bulamadığınız bir konu için GitHub Issues üzerinden
          destek talep edebilir veya dokümantasyonu inceleyebilirsiniz.
        </Text>
      </Alert>
    </Container>
  );
}

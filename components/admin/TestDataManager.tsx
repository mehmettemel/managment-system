'use client';

import { useState } from 'react';
import { Card, Button, Text, Stack, Alert, Group } from '@mantine/core';
import { IconDatabaseOff, IconRefresh } from '@tabler/icons-react';
import { seedDatabase } from '@/actions/seed';
import { showSuccess, showError } from '@/utils/notifications';

export function TestDataManager() {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (
      !confirm(
        'TÜM veriler silinecek ve test verileri yüklenecek. Emin misiniz?'
      )
    ) {
      return;
    }

    setLoading(true);
    const result = await seedDatabase();

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Veritabanı sıfırlandı ve test verileri yüklendi.');
    }
    setLoading(false);
  };

  return (
    <Card withBorder padding="xl" radius="md">
      <Stack gap="md">
        <Group>
          <IconDatabaseOff size={24} color="gray" />
          <Text fw={600} size="lg">
            Test Verisi Yönetimi
          </Text>
        </Group>

        <Alert variant="light" color="red" title="Dikkat">
          Bu işlem mevcut tüm üyeleri, ödemeleri ve sınıfları siler. Yerine
          önceden tanımlanmış 8 adet test senaryosu (Aktif, Gecikmiş, Donuk vb.)
          yüklenir.
        </Alert>

        <Button
          color="red"
          variant="light"
          onClick={handleReset}
          loading={loading}
          leftSection={<IconRefresh size={16} />}
        >
          Veritabanını Sıfırla ve Test Verisi Yükle
        </Button>
      </Stack>
    </Card>
  );
}

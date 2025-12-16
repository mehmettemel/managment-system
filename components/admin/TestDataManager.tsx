'use client';

import { useState } from 'react';
import { Card, Button, Text, Stack, Alert, Group } from '@mantine/core';
import { IconDatabaseOff, IconRefresh, IconTrash } from '@tabler/icons-react';
import { seedDatabase } from '@/actions/seed';
import { deleteAllData } from '@/actions/reset';
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

  const handleDeleteAll = async () => {
    if (
      !confirm(
        'UYARI: Tüm veritabanı SİLİNECEK ve BOŞ bir sistem kalacak. Bu işlem geri alınamaz! Emin misiniz?'
      )
    ) {
      return;
    }

    setLoading(true);
    const result = await deleteAllData();

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Tüm veriler temizlendi.');
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
          Bu işlem mevcut tüm üyeleri, ödemeleri ve sınıfları siler.
        </Alert>

        <Group grow>
          <Button
            color="blue"
            variant="light"
            onClick={handleReset}
            loading={loading}
            leftSection={<IconRefresh size={16} />}
          >
            Sıfırla ve Test Verisi Yükle
          </Button>

          <Button
            color="red"
            variant="outline"
            onClick={handleDeleteAll}
            loading={loading}
            leftSection={<IconTrash size={16} />}
          >
            TÜM Verileri Sil (Temizle)
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

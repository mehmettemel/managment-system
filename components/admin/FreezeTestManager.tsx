'use client';

import { useState } from 'react';
import { Card, Button, Text, Stack, Alert, Group } from '@mantine/core';
import { IconSnowflake, IconTestPipe } from '@tabler/icons-react';
import { generateFreezeScenarios } from '@/actions/test-freeze';
import { showSuccess, showError } from '@/utils/notifications';

export function FreezeTestManager() {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateFreezeScenarios();

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Dondurma senaryoları (4 Üye) oluşturuldu.');
    }
    setLoading(false);
  };

  return (
    <Card withBorder padding="xl" radius="md">
      <Stack gap="md">
        <Group>
          <IconSnowflake size={24} color="blue" />
          <Text fw={600} size="lg">
            Dondurma Test Merkezi
          </Text>
        </Group>

        <Alert variant="light" color="blue" title="Senaryo Testleri">
          Bu işlem 4 farklı üye profili oluşturur:
          <br />
          1. <b>Süresiz Donuk:</b> 1 aydır donuk.
          <br />
          2. <b>Süreli Donuk:</b> Tarihli dondurulmuş (Bug fix testi için).
          <br />
          3. <b>Gelecek Donuk:</b> İleri tarihte donacak.
          <br />
          4. <b>Gecikmiş Donuk:</b> Borçluyken dondurulmuş.
        </Alert>

        <Button
          variant="light"
          color="blue"
          onClick={handleGenerate}
          loading={loading}
          leftSection={<IconTestPipe size={16} />}
        >
          Senaryoları Oluştur
        </Button>
      </Stack>
    </Card>
  );
}

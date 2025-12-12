'use client';

import { useState } from 'react';
import { Card, Button, Text, Stack, Group, SimpleGrid } from '@mantine/core';
import { IconBolt, IconUserPlus, IconSchool } from '@tabler/icons-react';
import { createRandomMember, createRandomClass } from '@/actions/test-utils';
import { showSuccess, showError } from '@/utils/notifications';

export function QuickActions() {
  const [loadingMember, setLoadingMember] = useState(false);
  const [loadingClass, setLoadingClass] = useState(false);

  const handleAddMember = async () => {
    setLoadingMember(true);
    const result = await createRandomMember();
    if (result.error) showError(result.error);
    else showSuccess(`Test üyesi oluşturuldu: ${result.data.first_name}`);
    setLoadingMember(false);
  };

  const handleAddClass = async () => {
    setLoadingClass(true);
    const result = await createRandomClass();
    if (result.error) showError(result.error);
    else showSuccess(`Test sınıfı oluşturuldu: ${result.data.name}`);
    setLoadingClass(false);
  };

  return (
    <Card withBorder padding="xl" radius="md">
      <Stack gap="md">
        <Group>
          <IconBolt size={24} color="orange" />
          <Text fw={600} size="lg">
            Hızlı İşlemler
          </Text>
        </Group>

        <Text size="sm" c="dimmed">
          Sisteme hızlıca rastgele veri eklemek için kullanabilirsiniz.
        </Text>

        <SimpleGrid cols={2}>
          <Button
            variant="light"
            onClick={handleAddMember}
            loading={loadingMember}
            leftSection={<IconUserPlus size={16} />}
          >
            +1 Rastgele Üye
          </Button>
          <Button
            variant="light"
            color="grape"
            onClick={handleAddClass}
            loading={loadingClass}
            leftSection={<IconSchool size={16} />}
          >
            +1 Rastgele Sınıf
          </Button>
        </SimpleGrid>
      </Stack>
    </Card>
  );
}

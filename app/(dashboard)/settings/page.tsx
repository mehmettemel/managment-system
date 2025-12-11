/**
 * Settings Page (Placeholder)
 */

import { Title, Text, Stack } from '@mantine/core';
import { EmptyState } from '@/components/shared/EmptyState';
import { IconSettings } from '@tabler/icons-react';

export default function SettingsPage() {
  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Ayarlar</Title>
        <Text c="dimmed">Sistem ayarlarını yapılandırın</Text>
      </div>

      <EmptyState
        title="Yakında Gelecek"
        description="Ayarlar sayfası geliştirme aşamasında"
        icon={<IconSettings size={64} />}
      />
    </Stack>
  );
}

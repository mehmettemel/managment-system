/**
 * Dance Types Settings Page
 */

import { getDanceTypes } from '@/actions/dance-types';
import { DanceTypesTable } from '@/components/settings/DanceTypesTable';
import { Stack, Title, Text } from '@mantine/core';

export default async function DanceTypesPage() {
  const { data: types } = await getDanceTypes();

  return (
    <Stack gap="lg">
      <div>
        <Title order={1}>Dans Türleri</Title>
        <Text c="dimmed">
          Eğitmen komisyonları ve sınıf kategorileri için dans türlerini
          yönetin.
        </Text>
      </div>

      <DanceTypesTable data={types || []} />
    </Stack>
  );
}

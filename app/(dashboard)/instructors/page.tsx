/**
 * Instructors Page
 */

import { Title, Text, Stack } from '@mantine/core';
import { getInstructors } from '@/actions/instructors';
import { InstructorsContent } from '@/components/instructors/InstructorsContent';

export default async function InstructorsPage() {
  const { data: instructors } = await getInstructors();

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Eğitmenler</Title>
        <Text c="dimmed">Eğitmenleri yönetin ve ders atayın.</Text>
      </div>

      <InstructorsContent initialInstructors={instructors || []} />
    </Stack>
  );
}

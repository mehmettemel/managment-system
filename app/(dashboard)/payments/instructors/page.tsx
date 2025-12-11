/**
 * Instructor Payments Page
 */

import { Title, Text, Stack } from '@mantine/core';
import { getPayableLedger, getInstructorPayouts } from '@/actions/finance';
import { InstructorPaymentsTable } from '@/components/payments/InstructorPaymentsTable';

export default async function InstructorPaymentsPage() {
  const [payableRes, payoutsRes] = await Promise.all([
    getPayableLedger(),
    getInstructorPayouts(),
  ]);

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Eğitmen Ödemeleri</Title>
        <Text c="dimmed">
          Vadesi gelmiş hakedişleri ve geçmiş ödemeleri görüntüleyin.
        </Text>
      </div>

      <InstructorPaymentsTable
        data={payableRes.data || []}
        payouts={payoutsRes.data || []}
      />
    </Stack>
  );
}

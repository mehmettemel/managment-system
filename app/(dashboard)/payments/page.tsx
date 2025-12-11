/**
 * Payments Page
 */

import { Title, Text, Stack } from '@mantine/core';
import { getRecentPayments } from '@/actions/payments';
import { PaymentsContent } from '@/components/payments/PaymentsContent';

export default async function PaymentsPage() {
  const { data: payments } = await getRecentPayments(50); // Last 50 payments

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Ödemeler</Title>
        <Text c="dimmed">Son yapılan ödemeler ve finansal hareketler.</Text>
      </div>

      <PaymentsContent initialPayments={payments || []} />
    </Stack>
  );
}

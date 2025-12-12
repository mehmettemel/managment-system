import { Title, Text, Stack } from '@mantine/core';
import { PaymentsTable } from '@/components/payments/PaymentsTable';

export default function PaymentsPage() {
  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Ödemeler</Title>
        <Text c="dimmed">Son yapılan ödemeler ve finansal hareketler.</Text>
      </div>

      <PaymentsTable />
    </Stack>
  );
}

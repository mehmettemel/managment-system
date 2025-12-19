'use client';

import { Title, Text, Stack, Tabs } from '@mantine/core';
import { IconCash, IconReceipt } from '@tabler/icons-react';
import { PaymentsTable } from '@/components/payments/PaymentsTable';
import { ExpensesContent } from '@/components/expenses/ExpensesContent';

export default function FinancePage() {
  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Finans</Title>
        <Text c="dimmed">Gelir ve gider yönetimi.</Text>
      </div>

      <Tabs defaultValue="income" variant="pills">
        <Tabs.List mb="md">
          <Tabs.Tab value="income" leftSection={<IconCash size={16} />}>
            Gelirler
          </Tabs.Tab>
          <Tabs.Tab value="expenses" leftSection={<IconReceipt size={16} />}>
            Giderler
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="income">
          <PaymentsTable />
        </Tabs.Panel>

        <Tabs.Panel value="expenses">
          <ExpensesContent />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

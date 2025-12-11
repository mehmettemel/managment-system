/**
 * Revenue Chart Component
 * Visualises monthly revenue trend
 */

'use client';

import { AreaChart } from '@mantine/charts';
import { Card, Title, Text } from '@mantine/core';
import { formatCurrency } from '@/utils/formatters';

// Mock Data
const data = [
  { date: 'Tem', Revenue: 12000, Expenses: 4000 },
  { date: 'Ağu', Revenue: 18000, Expenses: 5500 },
  { date: 'Eyl', Revenue: 22000, Expenses: 7000 },
  { date: 'Eki', Revenue: 25000, Expenses: 8500 },
  { date: 'Kas', Revenue: 21000, Expenses: 6000 },
  { date: 'Ara', Revenue: 28000, Expenses: 9000 },
];

export function RevenueChart() {
  return (
    <Card withBorder radius="md" p="xl">
      <Title order={3} mb="sm">
        Gelir Analizi
      </Title>
      <Text c="dimmed" size="sm" mb="lg">
        Son 6 aylık gelir-gider tablosu
      </Text>

      <AreaChart
        h={300}
        data={data}
        dataKey="date"
        series={[
          { name: 'Revenue', color: 'teal.6', label: 'Gelir' },
          { name: 'Expenses', color: 'red.6', label: 'Gider' },
        ]}
        curveType="monotone"
        tickLine="y"
        gridAxis="xy"
        valueFormatter={(value) => formatCurrency(value)}
      />
    </Card>
  );
}

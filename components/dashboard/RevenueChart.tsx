/**
 * Revenue Chart Component
 * Visualises monthly revenue trend
 */

'use client';

import { AreaChart } from '@mantine/charts';
import { Card, Title, Text } from '@mantine/core';
import { formatCurrency } from '@/utils/formatters';

// No Mock Data
import { getRevenueStats } from '@/actions/dashboard';
import { useState, useEffect } from 'react';

export function RevenueChart() {
  const [data, setData] = useState<
    { date: string; Revenue: number; Expenses: number }[]
  >([]);

  useEffect(() => {
    getRevenueStats().then((res) => {
      if (res.data) setData(res.data);
    });
  }, []);

  return (
    <Card withBorder radius="md" p="xl">
      <Title order={3} mb="sm">
        Gelir Analizi
      </Title>
      <Text c="dimmed" size="sm" mb="lg">
        Son 6 aylık gelir-gider tablosu
      </Text>

      <AreaChart
        h={{ base: 250, sm: 300, lg: 400 }}
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

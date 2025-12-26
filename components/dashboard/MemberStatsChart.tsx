/**
 * Member Stats Chart
 * Visualises member distribution by class type
 */

'use client';

import { BarChart } from '@mantine/charts';
import { Card, Title, Text } from '@mantine/core';

import { getLessonPopularityStats } from '@/actions/dashboard';
import { useState, useEffect } from 'react';

export function MemberStatsChart() {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    getLessonPopularityStats().then((res) => {
      if (res.data) setData(res.data);
    });
  }, []);

  return (
    <Card withBorder radius="md" p="xl">
      <Title order={3} mb="sm">
        Ders Dağılımı
      </Title>
      <Text c="dimmed" size="sm" mb="lg">
        Branşlara göre kayıtlı üye dersleri
      </Text>

      <BarChart
        h={{ base: 250, sm: 300, lg: 400 }}
        data={data}
        dataKey="name"
        series={[{ name: 'value', color: 'blue.6', label: 'Kayıt Sayısı' }]}
        tickLine="y"
        gridAxis="y"
        tooltipAnimationDuration={200}
      />
    </Card>
  );
}

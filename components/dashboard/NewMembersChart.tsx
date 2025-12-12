'use client';

import { Card, Title, Text } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { useState, useEffect } from 'react';
import { getMemberGrowthStats } from '@/actions/dashboard';
import { IconUserPlus } from '@tabler/icons-react';

export function NewMembersChart() {
  const [data, setData] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMemberGrowthStats().then((res) => {
      if (res.data) setData(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <Card withBorder radius="md" p="xl" style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
        }}
      >
        <div>
          <Title order={3}>Yeni Üye Katılımı</Title>
          <Text c="dimmed" size="sm">
            Son 6 aydaki yeni kayıtlar
          </Text>
        </div>
        <IconUserPlus size={24} style={{ opacity: 0.5 }} />
      </div>

      <BarChart
        h={300}
        data={data}
        dataKey="date"
        series={[{ name: 'count', color: 'indigo.6', label: 'Yeni Üye' }]}
        tickLine="y"
        gridAxis="y"
        tooltipAnimationDuration={200}
        barProps={{ radius: [10, 10, 0, 0] }}
      />
    </Card>
  );
}

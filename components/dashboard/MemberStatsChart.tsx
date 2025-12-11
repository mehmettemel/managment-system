/**
 * Member Stats Chart
 * Visualises member distribution by class type
 */

'use client'

import { BarChart } from '@mantine/charts'
import { Card, Title, Text } from '@mantine/core'

// Mock Data
const data = [
  { month: 'Salsa', Members: 45 },
  { month: 'Bachata', Members: 35 },
  { month: 'Tango', Members: 20 },
  { month: 'Hip Hop', Members: 55 },
  { month: 'Modern', Members: 30 },
  { month: 'Zeybek', Members: 15 },
]

export function MemberStatsChart() {
  return (
    <Card withBorder radius="md" p="xl">
      <Title order={3} mb="sm">Ders Dağılımı</Title>
      <Text c="dimmed" size="sm" mb="lg">Branşlara göre aktif üye sayıları</Text>
      
      <BarChart
        h={300}
        data={data}
        dataKey="month"
        series={[
          { name: 'Members', color: 'blue.6', label: 'Üye Sayısı' },
        ]}
        tickLine="y"
        gridAxis="y"
      />
    </Card>
  )
}

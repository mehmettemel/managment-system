/**
 * Stats Card Component
 * For displaying statistics on dashboard
 */

import { Paper, Group, Text, ThemeIcon, Stack } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: string;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  color = 'orange',
  loading = false,
}: StatsCardProps) {
  const isPositiveTrend = trend && trend.value > 0;

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text fw={700} size="xl">
            {loading ? '-' : value}
          </Text>
          {trend && (
            <Group gap={4}>
              <ThemeIcon
                size="xs"
                variant="transparent"
                color={isPositiveTrend ? 'teal' : 'red'}
              >
                {isPositiveTrend ? (
                  <IconTrendingUp size={16} />
                ) : (
                  <IconTrendingDown size={16} />
                )}
              </ThemeIcon>
              <Text size="xs" c={isPositiveTrend ? 'teal' : 'red'} fw={500}>
                {trend.value > 0 ? '+' : ''}
                {trend.value}%
              </Text>
              <Text size="xs" c="dimmed">
                {trend.label}
              </Text>
            </Group>
          )}
        </Stack>
        <ThemeIcon color={color} variant="light" size={50} radius="md">
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

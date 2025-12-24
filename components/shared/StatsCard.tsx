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
    <Paper withBorder p="md" radius="md" h="100%">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4} style={{ flex: 1 }}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text fw={700} size="xl">
            {loading ? '-' : value}
          </Text>

          <div style={{ minHeight: 24 }}>
            {trend ? (
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
            ) : (
              <Text size="xs" c="dimmed" style={{ opacity: 0 }}>
                -
              </Text>
            )}
          </div>
        </Stack>
        <ThemeIcon color={color} variant="light" size={{ base: 40, sm: 50 }} radius="md">
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

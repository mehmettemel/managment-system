/**
 * Empty State Component
 * Displays when no data is available
 */

import { Stack, Text, Button, Paper, Box } from '@mantine/core';
import { IconMoodEmpty } from '@tabler/icons-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'Henüz kayıt yok',
  description = 'Yeni bir kayıt ekleyerek başlayın.',
  actionLabel,
  onAction,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <Paper p="xl" radius="md" withBorder>
      <Stack align="center" gap="md" py="xl">
        <Box c="dimmed">{icon || <IconMoodEmpty size={64} stroke={1.5} />}</Box>
        <Stack align="center" gap="xs">
          <Text size="lg" fw={600}>
            {title}
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            {description}
          </Text>
        </Stack>
        {action ? (
          <Box mt="md">{action}</Box>
        ) : (
          actionLabel &&
          onAction && (
            <Button onClick={onAction} variant="light" size="md" mt="md">
              {actionLabel}
            </Button>
          )
        )}
      </Stack>
    </Paper>
  );
}

'use client';

import {
  Drawer,
  Stack,
  Text,
  Group,
  Badge,
  Button,
  Divider,
  ThemeIcon,
  Paper,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconCreditCard,
  IconCalendar,
  IconNote,
  IconTrash,
} from '@tabler/icons-react';
import { PaymentScheduleItem } from '@/types';
import { formatCurrency, formatPaymentMethod } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';

interface PaymentDetailDrawerProps {
  opened: boolean;
  onClose: () => void;
  item: PaymentScheduleItem | null;
  onPay: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function PaymentDetailDrawer({
  opened,
  onClose,
  item,
  onPay,
  onCancel,
  loading = false,
}: PaymentDetailDrawerProps) {
  if (!item) return null;

  const isPaid = item.status === 'paid';

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={600} size="lg">
          Ödeme Detayı
        </Text>
      }
      position="right"
      size="md"
    >
      <Stack gap="xl">
        {/* Header Section */}
        <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
          <Stack align="center" gap="xs">
            <Text c="dimmed" size="sm">
              {item.periodLabel}
            </Text>
            <Text fw={700} size="xl" style={{ fontSize: '2rem' }}>
              {formatCurrency(item.amount)}
            </Text>
            {isPaid ? (
              <Badge
                size="lg"
                color="green"
                leftSection={<IconCheck size={16} />}
              >
                Ödendi
              </Badge>
            ) : item.status === 'overdue' ? (
              <Badge size="lg" color="red" leftSection={<IconX size={16} />}>
                Gecikmiş
              </Badge>
            ) : (
              <Badge size="lg" color="gray">
                Ödenmedi
              </Badge>
            )}
          </Stack>
        </Paper>

        {/* Details Section */}
        <Stack gap="md">
          <Text fw={600} size="sm" c="dimmed">
            DETAYLAR
          </Text>

          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon variant="light" color="blue" size="sm">
                <IconCalendar size={14} />
              </ThemeIcon>
              <Text size="sm">Dönem</Text>
            </Group>
            <Text fw={500} size="sm">
              {item.periodLabel}
            </Text>
          </Group>

          {isPaid && (
            <>
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon variant="light" color="cyan" size="sm">
                    <IconCalendar size={14} />
                  </ThemeIcon>
                  <Text size="sm">Ödeme Tarihi</Text>
                </Group>
                <Text fw={500} size="sm">
                  {item.paymentDate ? formatDate(item.paymentDate) : '-'}
                </Text>
              </Group>

              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon variant="light" color="violet" size="sm">
                    <IconCreditCard size={14} />
                  </ThemeIcon>
                  <Text size="sm">Ödeme Yöntemi</Text>
                </Group>
                <Text fw={500} size="sm">
                  {formatPaymentMethod(item.paymentMethod)}
                </Text>
              </Group>
            </>
          )}

          {item.description && (
            <>
              <Divider my="xs" />
              <Stack gap="xs">
                <Group gap="xs">
                  <ThemeIcon variant="light" color="gray" size="sm">
                    <IconNote size={14} />
                  </ThemeIcon>
                  <Text size="sm" fw={500}>
                    Açıklama
                  </Text>
                </Group>
                <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                  {item.description}
                </Text>
              </Stack>
            </>
          )}
        </Stack>

        <Divider />

        {/* Actions */}
        <Group grow>
          {isPaid ? (
            <Button
              color="red"
              variant="light"
              leftSection={<IconTrash size={16} />}
              onClick={onCancel}
              loading={loading}
            >
              Ödemeyi İptal Et
            </Button>
          ) : (
            <Button
              color="blue"
              leftSection={<IconCreditCard size={16} />}
              onClick={onPay}
              loading={loading}
            >
              Ödeme Al
            </Button>
          )}
        </Group>
      </Stack>
    </Drawer>
  );
}

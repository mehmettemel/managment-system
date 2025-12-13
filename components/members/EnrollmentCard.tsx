'use client';

import {
  Card,
  Text,
  Group,
  Button,
  Badge,
  Stack,
  ThemeIcon,
  Menu,
  ActionIcon,
} from '@mantine/core';
import {
  IconCalendar,
  IconCreditCard,
  IconArrowsExchange,
  IconDots,
  IconList,
  IconHistory,
} from '@tabler/icons-react';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import { MemberClassWithDetails } from '@/types';
import dayjs from 'dayjs';

interface EnrollmentCardProps {
  enrollment: MemberClassWithDetails;
  effectiveDate: string;
  onPay: () => void;
  onTransfer: () => void;
  onViewSchedule?: () => void; // NEW
}

export function EnrollmentCard({
  enrollment,
  effectiveDate,
  onPay,
  onTransfer,
  onViewSchedule,
}: EnrollmentCardProps) {
  const isOverdue =
    enrollment.next_payment_date &&
    dayjs(enrollment.next_payment_date).isBefore(dayjs(effectiveDate), 'day');

  // Use custom_price if active, else list price
  const displayPrice =
    enrollment.custom_price ?? enrollment.classes?.price_monthly ?? 0;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={600} size="lg">
            {enrollment.classes?.name}
          </Text>
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconArrowsExchange size={14} />}
                onClick={onTransfer}
              >
                Sınıf Değiştir
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Card.Section>

      <Stack mt="md" gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon color="blue" variant="light" size="sm">
              <IconCalendar size={14} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              Sonraki Ödeme
            </Text>
          </Group>
          <Text fw={500} size="sm" c={isOverdue ? 'red' : undefined}>
            {enrollment.next_payment_date
              ? formatDate(enrollment.next_payment_date)
              : 'Belirlenmedi'}
          </Text>
        </Group>

        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon color="gray" variant="light" size="sm">
              <IconHistory size={14} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              Kayıt Tarihi
            </Text>
          </Group>
          <Text fw={500} size="sm">
            {enrollment.created_at ? formatDate(enrollment.created_at) : '-'}
          </Text>
        </Group>

        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon color="green" variant="light" size="sm">
              <IconCreditCard size={14} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              Ücret
            </Text>
          </Group>
          <Group gap={4}>
            <Text fw={700} size="lg">
              {formatCurrency(displayPrice)}
            </Text>
            {enrollment.custom_price !== null && (
              <Badge size="xs" variant="light" color="yellow">
                Özel
              </Badge>
            )}
          </Group>
        </Group>
      </Stack>

      <Group mt="md" grow>
        <Button
          leftSection={<IconList size={16} />}
          onClick={onViewSchedule}
          variant="light"
          color="gray"
        >
          Tüm Ödemeler
        </Button>
        <Button
          leftSection={<IconCreditCard size={16} />}
          onClick={onPay}
          variant={isOverdue ? 'filled' : 'light'}
          color={isOverdue ? 'red' : 'blue'}
        >
          {isOverdue ? 'Öde (Gecikmiş)' : 'Öde'}
        </Button>
      </Group>
    </Card>
  );
}

'use client';

import {
  Card,
  Text,
  Group,
  Button,
  Badge,
  ThemeIcon,
  Menu,
  ActionIcon,
  Grid,
} from '@mantine/core';
import {
  IconCalendar,
  IconCreditCard,
  IconDots,
  IconList,
  IconHistory,
  IconSnowflake,
  IconTrash,
  IconDotsVertical,
  IconPencil,
} from '@tabler/icons-react';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import { MemberClassWithDetails, FrozenLog } from '@/types';
import dayjs from 'dayjs';

interface EnrollmentCardProps {
  enrollment: MemberClassWithDetails;
  effectiveDate: string;
  activeFreezeLog?: FrozenLog | null;
  onPay: () => void;
  onDrop: () => void;
  onFreeze: () => void;
  onUnfreeze: () => void;
  onViewSchedule?: () => void;
  onEditPrice?: () => void;
}

export function EnrollmentCard({
  enrollment,
  effectiveDate,
  activeFreezeLog,
  onPay,
  onDrop,
  onFreeze,
  onUnfreeze,
  onViewSchedule,
  onEditPrice,
}: EnrollmentCardProps) {
  const isOverdue =
    !activeFreezeLog &&
    enrollment.next_payment_date &&
    dayjs(enrollment.next_payment_date).isBefore(dayjs(effectiveDate), 'day');

  // Use custom_price if active, else list price
  const displayPrice =
    enrollment.custom_price ?? enrollment.classes?.price_monthly ?? 0;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Grid align="center" gutter="lg">
        {/* 1. Header & Badges */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Group justify="space-between" align="center" wrap="nowrap">
            <div>
              <Text
                fw={700}
                size="xl"
                className="text-gray-900 dark:text-white"
              >
                {enrollment.classes?.name}
              </Text>
              <Group gap="xs" mt={4}>
                {enrollment.payment_interval &&
                enrollment.payment_interval > 1 ? (
                  <Badge variant="dot" color="blue" size="md">
                    {enrollment.payment_interval} Aylık Taahhüt
                  </Badge>
                ) : (
                  <Badge variant="outline" color="gray" size="sm">
                    Aylık
                  </Badge>
                )}
                {activeFreezeLog && (
                  <Badge color="cyan" leftSection={<IconSnowflake size={12} />}>
                    Donduruldu
                  </Badge>
                )}
              </Group>
              {activeFreezeLog && (
                <Text size="xs" c="cyan" mt={4}>
                  {formatDate(activeFreezeLog.start_date)} tarihinden beri
                  dondurulmuş
                </Text>
              )}
            </div>
          </Group>
        </Grid.Col>

        {/* 2. Info Columns (Date, Price, Payment Date) */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Group gap="xl" wrap="wrap">
            {/* Payment Date */}
            <Group gap={8}>
              <ThemeIcon
                color={activeFreezeLog ? 'gray' : 'blue'}
                variant="light"
                size="md"
                radius="md"
              >
                <IconCalendar size={18} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Sonraki Ödeme
                </Text>
                {activeFreezeLog ? (
                  <Text fw={600} size="sm" c="dimmed">
                    Donduruldu
                  </Text>
                ) : (
                  <Text fw={600} size="sm" c={isOverdue ? 'red' : undefined}>
                    {enrollment.next_payment_date
                      ? formatDate(enrollment.next_payment_date)
                      : 'Belirlenmedi'}
                  </Text>
                )}
              </div>
            </Group>

            {/* Created At */}
            <Group gap={8}>
              <ThemeIcon color="gray" variant="light" size="md" radius="md">
                <IconHistory size={18} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Kayıt Tarihi
                </Text>
                <Text fw={600} size="sm">
                  {enrollment.created_at
                    ? formatDate(enrollment.created_at)
                    : '-'}
                </Text>
              </div>
            </Group>

            {/* Price */}
            <Group gap={8}>
              <ThemeIcon color="green" variant="light" size="md" radius="md">
                <IconCreditCard size={18} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Aylık Ücret
                </Text>
                <Group gap={4}>
                  <Text fw={700} size="md">
                    {formatCurrency(displayPrice)}
                  </Text>
                  {enrollment.custom_price !== null && (
                    <Badge size="xs" variant="light" color="yellow">
                      Özel
                    </Badge>
                  )}
                </Group>
              </div>
            </Group>
          </Group>
        </Grid.Col>

        {/* 3. Actions */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="light"
              color="gray"
              size="sm"
              leftSection={<IconList size={16} />}
              onClick={onViewSchedule}
            >
              Geçmiş
            </Button>

            {activeFreezeLog ? (
              <Button
                variant="outline"
                color="cyan"
                size="sm"
                leftSection={<IconSnowflake size={16} />}
                onClick={onUnfreeze}
              >
                Aktifleştir
              </Button>
            ) : (
              <Button
                variant={isOverdue ? 'filled' : 'light'}
                color={isOverdue ? 'red' : 'blue'}
                size="sm"
                leftSection={<IconCreditCard size={16} />}
                onClick={onPay}
              >
                {isOverdue ? 'Öde' : 'Öde'}
              </Button>
            )}

            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="lg">
                  <IconDots size={20} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {!activeFreezeLog && (
                  <Menu.Item
                    leftSection={<IconSnowflake size={14} />}
                    onClick={onFreeze}
                  >
                    Dondur
                  </Menu.Item>
                )}
                <Menu.Item
                  leftSection={<IconPencil size={14} />}
                  onClick={onEditPrice}
                >
                  Fiyat/Plan Düzenle
                </Menu.Item>
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={onDrop}
                >
                  Dersten Ayrıl
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Grid.Col>
      </Grid>
    </Card>
  );
}

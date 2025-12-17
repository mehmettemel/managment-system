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
  Tooltip,
  Collapse,
  Stack,
  Divider,
  Alert,
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
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
} from '@tabler/icons-react';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import { MemberClassWithDetails, FrozenLog } from '@/types';
import dayjs from 'dayjs';
import { useState } from 'react';

interface EnrollmentCardProps {
  enrollment: MemberClassWithDetails & { overdueMonthsCount?: number };
  effectiveDate: string;
  activeFreezeLog?: FrozenLog | null;
  pastFrozenLogs?: FrozenLog[];
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
  pastFrozenLogs = [],
  onPay,
  onDrop,
  onFreeze,
  onUnfreeze,
  onViewSchedule,
  onEditPrice,
}: EnrollmentCardProps) {
  const [showFrozenHistory, setShowFrozenHistory] = useState(false);

  // Use overdueMonthsCount if available, otherwise fallback to date comparison
  const isOverdue =
    !activeFreezeLog &&
    ((enrollment.overdueMonthsCount !== undefined &&
      enrollment.overdueMonthsCount > 0) ||
      (enrollment.next_payment_date &&
        dayjs(enrollment.next_payment_date).isBefore(
          dayjs(effectiveDate),
          'day'
        )));

  // Use custom_price if active, else list price
  const displayPrice =
    enrollment.custom_price ?? enrollment.classes?.price_monthly ?? 0;

  // Filter past frozen logs (those that have ended)
  const completedFrozenLogs = pastFrozenLogs.filter((log) => log.end_date);
  const hasFrozenHistory = completedFrozenLogs.length > 0;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Grid align="center" gutter="lg">
        {/* 1. Header & Badges */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Group justify="space-between" align="center" wrap="nowrap">
            <div>
              <Group gap="xs">
                <Text
                  fw={700}
                  size="xl"
                  className="text-gray-900 dark:text-white"
                >
                  {enrollment.classes?.name}
                </Text>
                {isOverdue &&
                  typeof enrollment.overdueMonthsCount === 'number' &&
                  enrollment.overdueMonthsCount > 0 && (
                    <Tooltip
                      label={
                        enrollment.overdueMonthsCount === 1
                          ? '1 Aylık Gecikmiş Ödeme'
                          : `${enrollment.overdueMonthsCount} Aylık Gecikmiş Ödeme`
                      }
                      withArrow
                    >
                      <IconAlertCircle
                        size={20}
                        color="var(--mantine-color-red-6)"
                      />
                    </Tooltip>
                  )}
              </Group>
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
                {isOverdue &&
                  typeof enrollment.overdueMonthsCount === 'number' &&
                  enrollment.overdueMonthsCount > 0 && (
                    <Badge color="red" variant="light">
                      {enrollment.overdueMonthsCount > 1
                        ? `${enrollment.overdueMonthsCount} Ay Gecikmiş`
                        : '1 Ay Gecikmiş'}
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
                color={activeFreezeLog ? 'gray' : isOverdue ? 'red' : 'blue'}
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
                  <>
                    <Text fw={600} size="sm" c={isOverdue ? 'red' : undefined}>
                      {enrollment.next_payment_date
                        ? formatDate(enrollment.next_payment_date)
                        : 'Belirlenmedi'}
                    </Text>
                    {isOverdue &&
                      typeof enrollment.overdueMonthsCount === 'number' &&
                      enrollment.overdueMonthsCount > 0 && (
                        <Text size="xs" c="red" fw={500}>
                          {enrollment.overdueMonthsCount === 1
                            ? '1 ay gecikmiş'
                            : `${enrollment.overdueMonthsCount} ay gecikmiş`}
                        </Text>
                      )}
                  </>
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

            {/* First Payment Date */}
            <Group gap={8}>
              <ThemeIcon
                color={enrollment.first_payment_date ? 'green' : 'orange'}
                variant="light"
                size="md"
                radius="md"
              >
                <IconCreditCard size={18} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  İlk Ödeme
                </Text>
                <Text
                  fw={600}
                  size="sm"
                  c={enrollment.first_payment_date ? 'green' : 'orange'}
                >
                  {enrollment.first_payment_date
                    ? formatDate(enrollment.first_payment_date)
                    : 'Bekliyor'}
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

      {/* Frozen History Section */}
      {hasFrozenHistory && (
        <>
          <Divider my="md" />
          <div>
            <Button
              variant="subtle"
              size="xs"
              color="cyan"
              leftSection={<IconSnowflake size={14} />}
              rightSection={
                showFrozenHistory ? (
                  <IconChevronUp size={14} />
                ) : (
                  <IconChevronDown size={14} />
                )
              }
              onClick={() => setShowFrozenHistory(!showFrozenHistory)}
            >
              Dondurma Geçmişi ({completedFrozenLogs.length})
            </Button>

            <Collapse in={showFrozenHistory}>
              <Stack gap="xs" mt="sm">
                {completedFrozenLogs
                  .sort((a, b) => dayjs(b.start_date).diff(dayjs(a.start_date)))
                  .map((log) => {
                    const startDate = dayjs(log.start_date);
                    const endDate = dayjs(log.end_date!);
                    const durationDays = endDate.diff(startDate, 'day');
                    const durationMonths = Math.floor(durationDays / 30);
                    const remainingDays = durationDays % 30;

                    return (
                      <Alert
                        key={log.id}
                        icon={<IconSnowflake size={16} />}
                        color="cyan"
                        variant="light"
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <div style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>
                              {formatDate(log.start_date)} -{' '}
                              {formatDate(log.end_date!)}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {durationMonths > 0 && `${durationMonths} ay `}
                              {remainingDays > 0 && `${remainingDays} gün`}
                              {log.reason && ` • ${log.reason}`}
                            </Text>
                          </div>
                          <Badge size="sm" color="cyan" variant="outline">
                            Tamamlandı
                          </Badge>
                        </Group>
                      </Alert>
                    );
                  })}
              </Stack>
            </Collapse>
          </div>
        </>
      )}
    </Card>
  );
}

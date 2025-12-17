'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Title,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  Card,
  SimpleGrid,
  ThemeIcon,
  ActionIcon,
  Menu,
  Divider,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconUser,
  IconUsers,
  IconCurrencyLira,
  IconDots,
  IconEye,
  IconCreditCard,
  IconEdit,
} from '@tabler/icons-react';
import { DataTable, DataTableColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { ClassWithInstructor, MemberStatus } from '@/types';
import { formatCurrency, formatPhone } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import dayjs from 'dayjs';

interface ClassDetailViewProps {
  classItem: ClassWithInstructor;
  members: any[]; // The enhanced member list
}

export function ClassDetailView({ classItem, members }: ClassDetailViewProps) {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Calculate stats
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === 'active').length;
  const frozenMembers = members.filter((m) => m.status === 'frozen').length;

  // Estimate monthly revenue (sum of custom_price or list_price for active members)
  const monthlyRevenue = members.reduce((sum, m) => {
    if (m.status !== 'active') return sum;
    const price = m.custom_price ?? m.list_price ?? 0;
    return sum + Number(price);
  }, 0);

  const columns: DataTableColumn<any>[] = [
    {
      key: 'first_name',
      label: 'Ad Soyad',
      sortable: true,
      searchable: true,
      render: (row) => (
        <Group gap="xs">
          <Text fw={500}>
            {row.first_name} {row.last_name}
          </Text>
        </Group>
      ),
    },
    {
      key: 'phone',
      label: 'Telefon',
      searchable: true,
      render: (row) => formatPhone(row.phone),
    },
    {
      key: 'enrollment_date',
      label: 'Kayıt Tarihi',
      sortable: true,
      render: (row) => formatDate(row.enrollment_date),
    },
    {
      key: 'next_payment_date',
      label: 'Sonraki Ödeme',
      sortable: true,
      render: (row) => {
        const date = row.next_payment_date
          ? dayjs(row.next_payment_date)
          : null;
        const isOverdue = date && date.isBefore(dayjs(), 'day');
        if (!date) return <Text c="dimmed">-</Text>;

        return (
          <Text c={isOverdue ? 'red' : undefined} fw={isOverdue ? 700 : 400}>
            {formatDate(row.next_payment_date)}
            {isOverdue && ' (Gecikmiş)'}
          </Text>
        );
      },
    },
    {
      key: 'enrollment_date',
      label: 'Kayıt Tarihi',
      sortable: true,
      render: (row) => formatDate(row.enrollment_date),
    },
    {
      key: 'first_payment_date',
      label: 'İlk Ödeme',
      sortable: true,
      render: (row) =>
        row.first_payment_date ? formatDate(row.first_payment_date) : '-',
    },
    {
      key: 'last_payment_date',
      label: 'Son Ödeme',
      sortable: true,
      render: (row) =>
        row.last_payment_date ? formatDate(row.last_payment_date) : '-',
    },
    {
      key: 'price',
      label: 'Ücret',
      render: (row) => formatCurrency(row.custom_price ?? row.list_price),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (row) => <StatusBadge status={row.status as MemberStatus} />,
    },
    {
      key: 'actions',
      label: '',
      width: 60,
      render: (row) => (
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" onClick={(e) => e.stopPropagation()}>
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEye size={16} />}
              onClick={() =>
                router.push(`/classes/${classItem.id}/enrollments/${row.id}`)
              }
            >
              Detay & Ödeme
            </Menu.Item>
            <Menu.Item
              leftSection={<IconUser size={16} />}
              onClick={() => router.push(`/members/${row.id}`)}
            >
              Genel Üye Profili
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ];

  return (
    <Stack gap="lg">
      <Group>
        <ActionIcon
          variant="light"
          size="lg"
          onClick={() => router.push('/classes')}
        >
          <IconArrowLeft size={20} />
        </ActionIcon>
        <div>
          <Title order={2}>{classItem.name}</Title>
          <Text c="dimmed">Sınıf detayları ve öğrenci listesi</Text>
        </div>
      </Group>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Toplam Kayıt
              </Text>
              <Text fw={700} size="xl">
                {totalMembers}
              </Text>
            </div>
            <ThemeIcon variant="light" size="xl" radius="md">
              <IconUsers size={24} />
            </ThemeIcon>
          </Group>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Aktif Öğrenci
              </Text>
              <Text fw={700} size="xl" c="green">
                {activeMembers}
              </Text>
            </div>
            <ThemeIcon variant="light" size="xl" radius="md" color="green">
              <IconUser size={24} />
            </ThemeIcon>
          </Group>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Dondurulmuş
              </Text>
              <Text fw={700} size="xl" c="blue">
                {frozenMembers}
              </Text>
            </div>
            <ThemeIcon variant="light" size="xl" radius="md" color="blue">
              <IconClock size={24} />
            </ThemeIcon>
          </Group>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                Aylık Potansiyel
              </Text>
              <Text fw={700} size="xl" c="orange">
                {formatCurrency(monthlyRevenue)}
              </Text>
            </div>
            <ThemeIcon variant="light" size="xl" radius="md" color="orange">
              <IconCurrencyLira size={24} />
            </ThemeIcon>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Info Card */}
      <Card withBorder padding="md" radius="md">
        <Group>
          <Badge size="lg" variant="dot">
            {classItem.day_of_week}
          </Badge>
          <Group gap="xs">
            <IconClock size={16} />
            <Text>
              {classItem.start_time?.toString().slice(0, 5)} (
              {classItem.duration_minutes} dk)
            </Text>
          </Group>
          <Divider orientation="vertical" />
          <Group gap="xs">
            <IconUser size={16} />
            <Text>
              {classItem.instructors
                ? `${classItem.instructors.first_name} ${classItem.instructors.last_name}`
                : 'Eğitmen Yok'}
            </Text>
          </Group>
        </Group>
      </Card>

      {/* Members Table */}
      <Card withBorder padding="sm" radius="md">
        <Title order={4} mb="md" px="xs" mt="xs">
          Öğrenci Listesi
        </Title>
        <DataTable
          data={members}
          columns={columns}
          onRowClick={(row) =>
            router.push(`/classes/${classItem.id}/enrollments/${row.id}`)
          }
        />
      </Card>
    </Stack>
  );
}

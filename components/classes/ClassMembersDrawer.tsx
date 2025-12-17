'use client';

import {
  Drawer,
  Stack,
  Group,
  ActionIcon,
  Title,
  Text,
  SimpleGrid,
  Card,
  ThemeIcon,
  Badge,
  Menu,
  Divider,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconX,
  IconUsers,
  IconUser,
  IconClock,
  IconCurrencyLira,
  IconEye,
  IconArrowRight,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { DataTable, DataTableColumn } from '@/components/shared/DataTable';
import { MemberStatus } from '@/types';
import { formatDate } from '@/utils/date-helpers';
import { formatCurrency } from '@/utils/formatters';

import { useEffect, useState, useCallback } from 'react';
import { getClassById, getClassMembers } from '@/actions/classes';
import { showError } from '@/utils/notifications';

interface ClassMembersDrawerProps {
  opened: boolean;
  onClose: () => void;
  classId: number | null;
}

export function ClassMembersDrawer({
  opened,
  onClose,
  classId,
}: ClassMembersDrawerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classItem, setClassItem] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const [classRes, membersRes] = await Promise.all([
        getClassById(classId),
        getClassMembers(classId),
      ]);

      if (classRes.data) setClassItem(classRes.data);
      if (membersRes.data) setMembers(membersRes.data);

      if (classRes.error) showError(classRes.error);
      if (membersRes.error) showError(membersRes.error);
    } catch (error) {
      console.error(error);
      showError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (opened && classId) {
      fetchData();
    } else {
      setMembers([]);
      setClassItem(null);
    }
  }, [opened, classId, fetchData]);

  // Derived stats
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.active_enrollment).length;
  const frozenMembers = members.filter((m) => m.status === 'frozen').length;
  const monthlyRevenue = members.reduce(
    (sum, m) =>
      sum + (m.active_enrollment ? (m.custom_price ?? m.list_price ?? 0) : 0),
    0
  );

  const columns: DataTableColumn<any>[] = [
    {
      key: 'first_name',
      label: 'Ad Soyad',
      sortable: true,
      searchable: true,
      render: (row) => (
        <Group gap="sm">
          <Text size="sm" fw={500}>
            {row.first_name} {row.last_name}
          </Text>
        </Group>
      ),
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
      render: (row) =>
        row.first_payment_date ? formatDate(row.first_payment_date) : '-',
    },
    {
      key: 'last_payment_date',
      label: 'Son Ödeme',
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
      render: (row) => (
        <Badge
          color={
            row.status === 'active'
              ? 'green'
              : row.status === 'frozen'
                ? 'blue'
                : 'gray'
          }
        >
          {row.status === 'active'
            ? 'Aktif'
            : row.status === 'frozen'
              ? 'Dondurulmuş'
              : 'Pasif'}
        </Badge>
      ),
    },
    {
      key: 'payment_status',
      label: '', // Payment Status Warning Icon
      width: 40,
      render: (row) => {
        // Simple overdue check
        const isOverdue =
          row.next_payment_date &&
          new Date(row.next_payment_date) < new Date() &&
          row.status === 'active'; // Only active members can be overdue

        if (isOverdue) {
          return (
            <ThemeIcon color="red" variant="transparent" title="Gecikmiş Ödeme">
              <IconAlertCircle size={18} />
            </ThemeIcon>
          );
        }
        return null;
      },
    },
    {
      key: 'actions',
      label: '',
      width: 60,
      render: (row) => (
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={() =>
            router.push(`/classes/${classId}/enrollments/${row.enrollment_id}`)
          }
        >
          <IconArrowRight size={16} />
        </ActionIcon>
      ),
    },
  ];

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="80%" // Wide drawer for datatable
      title={
        classItem ? (
          <Group>
            <Title order={3}>{classItem.name}</Title>
            <Badge size="lg" variant="dot">
              {classItem.day_of_week}
            </Badge>
          </Group>
        ) : (
          <Title order={3}>Sınıf Detayı</Title>
        )
      }
      padding="md"
    >
      {loading ? (
        <Center h={400}>
          <Loader />
        </Center>
      ) : !classItem ? (
        <Center h={200}>
          <Text>Sınıf bilgisi bulunamadı.</Text>
        </Center>
      ) : (
        <Stack gap="lg">
          {/* Info & Stats */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <Card withBorder padding="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    Toplam
                  </Text>
                  <Text fw={700} size="xl">
                    {totalMembers}
                  </Text>
                </div>
                <ThemeIcon variant="light" size="lg" radius="md">
                  <IconUsers size={20} />
                </ThemeIcon>
              </Group>
            </Card>
            <Card withBorder padding="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    Aktif
                  </Text>
                  <Text fw={700} size="xl" c="green">
                    {activeMembers}
                  </Text>
                </div>
                <ThemeIcon variant="light" size="lg" radius="md" color="green">
                  <IconUser size={20} />
                </ThemeIcon>
              </Group>
            </Card>
            <Card withBorder padding="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    Dondurulmuş
                  </Text>
                  <Text fw={700} size="xl" c="blue">
                    {frozenMembers}
                  </Text>
                </div>
                <ThemeIcon variant="light" size="lg" radius="md" color="blue">
                  <IconClock size={20} />
                </ThemeIcon>
              </Group>
            </Card>
            <Card withBorder padding="md" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    Gelir (Aylık)
                  </Text>
                  <Text fw={700} size="xl" c="orange">
                    {formatCurrency(monthlyRevenue)}
                  </Text>
                </div>
                <ThemeIcon variant="light" size="lg" radius="md" color="orange">
                  <IconCurrencyLira size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          </SimpleGrid>

          {/* Instructor Info */}
          <Card withBorder padding="xs" radius="md">
            <Group gap="xl">
              <Group gap="xs">
                <IconClock size={16} />
                <Text size="sm">
                  {classItem.start_time?.toString().slice(0, 5)} (
                  {classItem.duration_minutes} dk)
                </Text>
              </Group>
              <Divider orientation="vertical" />
              <Group gap="xs">
                <IconUser size={16} />
                <Text size="sm">
                  {classItem.instructors
                    ? `${classItem.instructors.first_name} ${classItem.instructors.last_name}`
                    : 'Eğitmen Yok'}
                </Text>
                {classItem.instructors?.default_commission_rate != null && (
                  <Badge variant="outline" color="gray" size="sm">
                    %{classItem.instructors.default_commission_rate} Komisyon
                  </Badge>
                )}
              </Group>
            </Group>
          </Card>

          {/* Members Table */}
          <div>
            <Title order={5} mb="sm">
              Öğrenci Listesi
            </Title>
            <DataTable
              data={members}
              columns={columns}
              onRowClick={(row) =>
                router.push(
                  `/classes/${classId}/enrollments/${row.enrollment_id}`
                )
              }
            />
          </div>
        </Stack>
      )}
    </Drawer>
  );
}

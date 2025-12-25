'use client';

import { useState, useEffect } from 'react';
import {
  Title,
  Button,
  Group,
  Stack,
  SegmentedControl,
  ActionIcon,
  Menu,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconCreditCard,
  IconRotateClockwise,
  IconAlertCircle,
  IconSnowflake,
} from '@tabler/icons-react';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { MemberDrawer } from '@/components/members/MemberDrawer';
// Removed MemberDetailModal
import { modals } from '@mantine/modals';
import { useMembers } from '@/hooks/use-members';
import {
  archiveMember,
  unarchiveMember,
  deleteMember,
  deleteMembers,
} from '@/actions/members';
import { showSuccess, showError } from '@/utils/notifications';
import { formatDate, isPaymentOverdue } from '@/utils/date-helpers';
import { formatPhone } from '@/utils/formatters';
import type { DataTableColumn } from '@/components/shared/DataTable';
import type { Member, MemberWithClasses, MemberStatus } from '@/types';
import dayjs from 'dayjs';

interface MembersContentProps {
  effectiveDate: string;
}

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// ... imports

export default function MembersContent({ effectiveDate }: MembersContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Read initial tab from URL or default to 'active'
  const initialTab = searchParams.get('tab') || 'active';
  const [statusFilter, setStatusFilter] = useState(initialTab);

  // Sync state with URL if URL changes externally (e.g. back button)
  useEffect(() => {
    const tab = searchParams.get('tab') || 'active';
    if (tab !== statusFilter) {
      setStatusFilter(tab);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setStatusFilter(val);
    setSelectedRows([]); // Clear selection on filter change

    // Update URL without full reload
    const params = new URLSearchParams(searchParams);
    params.set('tab', val);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const [drawerOpened, setDrawerOpened] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedRows, setSelectedRows] = useState<MemberWithClasses[]>([]);

  const handleDelete = (member: Member, e?: React.MouseEvent) => {
    e?.stopPropagation();
    modals.openConfirmModal({
      title: 'Üyeyi Kalıcı Sil',
      children: (
        <Text size="sm">
          {member.first_name} {member.last_name} ve tüm verileri kalıcı olarak
          silinecek. Bu işlem geri alınamaz!
        </Text>
      ),
      labels: { confirm: 'Kalıcı Sil', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const result = await deleteMember(member.id);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess('Üye kalıcı olarak silindi');
          setRefreshTrigger((prev) => prev + 1);
        }
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return;

    modals.openConfirmModal({
      title: 'Seçilenleri Kalıcı Sil',
      children: (
        <Text size="sm">
          Seçili {selectedRows.length} üye ve tüm verileri kalıcı olarak
          silinecek. Bu işlem geri alınamaz!
        </Text>
      ),
      labels: { confirm: 'Hepsini Sil', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const ids = selectedRows.map((m) => m.id);
        const result = await deleteMembers(ids);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess(`${ids.length} üye kalıcı olarak silindi`);
          setSelectedRows([]);
          setRefreshTrigger((prev) => prev + 1);
        }
      },
    });
  };

  const { members, loading, error } = useMembers(statusFilter, refreshTrigger);

  const handleEdit = (member: Member, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMember(member);
    setDrawerOpened(true);
  };

  const handleViewDetail = (member: Member) => {
    router.push(`/members/${member.id}`);
  };

  const handleArchive = (member: Member, e?: React.MouseEvent) => {
    e?.stopPropagation();
    modals.openConfirmModal({
      title: 'Üyeyi Arşivle',
      children: (
        <Text size="sm">
          {member.first_name} {member.last_name} arşivlensin mi?
        </Text>
      ),
      labels: { confirm: 'Arşivle', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const result = await archiveMember(member.id);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess('Üye arşivlendi');
          setRefreshTrigger((prev) => prev + 1);
        }
      },
    });
  };

  const handleUnarchive = (member: Member, e?: React.MouseEvent) => {
    e?.stopPropagation();
    modals.openConfirmModal({
      title: 'Üyeyi Geri Al',
      children: (
        <Text size="sm">
          {member.first_name} {member.last_name} arşivden geri alınsın mı?
        </Text>
      ),
      labels: { confirm: 'Geri Al', cancel: 'İptal' },
      onConfirm: async () => {
        const result = await unarchiveMember(member.id);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess('Üye geri alındı');
          setRefreshTrigger((prev) => prev + 1);
        }
      },
    });
  };

  const handleAddNew = () => {
    setSelectedMember(null);
    setDrawerOpened(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpened(false);
    setSelectedMember(null);
  };

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Force refresh when trigger changes
  useEffect(() => {
    // This will trigger useMembers to refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const columns: DataTableColumn<MemberWithClasses>[] = [
    {
      key: 'first_name',
      label: 'Ad Soyad',
      sortable: true,
      searchable: true,
      render: (member: any) => {
        // Check if any active and non-frozen enrollment has overdue payment
        const hasOverdue = member.member_classes?.some((mc: any) => {
          if (!mc.active || !mc.next_payment_date) return false;

          // Don't show overdue for frozen enrollments
          // Note: frozen_logs should be populated by the hook
          const isFrozen = mc.frozen_logs?.some((log: any) => !log.end_date);
          if (isFrozen) return false;

          // Check if next payment date is before today
          const nextPayment = dayjs(mc.next_payment_date).startOf('day');
          const today = dayjs(effectiveDate).startOf('day');
          return nextPayment.isBefore(today);
        });

        // Check if any active enrollment is currently FROZEN
        const frozenClasses = member.member_classes
          ?.filter((mc: any) => {
            if (!mc.active) return false;
            // Check if there is an open frozen log (no end_date) or ends in future
            return mc.frozen_logs?.some((log: any) => {
              if (!log.end_date) return true; // Indefinite
              return dayjs(log.end_date).isAfter(dayjs(effectiveDate));
            });
          })
          .map((mc: any) => mc.classes?.name);

        const isFrozen = frozenClasses && frozenClasses.length > 0;

        return (
          <Group gap="xs">
            <Text fw={500}>
              {member.first_name} {member.last_name}
            </Text>
            {hasOverdue && (
              <Tooltip label="Gecikmiş Ödeme" withArrow>
                <IconAlertCircle size={18} color="var(--mantine-color-red-6)" />
              </Tooltip>
            )}
            {isFrozen && (
              <Tooltip
                label={`Dondurulmuş Dersler: ${frozenClasses.join(', ')}`}
                withArrow
              >
                <IconSnowflake size={18} color="var(--mantine-color-blue-4)" />
              </Tooltip>
            )}
          </Group>
        );
      },
    },
    {
      key: 'phone',
      label: 'Telefon',
      searchable: true,
      render: (member) => formatPhone(member.phone),
    },
    {
      key: 'join_date',
      label: 'Oluşturulma Tarihi',
      sortable: true,
      render: (member) => formatDate(member.join_date),
    },
    {
      key: 'classes',
      label: 'Dersler',
      render: (member) => {
        const activeClasses =
          member.member_classes?.filter((mc) => mc.active) || [];

        if (activeClasses.length === 0) {
          return (
            <Text size="sm" c="dimmed">
              -
            </Text>
          );
        }

        const classNames = activeClasses
          .map((mc) => mc.classes?.name || '-')
          .join(', ');

        // If there are more than 2 classes or the text is too long, use tooltip
        if (activeClasses.length > 2 || classNames.length > 40) {
          const fullList = activeClasses
            .map((mc) => mc.classes?.name || '-')
            .join(', ');

          return (
            <Tooltip label={fullList} withArrow multiline w={300}>
              <Text size="sm" style={{ cursor: 'help' }}>
                {activeClasses.length} ders
              </Text>
            </Tooltip>
          );
        }

        return <Text size="sm">{classNames}</Text>;
      },
    },

    {
      key: 'status',
      label: 'Durum',
      render: (member: any) => (
        <StatusBadge
          status={(member.computed_status || member.status) as MemberStatus}
        />
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 60,
      render: (member) => (
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" onClick={(e) => e.stopPropagation()}>
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEdit size={16} />}
              onClick={(e) => handleEdit(member, e)}
            >
              Düzenle
            </Menu.Item>
            <Menu.Item
              leftSection={<IconCreditCard size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetail(member);
              }}
            >
              Ödeme Al
            </Menu.Item>
            <Menu.Divider />
            {member.status === 'archived' ? (
              <Menu.Item
                leftSection={<IconRotateClockwise size={16} />}
                color="blue"
                onClick={(e) => handleUnarchive(member, e)}
              >
                Geri Al
              </Menu.Item>
            ) : (
              <Menu.Item
                leftSection={<IconTrash size={16} />}
                color="red"
                onClick={(e) => handleArchive(member, e)}
              >
                Arşivle
              </Menu.Item>
            )}
            {member.status === 'archived' && (
              <>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconTrash size={16} />}
                  color="red"
                  onClick={(e) => handleDelete(member, e)}
                >
                  Kalıcı Sil
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ];

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={1}>Üyeler</Title>
          <Text c="dimmed">Üye listesini yönetin</Text>
        </div>
        <Group>
          {statusFilter === 'archived' && selectedRows.length > 0 && (
            <Button
              color="red"
              variant="light"
              leftSection={<IconTrash size={16} />}
              onClick={handleBulkDelete}
            >
              Seçilenleri Sil ({selectedRows.length})
            </Button>
          )}
          <Button leftSection={<IconPlus size={16} />} onClick={handleAddNew}>
            Yeni Üye
          </Button>
        </Group>
      </Group>

      {/* Data Table */}
      {error ? (
        <EmptyState
          title="Hata"
          description={error}
          icon={<IconTrash size={64} />}
        />
      ) : (
        <DataTable
          data={members}
          columns={columns}
          loading={loading}
          enableSelection={statusFilter === 'archived'}
          onSelectionChange={(rows) =>
            setSelectedRows(rows as MemberWithClasses[])
          }
          emptyText={
            statusFilter === 'archived'
              ? 'Arşivlenmiş üye bulunmamaktadır.'
              : statusFilter === 'active'
                ? 'Aktif üye bulunmamaktadır.'
                : 'Üye bulunamadı.'
          }
          pageSize={10}
          onRowClick={(member) => handleViewDetail(member)}
          filters={
            <SegmentedControl
              value={statusFilter}
              onChange={handleTabChange}
              data={[
                { label: 'Aktif', value: 'active' },
                { label: 'Dondurulmuş', value: 'frozen' },
                { label: 'Arşiv', value: 'archived' },
                { label: 'Tümü', value: 'all' },
              ]}
            />
          }
        />
      )}

      {/* Member Drawer */}
      <MemberDrawer
        opened={drawerOpened}
        onClose={handleDrawerClose}
        member={selectedMember}
        onSuccess={handleSuccess}
      />
    </Stack>
  );
}

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
  IconSnowflake,
  IconCreditCard,
  IconPlayerPlay,
  IconRotateClockwise,
  IconAlertCircle,
} from '@tabler/icons-react';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { MemberDrawer } from '@/components/members/MemberDrawer';
import { FreezeMemberDrawer } from '@/components/members/FreezeMemberDrawer';
// Removed MemberDetailModal
import { modals } from '@mantine/modals';
import { useMembers } from '@/hooks/use-members';
import { useClasses } from '@/hooks/use-classes';
import {
  archiveMember,
  unarchiveMember,
  deleteMember,
  deleteMembers,
} from '@/actions/members';
import { unfreezeMembership } from '@/actions/freeze';
import { showSuccess, showError } from '@/utils/notifications';
import { formatDate, isPaymentOverdue } from '@/utils/date-helpers';
import { formatPhone } from '@/utils/formatters';
import type { DataTableColumn } from '@/components/shared/DataTable';
import type { Member, MemberWithClasses } from '@/types';

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

  // ... existing code ...

  // Replace SegmentedControl onChange
  <SegmentedControl
    value={statusFilter}
    onChange={handleTabChange}
    data={[
      { label: 'Aktif', value: 'active' },
      { label: 'Dondurulmuş', value: 'frozen' },
      { label: 'Arşiv', value: 'archived' },
      { label: 'Tümü', value: 'all' },
    ]}
  />;
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [freezeDrawerOpened, setFreezeDrawerOpened] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedRows, setSelectedRows] = useState<MemberWithClasses[]>([]);

  // ... existing handlers ...

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
  const { classes } = useClasses();

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

  const handleFreeze = (member: Member, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedMember(member);
    setFreezeDrawerOpened(true);
  };

  const handleUnfreeze = (member: Member, e?: React.MouseEvent) => {
    e?.stopPropagation();
    modals.openConfirmModal({
      title: 'Üyeliği Aktifleştir',
      children: (
        <Text size="sm">{member.first_name} üyeliği aktifleştirilsin mi?</Text>
      ),
      labels: { confirm: 'Aktifleştir', cancel: 'İptal' },
      onConfirm: async () => {
        const result = await unfreezeMembership(member.id);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess('Üyelik aktifleştirildi');
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
      render: (member) => {
        // Check for overdue payments using simulated effectiveDate
        const overdue = member.member_classes?.some((mc) => {
          if (!mc.active || !mc.next_payment_date) return false;
          return isPaymentOverdue(mc.next_payment_date, effectiveDate);
        });

        return (
          <Group gap="xs">
            <Text fw={500}>
              {member.first_name} {member.last_name}
            </Text>
            {overdue && (
              <Tooltip label="Gecikmiş Ödeme" withArrow>
                <IconAlertCircle size={18} color="var(--mantine-color-red-6)" />
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
      label: 'Kayıt Tarihi',
      sortable: true,
      render: (member) => formatDate(member.join_date),
    },
    {
      key: 'membership_duration',
      label: 'Üyelik Süresi',
      render: (member) => {
        const activeClasses =
          member.member_classes?.filter((mc) => mc.active) || [];
        return (
          <Stack gap={2}>
            {activeClasses.map((mc) => (
              <Text size="xs" key={mc.id} style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600 }}>{mc.classes?.name}:</span>{' '}
                {mc.payment_interval ? `${mc.payment_interval} Ay` : 'Aylık'}
              </Text>
            ))}
            {activeClasses.length === 0 && (
              <Text size="xs" c="dimmed">
                -
              </Text>
            )}
          </Stack>
        );
      },
    },
    {
      key: 'status',
      label: 'Durum',
      render: (member) => <StatusBadge status={member.status as any} />,
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
            {member.status === 'frozen' ? (
              <Menu.Item
                leftSection={<IconPlayerPlay size={16} />}
                onClick={(e) => handleUnfreeze(member, e)}
              >
                Aktifleştir
              </Menu.Item>
            ) : (
              <Menu.Item
                leftSection={<IconSnowflake size={16} />}
                onClick={(e) => handleFreeze(member, e)}
              >
                Dondur
              </Menu.Item>
            )}
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
              : statusFilter === 'frozen'
                ? 'Dondurulmuş statüde üye bulunmamaktadır.'
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
        classes={classes}
        onSuccess={handleSuccess}
      />

      <FreezeMemberDrawer
        opened={freezeDrawerOpened}
        onClose={() => setFreezeDrawerOpened(false)}
        member={selectedMember}
        onSuccess={handleSuccess}
      />
    </Stack>
  );
}

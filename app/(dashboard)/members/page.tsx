/**
 * Members Page
 * Member management with DataTable and Drawer
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Title,
  Button,
  Group,
  Stack,
  SegmentedControl,
  ActionIcon,
  Menu,
  Text,
} from '@mantine/core'
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconSnowflake,
  IconCreditCard,
  IconPlayerPlay,
  IconRotateClockwise,
} from '@tabler/icons-react'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { MemberDrawer } from '@/components/members/MemberDrawer'
import { FreezeMemberDrawer } from '@/components/members/FreezeMemberDrawer'
import { modals } from '@mantine/modals'
import { useMembers } from '@/hooks/use-members'
import { useClasses } from '@/hooks/use-classes'
import { archiveMember, unarchiveMember } from '@/actions/members'
import { unfreezeMembership } from '@/actions/freeze'
import { showSuccess, showError } from '@/utils/notifications'
import { formatDate, isPaymentOverdue } from '@/utils/date-helpers'
import { formatPhone } from '@/utils/formatters'
import type { DataTableColumn } from '@/components/shared/DataTable'
import type { Member } from '@/types'

export default function MembersPage() {
  const [statusFilter, setStatusFilter] = useState('active')
  const [drawerOpened, setDrawerOpened] = useState(false)
  const [freezeDrawerOpened, setFreezeDrawerOpened] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { members, loading, error } = useMembers(statusFilter, refreshTrigger)
  const { classes } = useClasses()


  const handleEdit = (member: Member) => {
    setSelectedMember(member)
    setDrawerOpened(true)
  }

  const handleArchive = (member: Member, e?: React.MouseEvent) => {
    e?.stopPropagation()
    modals.openConfirmModal({
      title: 'Üyeyi Arşivle',
      children: <Text size="sm">{member.first_name} {member.last_name} arşivlensin mi?</Text>,
      labels: { confirm: 'Arşivle', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const result = await archiveMember(member.id)
        if (result.error) {
          showError(result.error)
        } else {
          showSuccess('Üye arşivlendi')
          setRefreshTrigger((prev) => prev + 1)
        }
      },
    })
  }

  const handleUnarchive = (member: Member, e?: React.MouseEvent) => {
    e?.stopPropagation()
    modals.openConfirmModal({
      title: 'Üyeyi Geri Al',
      children: <Text size="sm">{member.first_name} {member.last_name} arşivden geri alınsın mı?</Text>,
      labels: { confirm: 'Geri Al', cancel: 'İptal' },
      onConfirm: async () => {
        const result = await unarchiveMember(member.id)
        if (result.error) {
          showError(result.error)
        } else {
          showSuccess('Üye geri alındı')
          setRefreshTrigger((prev) => prev + 1)
        }
      },
    })
  }

  const handleFreeze = (member: Member, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedMember(member)
    setFreezeDrawerOpened(true)
  }

  const handleUnfreeze = (member: Member, e?: React.MouseEvent) => {
    e?.stopPropagation()
    modals.openConfirmModal({
      title: 'Üyeliği Aktifleştir',
      children: <Text size="sm">{member.first_name} üyeliği aktifleştirilsin mi?</Text>,
      labels: { confirm: 'Aktifleştir', cancel: 'İptal' },
      onConfirm: async () => {
        const result = await unfreezeMembership(member.id)
        if (result.error) {
          showError(result.error)
        } else {
          showSuccess('Üyelik aktifleştirildi')
          setRefreshTrigger((prev) => prev + 1)
        }
      },
    })
  }

  const handleAddNew = () => {
    setSelectedMember(null)
    setDrawerOpened(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpened(false)
    setSelectedMember(null)
  }

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  // Force refresh when trigger changes
  useEffect(() => {
    // This will trigger useMembers to refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const columns: DataTableColumn<Member>[] = [
    {
      key: 'first_name',
      label: 'Ad Soyad',
      sortable: true,
      searchable: true,
      render: (member) => (
        <Text fw={500}>
          {member.first_name} {member.last_name}
        </Text>
      ),
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
      key: 'next_payment_due_date',
      label: 'Sonraki Ödeme',
      sortable: true,
      render: (member) => {
        const isOverdue = isPaymentOverdue(member.next_payment_due_date)
        return (
          <Group gap="xs">
            {formatDate(member.next_payment_due_date)}
            {isOverdue && <StatusBadge status="overdue" size="xs" />}
          </Group>
        )
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
              onClick={() => handleEdit(member)}
            >
              Düzenle
            </Menu.Item>
            <Menu.Item
              leftSection={<IconCreditCard size={16} />}
              onClick={() => console.log('Add payment', member)}
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
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ]

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={1}>Üyeler</Title>
          <Text c="dimmed">Üye listesini yönetin</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handleAddNew}>
          Yeni Üye
        </Button>
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
          onRowClick={(member) => handleEdit(member)}
          filters={
            <SegmentedControl
              value={statusFilter}
              onChange={setStatusFilter}
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
  )
}

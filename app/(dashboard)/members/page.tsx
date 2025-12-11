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
} from '@tabler/icons-react'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { MemberDrawer } from '@/components/members/MemberDrawer'
import { useMembers } from '@/hooks/use-members'
import { useClasses } from '@/hooks/use-classes'
import { archiveMember } from '@/actions/members'
import { showSuccess, showError } from '@/utils/notifications'
import { formatDate, isPaymentOverdue } from '@/utils/date-helpers'
import { formatPhone } from '@/utils/formatters'
import type { DataTableColumn } from '@/components/shared/DataTable'
import type { Member } from '@/types'

export default function MembersPage() {
  const [statusFilter, setStatusFilter] = useState('active')
  const [drawerOpened, setDrawerOpened] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { members, loading, error } = useMembers(statusFilter)
  const { classes } = useClasses()


  const handleEdit = (member: Member) => {
    setSelectedMember(member)
    setDrawerOpened(true)
  }

  const handleArchive = async (member: Member) => {
    if (confirm(`${member.first_name} ${member.last_name} arşivlensin mi?`)) {
      const result = await archiveMember(member.id)
      if (result.error) {
        showError(result.error)
      } else {
        showSuccess('Üye arşivlendi')
        setRefreshTrigger((prev) => prev + 1)
      }
    }
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
            <Menu.Item
              leftSection={<IconSnowflake size={16} />}
              onClick={() => console.log('Freeze', member)}
            >
              Dondur
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconTrash size={16} />}
              color="red"
              onClick={() => handleArchive(member)}
            >
              Arşivle
            </Menu.Item>
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

      {/* Status Filter */}
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

      {/* Data Table */}
      {error ? (
        <EmptyState
          title="Hata"
          description={error}
          icon={<IconTrash size={64} />}
        />
      ) : members.length === 0 && !loading ? (
        <EmptyState
          title="Henüz üye yok"
          description="İlk üyenizi ekleyerek başlayın"
          actionLabel="Yeni Üye Ekle"
          onAction={handleAddNew}
        />
      ) : (
        <DataTable
          data={members}
          columns={columns}
          loading={loading}
          emptyText="Üye bulunamadı"
          pageSize={10}
          onRowClick={(member) => handleEdit(member)}
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
    </Stack>
  )
}

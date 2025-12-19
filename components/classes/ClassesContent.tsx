'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Button,
  Group,
  Card,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Stack,
  SegmentedControl,
} from '@mantine/core';
import { useEffect } from 'react';
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconInfoCircle,
  IconDotsVertical,
  IconPower,
  IconRotateClockwise,
} from '@tabler/icons-react';
import { ClassDrawer } from './ClassDrawer';
import { ClassMembersDrawer } from './ClassMembersDrawer';
import { ClassWithInstructor, Instructor, Class, DanceType } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTable, DataTableColumn } from '@/components/shared/DataTable';
import { useDisclosure } from '@mantine/hooks';
import {
  deactivateClass,
  deleteClass,
  deleteClasses,
  unarchiveClass,
} from '@/actions/classes';
import { showSuccess, showError } from '@/utils/notifications';
import { formatCurrency } from '@/utils/formatters';
import { modals } from '@mantine/modals';

interface ClassesContentProps {
  initialClasses: ClassWithInstructor[];
  instructors: Instructor[];
  danceTypes: DanceType[];
}

export function ClassesContent({
  initialClasses,
  instructors,
  danceTypes,
}: ClassesContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [opened, { open, close }] = useDisclosure(false);

  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<ClassWithInstructor[]>([]);

  // Status filter
  const initialTab = searchParams.get('tab') || 'active';
  const [statusFilter, setStatusFilter] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'active';
    if (tab !== statusFilter) {
      setStatusFilter(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const openDrawerId = searchParams.get('openDrawer');
    if (openDrawerId) {
      const classId = parseInt(openDrawerId);
      if (!isNaN(classId)) {
        setSelectedClassId(classId);
      }
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setStatusFilter(val);
    setSelectedRows([]);

    const params = new URLSearchParams(searchParams);
    params.set('tab', val);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  const handleEdit = (item: Class) => {
    setEditingClass(item);
    open();
  };

  const handleAdd = () => {
    setEditingClass(null);
    open();
  };

  const handleViewMembers = (item: Class) => {
    setSelectedClassId(item.id);
  };

  const handleArchive = (classItem: Class, e?: React.MouseEvent) => {
    e?.stopPropagation();
    modals.openConfirmModal({
      title: 'Dersi Arşivle',
      children: (
        <Text size="sm">
          {classItem.name} dersini arşivlemek istediğinize emin misiniz? Bu
          derse kayıtlı tüm üyelerin kayıtları pasif olacak.
        </Text>
      ),
      labels: { confirm: 'Arşivle', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const res = await deactivateClass(classItem.id);
        if (res.error) showError(res.error);
        else {
          showSuccess('Ders arşivlendi');
          router.refresh();
        }
      },
    });
  };

  const handleUnarchive = (classItem: Class, e?: React.MouseEvent) => {
    e?.stopPropagation();
    modals.openConfirmModal({
      title: 'Dersi Geri Al',
      children: (
        <Text size="sm">
          {classItem.name} dersini arşivden geri almak istediğinize emin
          misiniz? (Not: Üye kayıtları otomatik aktif olmaz, manuel olarak
          eklemeniz gerekir)
        </Text>
      ),
      labels: { confirm: 'Geri Al', cancel: 'İptal' },
      onConfirm: async () => {
        const res = await unarchiveClass(classItem.id);
        if (res.error) showError(res.error);
        else {
          showSuccess('Ders geri alındı');
          router.refresh();
        }
      },
    });
  };

  const handlePermanentDelete = (classItem: Class, e?: React.MouseEvent) => {
    e?.stopPropagation();
    modals.openConfirmModal({
      title: 'Dersi Kalıcı Sil',
      children: (
        <Text size="sm">
          {classItem.name} ve tüm verileri kalıcı olarak silinecek. Bu işlem
          geri alınamaz!
        </Text>
      ),
      labels: { confirm: 'Kalıcı Sil', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const res = await deleteClass(classItem.id);
        if (res.error) showError(res.error);
        else {
          showSuccess('Ders kalıcı olarak silindi');
          router.refresh();
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
          Seçili {selectedRows.length} ders ve tüm verileri kalıcı olarak
          silinecek. Bu işlem geri alınamaz!
        </Text>
      ),
      labels: { confirm: 'Hepsini Sil', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const ids = selectedRows.map((c) => c.id);
        const result = await deleteClasses(ids);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess(`${ids.length} ders kalıcı olarak silindi`);
          setSelectedRows([]);
          router.refresh();
        }
      },
    });
  };

  const columns: DataTableColumn<ClassWithInstructor>[] = [
    {
      key: 'name',
      label: 'Ders Adı',
      sortable: true,
      searchable: true,
      render: (row) => <Text fw={500}>{row.name}</Text>,
    },
    {
      key: 'day_of_week',
      label: 'Gün',
      sortable: true,
      render: (row) => (
        <Badge variant="dot" color="blue">
          {row.day_of_week}
        </Badge>
      ),
    },
    {
      key: 'start_time',
      label: 'Saat',
      sortable: true,
      render: (row) => <Text>{row.start_time?.toString().slice(0, 5)}</Text>,
    },
    {
      key: 'duration_minutes',
      label: 'Süre',
      render: (row) => <Text>{row.duration_minutes} dk</Text>,
    },
    {
      key: 'instructor',
      label: 'Eğitmen',
      searchable: true,
      render: (row) => (
        <Text>
          {row.instructors
            ? `${row.instructors.first_name} ${row.instructors.last_name}`
            : 'Eğitmen Yok'}
        </Text>
      ),
    },
    {
      key: 'price_monthly',
      label: 'Liste Fiyatı',
      sortable: true,
      render: (row) => (
        <Text fw={500} c="orange">
          {row.price_monthly ? formatCurrency(Number(row.price_monthly)) : '-'}
        </Text>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 100,
      render: (classItem) => {
        const isArchived = !classItem.active;

        return (
          <Group gap="xs" justify="flex-end">
            {/* Info Button - Opens Drawer */}
            <ActionIcon
              variant="light"
              color="blue"
              onClick={(e) => {
                e.stopPropagation();
                handleViewMembers(classItem);
              }}
              title="Sınıf Detayı ve Öğrenciler"
            >
              <IconInfoCircle size={18} />
            </ActionIcon>

            {/* Edit Button - Disabled for archived */}
            {!isArchived && (
              <ActionIcon
                variant="light"
                color="orange"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(classItem);
                }}
                title="Düzenle"
              >
                <IconEdit size={18} />
              </ActionIcon>
            )}

            {/* Menu for actions */}
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon
                  variant="light"
                  color="gray"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconDotsVertical size={18} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {isArchived ? (
                  <>
                    {/* Unarchive */}
                    <Menu.Item
                      leftSection={<IconRotateClockwise size={16} />}
                      color="blue"
                      onClick={(e) => handleUnarchive(classItem, e)}
                    >
                      Geri Al
                    </Menu.Item>
                    <Menu.Divider />
                    {/* Permanent Delete */}
                    <Menu.Item
                      leftSection={<IconTrash size={16} />}
                      color="red"
                      onClick={(e) => handlePermanentDelete(classItem, e)}
                    >
                      Kalıcı Sil
                    </Menu.Item>
                  </>
                ) : (
                  <>
                    {/* Archive */}
                    <Menu.Item
                      leftSection={<IconPower size={16} />}
                      color="red"
                      onClick={(e) => handleArchive(classItem, e)}
                    >
                      Arşivle
                    </Menu.Item>
                  </>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        );
      },
    },
  ];

  // Filter classes by status
  const filteredClasses = initialClasses.filter((classItem) => {
    if (statusFilter === 'archived') {
      return !classItem.active;
    } else if (statusFilter === 'active') {
      return classItem.active;
    }
    return true; // 'all'
  });

  return (
    <>
      <Stack>
        <Group justify="space-between">
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
            <Button leftSection={<IconPlus size={20} />} onClick={handleAdd}>
              Yeni Ders
            </Button>
          </Group>
        </Group>

        {filteredClasses.length === 0 ? (
          <EmptyState
            title="Ders Bulunamadı"
            description={
              statusFilter === 'archived'
                ? 'Arşivlenmiş ders bulunmamaktadır.'
                : statusFilter === 'active'
                  ? 'Aktif ders bulunmamaktadır.'
                  : 'Henüz tanımlanmış bir ders programı yok.'
            }
            action={
              statusFilter === 'active' ? (
                <Button variant="light" onClick={handleAdd}>
                  İlk Dersi Ekle
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Card withBorder padding="sm" radius="md">
            <DataTable
              data={filteredClasses}
              columns={columns}
              searchable
              searchKeys={[
                'name',
                'instructors.first_name',
                'instructors.last_name',
              ]}
              enableSelection={statusFilter === 'archived'}
              onSelectionChange={(rows) =>
                setSelectedRows(rows as ClassWithInstructor[])
              }
              onRowClick={(row) => handleViewMembers(row)}
              filters={
                <SegmentedControl
                  value={statusFilter}
                  onChange={handleTabChange}
                  data={[
                    { label: 'Aktif', value: 'active' },
                    { label: 'Arşiv', value: 'archived' },
                    { label: 'Tümü', value: 'all' },
                  ]}
                />
              }
            />
          </Card>
        )}
      </Stack>

      <ClassDrawer
        opened={opened}
        onClose={close}
        classItem={editingClass}
        instructors={instructors}
        danceTypes={danceTypes}
        onSuccess={handleSuccess}
      />

      <ClassMembersDrawer
        opened={!!selectedClassId}
        onClose={() => setSelectedClassId(null)}
        classId={selectedClassId}
      />
    </>
  );
}

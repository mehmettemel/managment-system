'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Group,
  Card,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Stack,
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
  IconCopy,
  IconPower,
} from '@tabler/icons-react';
import { ClassDrawer } from './ClassDrawer';
import { ClassMembersDrawer } from './ClassMembersDrawer';
import { ClassMigrateModal } from './ClassMigrateModal';
import { ClassWithInstructor, Instructor, Class, DanceType } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTable, DataTableColumn } from '@/components/shared/DataTable';
import { useDisclosure } from '@mantine/hooks';
import { deactivateClass, bulkMigrateClass } from '@/actions/classes';
import { showSuccess, showError } from '@/utils/notifications';
import { formatCurrency } from '@/utils/formatters';

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
  const [opened, { open, close }] = useDisclosure(false);

  const [migrateOpen, { open: openMigrate, close: closeMigrate }] =
    useDisclosure(false); // Migration Modal

  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const openDrawerId = searchParams.get('openDrawer');
    if (openDrawerId) {
      const classId = parseInt(openDrawerId);
      if (!isNaN(classId)) {
        setSelectedClassId(classId);
      }
    }
  }, [searchParams]);

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

  const handleMigrateClick = (classItem: Class) => {
    setEditingClass(classItem);
    openMigrate();
  };

  const onMigrateConfirm = async (targetClassId: number) => {
    if (!editingClass) return;

    setLoading(true);
    const result = await bulkMigrateClass(editingClass.id, targetClassId);

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess(
        `${result.data?.migratedCount} üye taşındı ve sınıf arşivlendi.`
      );
      closeMigrate();
      setEditingClass(null);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (
      confirm(
        'Bu dersi silmek istediğinize emin misiniz? (Üyeler silinmez, sadece ders pasife alınır)'
      )
    ) {
      const res = await deactivateClass(id);
      if (res.error) showError(res.error);
      else showSuccess('Ders silindi (Arşivlendi)');
    }
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
      width: 100, // Reduced width since we removed one button
      render: (classItem) => (
        <Group gap="xs" justify="flex-end">
          {/* Info Button - Opens Drawer */}
          <ActionIcon
            variant="light"
            color="blue"
            onClick={(e) => {
              e.stopPropagation();
              handleViewMembers(classItem);
            }} // Added stopPropagation
            title="Sınıf Detayı ve Öğrenciler"
          >
            <IconInfoCircle size={18} />
          </ActionIcon>

          {/* Edit Button */}
          <ActionIcon
            variant="light"
            color="orange"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(classItem);
            }} // Added stopPropagation
            title="Düzenle"
          >
            <IconEdit size={18} />
          </ActionIcon>

          {/* Menu for less common actions */}
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon
                variant="light"
                color="gray"
                onClick={(e) => e.stopPropagation()}
              >
                {' '}
                {/* Added stopPropagation */}
                <IconDotsVertical size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {/* Duplicate */}
              <Menu.Item
                leftSection={<IconCopy size={16} />}
                onClick={(e) => {
                  e.stopPropagation(); // Added stopPropagation
                  handleMigrateClick(classItem); // Use existing handler
                }}
              >
                Taşı ve Arşivle
              </Menu.Item>

              {/* Deactivate */}
              <Menu.Item
                leftSection={<IconPower size={16} />}
                color="red"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(classItem.id);
                }} // Use existing handler
              >
                Sil (Sadece Arşivle)
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      ),
    },
  ];

  return (
    <>
      <Stack>
        {' '}
        {/* Wrapped content in Stack */}
        <Group justify="space-between">
          {' '}
          {/* Updated justify */}
          <Button leftSection={<IconPlus size={20} />} onClick={handleAdd}>
            Yeni Ders
          </Button>
        </Group>
        {initialClasses.length === 0 ? (
          <EmptyState
            title="Ders Bulunamadı"
            description="Henüz tanımlanmış bir ders programı yok."
            action={
              <Button variant="light" onClick={handleAdd}>
                İlk Dersi Ekle
              </Button>
            }
          />
        ) : (
          <Card withBorder padding="sm" radius="md">
            <DataTable
              data={initialClasses}
              columns={columns}
              searchable // Added searchable
              searchKeys={[
                'name',
                'instructors.first_name',
                'instructors.last_name',
              ]} // Added searchKeys
              onRowClick={(row) => handleViewMembers(row)}
            />
          </Card>
        )}
      </Stack>

      <ClassDrawer
        opened={opened}
        onClose={close}
        classItem={editingClass} // Used editingClass
        instructors={instructors}
        danceTypes={danceTypes}
        onSuccess={handleSuccess}
      />

      {/* Migrate Modal */}
      {editingClass && (
        <ClassMigrateModal
          opened={migrateOpen}
          onClose={closeMigrate}
          sourceClass={editingClass as ClassWithInstructor} // Used editingClass
          classes={initialClasses}
          onConfirm={onMigrateConfirm}
          loading={loading}
        />
      )}

      <ClassMembersDrawer
        opened={!!selectedClassId}
        onClose={() => setSelectedClassId(null)}
        classId={selectedClassId}
      />
    </>
  );
}

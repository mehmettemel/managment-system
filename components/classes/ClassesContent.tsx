'use client';

import { useState } from 'react';
import {
  Button,
  Group,
  Card,
  Text,
  Badge,
  ActionIcon,
  SimpleGrid,
  Menu,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import {
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconClock,
  IconCalendar,
  IconUser,
  IconUsers,
  IconArrowsRight,
} from '@tabler/icons-react';
import { ClassDrawer } from './ClassDrawer';
import { ClassMembersDrawer } from './ClassMembersDrawer';
import { ClassMigrateModal } from './ClassMigrateModal';
import { ClassWithInstructor, Instructor, Class, DanceType } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
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
  const [opened, { open, close }] = useDisclosure(false);
  const [membersDrawerOpen, { open: openMembers, close: closeMembers }] =
    useDisclosure(false);
  const [migrateOpen, { open: openMigrate, close: closeMigrate }] =
    useDisclosure(false); // Migration Modal

  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEdit = (item: Class) => {
    setSelectedClass(item);
    open();
  };

  const handleAdd = () => {
    setSelectedClass(null);
    open();
  };

  const handleViewMembers = (item: Class) => {
    setSelectedClass(item);
    openMembers();
  };

  const handleMigrateClick = (item: Class) => {
    setSelectedClass(item);
    openMigrate();
  };

  const onMigrateConfirm = async (targetClassId: number) => {
    if (!selectedClass) return;

    setLoading(true);
    const result = await bulkMigrateClass(selectedClass.id, targetClassId);

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess(
        `${result.data?.migratedCount} üye taşındı ve sınıf arşivlendi.`
      );
      closeMigrate();
      setSelectedClass(null);
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

  return (
    <>
      <Group justify="flex-end">
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
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {initialClasses.map((item) => (
            <Card key={item.id} withBorder padding="lg" radius="md">
              <Group justify="space-between" mb="sm">
                <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                  <IconCalendar size={24} />
                </ThemeIcon>
                <Menu withinPortal position="bottom-end" shadow="sm">
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray">
                      <IconDotsVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconEdit size={14} />}
                      onClick={() => handleEdit(item)}
                    >
                      Düzenle
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconArrowsRight size={14} />}
                      onClick={() => handleMigrateClick(item)}
                    >
                      Taşı ve Arşivle
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      leftSection={<IconTrash size={14} />}
                      color="red"
                      onClick={() => handleDelete(item.id)}
                    >
                      Sil (Sadece Arşivle)
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              <Text fw={700} size="lg">
                {item.name}
              </Text>

              <Group gap="xs" mt="xs">
                <Badge variant="dot" color="blue">
                  {item.day_of_week}
                </Badge>
                <Badge
                  variant="outline"
                  color="gray"
                  leftSection={<IconClock size={12} />}
                >
                  {item.start_time?.toString().slice(0, 5)}
                </Badge>
              </Group>

              <Group mt="md" justify="space-between">
                <Group gap={8}>
                  <IconUser size={16} style={{ opacity: 0.7 }} />
                  <Text size="sm" c="dimmed">
                    {item.instructors
                      ? `${item.instructors.first_name} ${item.instructors.last_name}`
                      : 'Eğitmen Yok'}
                  </Text>
                </Group>

                {item.price_monthly && (
                  <Text fw={700} c="orange">
                    {formatCurrency(Number(item.price_monthly))}
                  </Text>
                )}
              </Group>

              <Button
                variant="light"
                color="blue"
                fullWidth
                mt="md"
                leftSection={<IconUsers size={16} />}
                onClick={() => handleViewMembers(item)}
              >
                Kayıtlı Üyeler
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <ClassDrawer
        opened={opened}
        onClose={close}
        classItem={selectedClass}
        instructors={instructors}
        danceTypes={danceTypes}
      />

      <ClassMembersDrawer
        opened={membersDrawerOpen}
        onClose={closeMembers}
        classId={selectedClass?.id || null}
        className={selectedClass?.name || ''}
      />

      {/* Migrate Modal */}
      {selectedClass && (
        <ClassMigrateModal
          opened={migrateOpen}
          onClose={closeMigrate}
          sourceClass={selectedClass as ClassWithInstructor}
          classes={initialClasses}
          onConfirm={onMigrateConfirm}
          loading={loading}
        />
      )}
    </>
  );
}

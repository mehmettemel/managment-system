/**
 * Instructors Content (Client Component)
 */

'use client'

import { useState } from 'react'
import {
  Button,
  Group,
  Card,
  Avatar,
  Text,
  Badge,
  ActionIcon,
  SimpleGrid,
  Menu,
} from '@mantine/core'
import { IconPlus, IconDotsVertical, IconEdit, IconTrash } from '@tabler/icons-react'
import { InstructorDrawer } from './InstructorDrawer'
import { Instructor } from '@/types'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDisclosure } from '@mantine/hooks'
import { deactivateInstructor } from '@/actions/instructors'
import { showSuccess, showError } from '@/utils/notifications'

interface InstructorsContentProps {
  initialInstructors: Instructor[]
}

export function InstructorsContent({ initialInstructors }: InstructorsContentProps) {
  const [opened, { open, close }] = useDisclosure(false)
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)

  const handleEdit = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
    open()
  }

  const handleAdd = () => {
    setSelectedInstructor(null)
    open()
  }

  const handleDelete = async (id: number) => {
    if (confirm('Bu eğitmeni silmek istediğinize emin misiniz?')) {
      const res = await deactivateInstructor(id)
      if (res.error) showError(res.error)
      else showSuccess('Eğitmen silindi (Arşivlendi)')
    }
  }

  return (
    <>
      <Group justify="flex-end">
        <Button leftSection={<IconPlus size={20} />} onClick={handleAdd}>
          Yeni Eğitmen
        </Button>
      </Group>

      {initialInstructors.length === 0 ? (
        <EmptyState
          title="Eğitmen Bulunamadı"
          description="Henüz sisteme kayıtlı bir eğitmen yok."
          action={
            <Button variant="light" onClick={handleAdd}>
              İlk Eğitmeni Ekle
            </Button>
          }
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {initialInstructors.map((instructor) => (
            <Card key={instructor.id} withBorder padding="lg" radius="md">
              <Group justify="space-between" mb="xs">
                <Avatar size="lg" radius="xl" color="orange">
                  {instructor.first_name[0]}
                  {instructor.last_name[0]}
                </Avatar>
                <Menu withinPortal position="bottom-end" shadow="sm">
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray">
                      <IconDotsVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconEdit size={14} />}
                      onClick={() => handleEdit(instructor)}
                    >
                      Düzenle
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconTrash size={14} />}
                      color="red"
                      onClick={() => handleDelete(instructor.id)}
                    >
                      Sil
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              <Text fw={700} mt="md">
                {instructor.first_name} {instructor.last_name}
              </Text>
              <Text size="sm" c="dimmed">
                {instructor.specialty || 'Branş belirtilmemiş'}
              </Text>

              <Group mt="md" gap="xs">
                {instructor.phone && (
                  <Badge variant="light" color="gray">
                    {instructor.phone}
                  </Badge>
                )}
                <Badge color={instructor.active ? 'green' : 'red'}>
                  {instructor.active ? 'Aktif' : 'Pasif'}
                </Badge>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <InstructorDrawer
        opened={opened}
        onClose={close}
        instructor={selectedInstructor}
      />
    </>
  )
}

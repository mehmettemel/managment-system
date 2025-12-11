/**
 * Instructor Drawer Component
 * For creating and editing instructors
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Drawer,
  Button,
  TextInput,
  Stack,
  Group,
  Text,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { createInstructor, updateInstructor } from '@/actions/instructors'
import { showSuccess, showError } from '@/utils/notifications'
import type { Instructor, InstructorInsert } from '@/types'

interface InstructorDrawerProps {
  opened: boolean
  onClose: () => void
  instructor?: Instructor | null
  onSuccess?: () => void
}

export function InstructorDrawer({
  opened,
  onClose,
  instructor,
  onSuccess,
}: InstructorDrawerProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<InstructorInsert>({
    initialValues: {
      first_name: '',
      last_name: '',
      specialty: '',
      phone: '',
    },
    validate: {
      first_name: (value) =>
        value.trim().length < 2 ? 'Ad en az 2 karakter olmalı' : null,
      last_name: (value) =>
        value.trim().length < 2 ? 'Soyad en az 2 karakter olmalı' : null,
    },
  })

  useEffect(() => {
    if (instructor) {
      form.setValues({
        first_name: instructor.first_name,
        last_name: instructor.last_name,
        specialty: instructor.specialty || '',
        phone: instructor.phone || '',
      })
    } else {
      form.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructor])

  const handleSubmit = async (values: InstructorInsert) => {
    setLoading(true)
    try {
      if (instructor) {
        const result = await updateInstructor(instructor.id, values)
        if (result.error) {
          showError(result.error)
        } else {
          showSuccess('Eğitmen güncellendi')
          onSuccess?.()
          onClose()
        }
      } else {
        const result = await createInstructor(values)
        if (result.error) {
          showError(result.error)
        } else {
          showSuccess('Eğitmen eklendi')
          form.reset()
          onSuccess?.()
          onClose()
        }
      }
    } catch (error) {
      showError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      opened={opened}
      onClose={() => {
        form.reset()
        onClose()
      }}
      title={
        <Text size="lg" fw={600}>
          {instructor ? 'Eğitmen Düzenle' : 'Yeni Eğitmen Ekle'}
        </Text>
      }
      position="right"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Ad"
            placeholder="Ad"
            required
            {...form.getInputProps('first_name')}
          />
          <TextInput
            label="Soyad"
            placeholder="Soyad"
            required
            {...form.getInputProps('last_name')}
          />
          <TextInput
            label="Uzmanlık Alanı"
            placeholder="Örn: Salsa, Bachata"
            {...form.getInputProps('specialty')}
          />
          <TextInput
            label="Telefon"
            placeholder="0555..."
            {...form.getInputProps('phone')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>İptal</Button>
            <Button type="submit" loading={loading}>Kaydet</Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  )
}

/**
 * Class Drawer Component
 * For creating and editing classes
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
  Select,
  NumberInput,
} from '@mantine/core'
import { TimeInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { createClass, updateClass } from '@/actions/classes'
import { showSuccess, showError } from '@/utils/notifications'
import type { Class, ClassInsert, Instructor } from '@/types'
import { IconClock } from '@tabler/icons-react'

interface ClassDrawerProps {
  opened: boolean
  onClose: () => void
  classItem?: Class | null
  instructors: Instructor[]
  onSuccess?: () => void
}

export function ClassDrawer({
  opened,
  onClose,
  classItem,
  instructors,
  onSuccess,
}: ClassDrawerProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<ClassInsert>({
    initialValues: {
      name: '',
      instructor_id: null,
      day_of_week: 'Pazartesi',
      start_time: '19:00',
      duration_minutes: 60,
      price_monthly: 0,
    },
    validate: {
      name: (value) => (value.trim().length < 2 ? 'Ders adı gerekli' : null),
      instructor_id: (value) => (!value ? 'Eğitmen seçimi zorunludur' : null),
      start_time: (value) => (!value ? 'Başlangıç saati zorunludur' : null),
    },
  })

  useEffect(() => {
    if (classItem) {
      form.setValues({
        name: classItem.name,
        instructor_id: classItem.instructor_id,
        day_of_week: classItem.day_of_week,
        start_time: classItem.start_time,
        duration_minutes: classItem.duration_minutes,
        price_monthly: classItem.price_monthly,
      })
    } else {
      form.reset()
    }
  }, [classItem])

  const handleSubmit = async (values: ClassInsert) => {
    setLoading(true)
    try {
      // Ensure specific types for numbers
      const payload = {
        ...values,
        instructor_id: Number(values.instructor_id),
        duration_minutes: Number(values.duration_minutes),
        price_monthly: Number(values.price_monthly),
      }

      if (classItem) {
        const result = await updateClass(classItem.id, payload)
        if (result.error) {
          showError(result.error)
        } else {
          showSuccess('Ders güncellendi')
          onSuccess?.()
          onClose()
        }
      } else {
        const result = await createClass(payload)
        if (result.error) {
          showError(result.error)
        } else {
          showSuccess('Ders eklendi')
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

  const instructorOptions = instructors.map((inst) => ({
    value: String(inst.id),
    label: `${inst.first_name} ${inst.last_name}`,
  }))

  const days = [
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
    'Cumartesi',
    'Pazar',
  ]

  return (
    <Drawer
      opened={opened}
      onClose={() => {
        form.reset()
        onClose()
      }}
      title={
        <Text size="lg" fw={600}>
          {classItem ? 'Ders Düzenle' : 'Yeni Ders Ekle'}
        </Text>
      }
      position="right"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Ders Adı"
            placeholder="Örn: Başlangıç Salsa"
            required
            {...form.getInputProps('name')}
          />

          <Select
            label="Eğitmen"
            placeholder="Seçin"
            data={instructorOptions}
            searchable
            required
            {...form.getInputProps('instructor_id')}
            value={form.values.instructor_id ? String(form.values.instructor_id) : null}
            onChange={(val) => form.setFieldValue('instructor_id', val ? Number(val) : null)}
          />

          <Select
            label="Gün"
            data={days}
            required
            {...form.getInputProps('day_of_week')}
          />

          <TimeInput
            label="Başlangıç Saati"
            required
            leftSection={<IconClock size={16} />}
            {...form.getInputProps('start_time')}
          />

          <NumberInput
            label="Süre (Dakika)"
            min={15}
            step={15}
            required
            {...form.getInputProps('duration_minutes')}
          />

          <NumberInput
            label="Aylık Ücret"
            min={0}
            step={100}
            leftSection="₺"
            thousandSeparator="."
            decimalSeparator=","
            {...form.getInputProps('price_monthly')}
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

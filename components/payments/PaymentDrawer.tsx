/**
 * Payment Drawer Component
 * For recording new payments
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Drawer,
  Button,
  Stack,
  Group,
  Text,
  Select,
  NumberInput,
  Textarea,
  Loader,
} from '@mantine/core'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { createPayment } from '@/actions/payments'
import { searchMembers } from '@/actions/members'
import { showSuccess, showError } from '@/utils/notifications'
import type { PaymentFormData, Member } from '@/types'
import { useDebouncedValue } from '@mantine/hooks'

interface PaymentDrawerProps {
  opened: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PaymentDrawer({ opened, onClose, onSuccess }: PaymentDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearch] = useDebouncedValue(searchValue, 300)
  const [members, setMembers] = useState<Member[]>([])
  const [searching, setSearching] = useState(false)

  const form = useForm<PaymentFormData>({
    initialValues: {
      member_id: 0,
      amount: 1500,
      payment_method: 'Nakit',
      description: '',
      period_start: new Date().toISOString().split('T')[0],
    },
    validate: {
      member_id: (value) => (value === 0 ? 'Üye seçimi zorunludur' : null),
      amount: (value) => (value <= 0 ? 'Tutar 0 dan büyük olmalı' : null),
    },
  })

  // Search members
  useEffect(() => {
    async function fetchMembers() {
      setSearching(true)
      const res = await searchMembers(debouncedSearch)
      if (res.data) {
        setMembers(res.data)
      }
      setSearching(false)
    }

    fetchMembers()
  }, [debouncedSearch])

  const handleSubmit = async (values: PaymentFormData) => {
    setLoading(true)
    try {
      const result = await createPayment({
        ...values,
        member_id: Number(values.member_id),
      })

      if (result.error) {
        showError(result.error)
      } else {
        showSuccess('Ödeme kaydedildi')
        form.reset()
        onSuccess?.()
        onClose()
      }
    } catch (error) {
      showError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const memberOptions = members.map((m) => ({
    value: String(m.id),
    label: `${m.first_name} ${m.last_name} (${m.phone || 'Tel Yok'})`,
  }))

  return (
    <Drawer
      opened={opened}
      onClose={() => {
        form.reset()
        onClose()
      }}
      title={
        <Text size="lg" fw={600}>
          Ödeme Al
        </Text>
      }
      position="right"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Üye Ara"
            placeholder="İsim veya telefon yazın"
            data={memberOptions}
            searchable
            onSearchChange={setSearchValue}
            nothingFoundMessage={searching ? <Loader size="xs" /> : 'Üye bulunamadı'}
            required
            {...form.getInputProps('member_id')}
            value={form.values.member_id ? String(form.values.member_id) : null}
            onChange={(val) => form.setFieldValue('member_id', val ? Number(val) : 0)}
          />

          <CurrencyInput
            label="Tutar"
            step={100}
            required
            {...form.getInputProps('amount')}
          />

          <Select
            label="Ödeme Yöntemi"
            data={['Nakit', 'Kredi Kartı', 'Havale', 'Diğer']}
            required
            {...form.getInputProps('payment_method')}
          />

          <DateInput
             label="Dönem Başlangıcı"
             value={form.values.period_start ? new Date(form.values.period_start) : null}
             onChange={(date: any) => {
               if(date) {
                 // Adjust for timezone offset to prevent day shift
                 const offset = date.getTimezoneOffset()
                 const adjustedDate = new Date(date.getTime() - (offset*60*1000));
                 form.setFieldValue('period_start', adjustedDate.toISOString().split('T')[0])
               }
             }}
          />

          <Textarea
            label="Açıklama"
            placeholder="Notlar..."
            {...form.getInputProps('description')}
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

/**
 * Member Drawer Component
 * For creating and editing members with enhanced membership logic
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Drawer,
  Button,
  TextInput,
  Stack,
  Group,
  MultiSelect,
  NumberInput,
  Switch,
  Divider,
  Text,
  Textarea,
  Select,
  Card,
  Badge,
  Grid,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { formatCurrency, formatPhone } from '@/utils/formatters'
import { MaskedPhoneInput } from '@/components/shared/MaskedPhoneInput'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { createMember, updateMember, getMemberById } from '@/actions/members'
import { showSuccess, showError } from '@/utils/notifications'
import type { Member, MemberFormData, ClassWithInstructor } from '@/types'
import { IconCalendar, IconClock, IconUser, IconCurrencyLira } from '@tabler/icons-react'
import dayjs from 'dayjs'

interface MemberDrawerProps {
  opened: boolean
  onClose: () => void
  member?: Member | null
  classes: any[] // We need full class objects here
  onSuccess?: () => void
}

export function MemberDrawer({
  opened,
  onClose,
  member,
  classes,
  onSuccess,
}: MemberDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [includePayment, setIncludePayment] = useState(false)
  
  // New state for enhanced logic
  const [selectedDuration, setSelectedDuration] = useState<string>('1') // months
  const [calculatedPrice, setCalculatedPrice] = useState(0)

  const form = useForm<Partial<MemberFormData>>({
    initialValues: {
      first_name: '',
      last_name: '',
      phone: '',
      class_ids: [],
      monthly_fee: 0,
      initial_payment: {
        amount: 0,
        payment_method: 'Nakit',
        description: 'İlk ödeme',
      },
    },
    validate: {
      first_name: (value) => (value && value.trim().length >= 2 ? null : 'Ad en az 2 karakter olmalı'),
      last_name: (value) => (value && value.trim().length >= 2 ? null : 'Soyad en az 2 karakter olmalı'),
      class_ids: (value) => (value && value.length > 0 ? null : 'En az bir ders seçmelisiniz'),
    },
  })

  // Calculate price when classes change
  useEffect(() => {
    const selectedClassIds = form.values.class_ids || []
    if (selectedClassIds.length > 0) {
      const total = classes
        .filter((c) => selectedClassIds.map(String).includes(String(c.id)))
        .reduce((sum, c) => sum + (Number(c.price_monthly) || 0), 0)
      
      setCalculatedPrice(total)
      
      // Only auto-set monthly_fee if it hasn't been manually touched (or is 0)
      if (form.values.monthly_fee === 0) {
        form.setFieldValue('monthly_fee', total)
      }
    } else {
      setCalculatedPrice(0)
      if (form.values.monthly_fee === 0) form.setFieldValue('monthly_fee', 0)
    }
  }, [form.values.class_ids, classes])

  // Update initial payment amount when fee or duration changes
  useEffect(() => {
    if (includePayment && !member) {
      const monthlyFee = form.values.monthly_fee || 0
      const duration = Number(selectedDuration) || 1
      form.setFieldValue('initial_payment.amount', monthlyFee * duration)
    }
  }, [form.values.monthly_fee, selectedDuration, includePayment, member])

  useEffect(() => {
    const fetchDetails = async () => {
      if (member) {
        setLoading(true)
        // Set basic info immediately
        form.setValues({
            first_name: member.first_name,
            last_name: member.last_name,
            phone: member.phone || '',
            monthly_fee: member.monthly_fee || 0,
            class_ids: [],
        })
        
        // Fetch relations (classes)
        const { data } = await getMemberById(member.id)
        if (data) {
             const classIds = data.member_classes?.map((mc: any) => String(mc.class_id)) || []
             form.setFieldValue('class_ids', classIds as any)
             // Also update monthly fee if valid
             if (data.monthly_fee) form.setFieldValue('monthly_fee', Number(data.monthly_fee))
        }
        setIncludePayment(false)
        setLoading(false)
      } else {
        form.reset()
        setIncludePayment(true)
        setSelectedDuration('1')
      }
    }
    
    fetchDetails()
  }, [member])

  const handleSubmit = async (values: Partial<MemberFormData>) => {
    setLoading(true)
    try {
      if (member) {
        // Update logic
        const result = await updateMember(member.id, {
          first_name: values.first_name!.trim(),
          last_name: values.last_name!.trim(),
          phone: values.phone?.trim() || null,
          monthly_fee: values.monthly_fee,
        })
         if (result.error) showError(result.error)
         else {
             showSuccess('Üye güncellendi')
             onSuccess?.()
             onClose()
         }
      } else {
        // Create Logic
        const formData: MemberFormData = {
          first_name: values.first_name!.trim(),
          last_name: values.last_name!.trim(),
          phone: values.phone?.trim(),
          class_ids: values.class_ids!.map(Number),
          monthly_fee: values.monthly_fee,
          initial_duration_months: Number(selectedDuration),
          initial_payment: includePayment
            ? {
                amount: values.initial_payment!.amount,
                payment_method: values.initial_payment!.payment_method,
                description: `${selectedDuration} Aylık Üyelik - İlk Ödeme`,
              }
            : undefined,
        }

        const result = await createMember(formData)
        if (result.error) showError(result.error)
        else {
          showSuccess('Yeni üye eklendi')
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

  // Preapre class options for Select
  const classOptions = classes.map(c => ({
      value: String(c.id),
      label: `${c.name} (${c.day_of_week} ${c.start_time?.slice(0,5)})`
  }))

  return (
    <Drawer
      opened={opened}
      onClose={() => { form.reset(); onClose(); }}
      title={<Text size="lg" fw={600}>{member ? 'Üye Düzenle' : 'Yeni Üye Kaydı (Details)'}</Text>}
      position="right"
      size="lg" // Wider drawer for more info
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
            {/* 1. Personal Info */}
            <Card withBorder radius="md" p="md">
                <Text fw={600} mb="sm" c="dimmed">Kişisel Bilgiler</Text>
                <Grid>
                    <Grid.Col span={6}>
                        <TextInput label="Ad" placeholder="Ahmet" required {...form.getInputProps('first_name')} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <TextInput label="Soyad" placeholder="Yılmaz" required {...form.getInputProps('last_name')} />
                    </Grid.Col>
                    <Grid.Col span={12}>
                        <MaskedPhoneInput 
                            label="Telefon" 
                            {...form.getInputProps('phone')} 
                        />
                    </Grid.Col>
                </Grid>
            </Card>

            {/* 2. Membership Selection */}
            <Card withBorder radius="md" p="md">
                <Text fw={600} mb="sm" c="dimmed">Üyelik ve Ders Seçimi</Text>
                <Stack>
                     <MultiSelect
                        label="Dersleri Seçin"
                        placeholder="Ders ara..."
                        data={classOptions}
                        searchable
                        required
                        {...form.getInputProps('class_ids')}
                     />
                     
                     {/* Selected Classes Details */}
                     {form.values.class_ids && form.values.class_ids.length > 0 && (
                         <Stack gap="xs">
                             <Text size="xs" fw={700}>Seçilen Ders Planı:</Text>
                             {classes
                                .filter(c => form.values.class_ids?.map(String).includes(String(c.id)))
                                .map(c => (
                                 <Group key={c.id} justify="space-between" className="bg-gray-50 p-2 rounded text-sm dark:bg-zinc-800">
                                     <Group gap="xs">
                                         <Badge size="sm" variant="dot">{c.name}</Badge>
                                         <Group gap={4} c="dimmed">
                                             <IconCalendar size={12}/> <Text size="xs">{c.day_of_week}</Text>
                                             <IconClock size={12}/> <Text size="xs">{c.start_time?.slice(0,5)}</Text>
                                         </Group>
                                     </Group>
                                     <Text size="xs" fw={600}>{formatCurrency(Number(c.price_monthly))}</Text>
                                 </Group>
                             ))}
                             <Group justify="flex-end">
                                 <Text size="sm" c="dimmed">Liste Fiyatı Toplamı: <span className="font-bold text-gray-700 dark:text-gray-300">{formatCurrency(calculatedPrice)}</span></Text>
                             </Group>
                         </Stack>
                     )}

                     <Divider label="Üye Özel Fiyatlandırma" labelPosition="center" />
                     
                     <Group grow align="flex-start">
                         <CurrencyInput
                            label="Aylık Anlaşılan Ücret"
                            description="Üye için geçerli olacak sabit aylık ücret"
                            {...form.getInputProps('monthly_fee')}
                         />
                         {!member && (
                             <Select
                                 label="Üyelik Süresi"
                                 description="İlk ödeme hesaplaması için"
                                 data={[
                                     { value: '1', label: '1 Ay' },
                                     { value: '3', label: '3 Ay' },
                                     { value: '6', label: '6 Ay' },
                                     { value: '12', label: '1 Yıl' },
                                 ]}
                                 value={selectedDuration}
                                 onChange={(val) => setSelectedDuration(val || '1')}
                             />
                         )}
                     </Group>
                </Stack>
            </Card>

            {/* 3. Initial Payment */}
            {!member && (
            <Card withBorder radius="md" p="md">
                <Group justify="space-between" mb="xs">
                    <Text fw={600} c="dimmed">Ödeme Bilgileri</Text>
                    <Switch
                        label="Tahsilat Yap"
                        checked={includePayment}
                        onChange={(e) => setIncludePayment(e.currentTarget.checked)}
                    />
                </Group>
                
                {includePayment && (
                    <Stack>
                        <Alert variant="light" color="blue" title="Özet">
                            <Text size="sm">
                                <b>{selectedDuration} Ay</b> x <b>{formatCurrency(form.values.monthly_fee || 0)}</b> = 
                                Toplam <b>{formatCurrency(Number(form.values.monthly_fee || 0) * Number(selectedDuration))}</b> tahsil edilecek.
                            </Text>
                        </Alert>
                        
                        <CurrencyInput
                            label="Alınan Tutar"
                            required
                            {...form.getInputProps('initial_payment.amount')}
                        />
                         <Select
                            label="Ödeme Yöntemi"
                            data={['Nakit', 'Kredi Kartı', 'Havale', 'Diğer']}
                            {...form.getInputProps('initial_payment.payment_method')}
                        />
                         <Textarea
                             label="Notlar"
                             placeholder="Ödeme ile ilgili notlar..."
                             {...form.getInputProps('initial_payment.description')}
                         />
                    </Stack>
                )}
            </Card>
            )}

            <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={onClose}>İptal</Button>
                <Button type="submit" loading={loading} disabled={!form.isValid()}>Kaydet</Button>
            </Group>
        </Stack>
      </form>
    </Drawer>
  )
}
import { Alert } from '@mantine/core'

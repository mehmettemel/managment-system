'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Title,
  Text,
  Card,
  Group,
  Stack,
  Loader,
  Center,
  ActionIcon,
  Accordion,
  Badge,
  Container,
  SimpleGrid,
  Tabs,
  Table,
  Button,
} from '@mantine/core'
import {
  IconArrowLeft,
  IconPhone,
  IconCalendar,
} from '@tabler/icons-react'
import { getMemberById } from '@/actions/members'
import { getPaymentSchedule } from '@/actions/payments'
import { formatPhone } from '@/utils/formatters'
import { formatDate } from '@/utils/date-helpers'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaymentScheduleTable } from '@/components/members/PaymentScheduleTable'
import type { Member, MemberClassWithDetails, PaymentScheduleItem } from '@/types'

interface MemberDetailViewProps {
  memberId: number
}

export function MemberDetailView({ memberId }: MemberDetailViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<(Member & { member_classes: MemberClassWithDetails[] }) | null>(null)
  const [schedules, setSchedules] = useState<Record<number, PaymentScheduleItem[]>>({})

  const fetchData = async () => {
    setLoading(true)
    const memberRes = await getMemberById(memberId)
    
    if (memberRes.data) {
        setMember(memberRes.data)
        
        // Fetch schedules for all active classes
        const activeClasses = memberRes.data.member_classes?.filter(mc => mc.active) || []
        const schedMap: Record<number, PaymentScheduleItem[]> = {}
        
        await Promise.all(activeClasses.map(async (mc) => {
            const res = await getPaymentSchedule(memberId, mc.class_id)
            if (res.data) {
                schedMap[mc.class_id] = res.data
            }
        }))
        setSchedules(schedMap)
    }
    setLoading(false)
  }

  const handleRefresh = async () => {
       // Refresh only schedules lightly if possible, but full refetch simplest
       await fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [memberId])


  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    )
  }

  if (!member) {
    return <Text>Üye bulunamadı</Text>
  }

  const activeClasses = member.member_classes?.filter(mc => mc.active) || []

  return (
    <Container size="lg" p="md">
      <Stack gap="lg">
        {/* Header */}
        <Group wrap="wrap" align="center" gap="md">
          <ActionIcon variant="subtle" size="lg" onClick={() => router.push('/members')}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <div>
            <Title order={2}>{member.first_name} {member.last_name}</Title>
            <Group gap="xs" wrap="wrap">
              <StatusBadge status={member.status as any} />
              {member.phone && (
                <Text size="sm" c="dimmed">
                  <IconPhone size={14} style={{ verticalAlign: 'middle' }} /> {formatPhone(member.phone)}
                </Text>
              )}
              <Text size="sm" c="dimmed">
                <IconCalendar size={14} style={{ verticalAlign: 'middle' }} /> Kayıt: {formatDate(member.join_date)}
              </Text>
            </Group>
          </div>
        </Group>

        {/* Class Payment Schedules */}
        <Title order={4}>Ödeme Planları</Title>

        {activeClasses.length === 0 ? (
          <Text c="dimmed">Kayıtlı aktif ders bulunmuyor.</Text>
        ) : (
          <Accordion multiple defaultValue={activeClasses.map(c => String(c.class_id))}>
            {activeClasses.map(mc => (
              <Accordion.Item key={mc.class_id} value={String(mc.class_id)}>
                <Accordion.Control>
                  <Group>
                    <Text fw={600}>{mc.classes?.name}</Text>
                    <Badge variant="dot" size="sm">{mc.classes?.day_of_week} {mc.classes?.start_time?.slice(0,5)}</Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <PaymentScheduleTable
                    schedule={schedules[mc.class_id] || []}
                    memberId={memberId}
                    classId={mc.class_id}
                    onUpdate={handleRefresh}
                  />
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </Stack>
    </Container>
  )
}

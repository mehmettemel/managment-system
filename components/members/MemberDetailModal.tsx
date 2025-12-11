'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  Text,
  Card,
  Group,
  Stack,
  Badge,
  Button,
  Tabs,
  Table,
  SimpleGrid,
  Loader,
  Center,
  Divider,
} from '@mantine/core'
import {
  IconCreditCard,
  IconCalendar,
  IconPhone,
  IconCurrencyLira,
  IconUser,
  IconHistory,
} from '@tabler/icons-react'
import { getMemberById } from '@/actions/members'
import { getMemberPayments } from '@/actions/payments'
import { formatDate, isPaymentOverdue } from '@/utils/date-helpers'
import { formatCurrency, formatPhone } from '@/utils/formatters'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ClassPaymentModal } from '@/components/members/ClassPaymentModal'
import type { Member, MemberClassWithDetails, PaymentWithClass } from '@/types'

interface MemberDetailModalProps {
  opened: boolean
  onClose: () => void
  memberId: number | null
  onRefresh?: () => void
}

export function MemberDetailModal({
  opened,
  onClose,
  memberId,
  onRefresh,
}: MemberDetailModalProps) {
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<(Member & { member_classes: MemberClassWithDetails[] }) | null>(null)
  const [payments, setPayments] = useState<PaymentWithClass[]>([])
  const [paymentModalOpened, setPaymentModalOpened] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)

  const fetchData = async () => {
    if (!memberId) return
    setLoading(true)
    const [memberRes, paymentsRes] = await Promise.all([
      getMemberById(memberId),
      getMemberPayments(memberId),
    ])
    
    if (memberRes.data) setMember(memberRes.data)
    if (paymentsRes.data) setPayments(paymentsRes.data as PaymentWithClass[])
    setLoading(false)
  }

  useEffect(() => {
    if (opened && memberId) {
      fetchData()
    }
  }, [opened, memberId])

  const handleOpenPaymentModal = (classId?: number) => {
    setSelectedClassId(classId || null)
    setPaymentModalOpened(true)
  }

  const handlePaymentSuccess = () => {
    fetchData()
    setPaymentModalOpened(false)
    setSelectedClassId(null)
    onRefresh?.()
  }

  const activeClasses = member?.member_classes?.filter(mc => mc.active) || []

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          member ? (
            <Group gap="sm">
              <IconUser size={20} />
              <Text fw={600}>{member.first_name} {member.last_name}</Text>
              <StatusBadge status={member.status as any} size="sm" />
            </Group>
          ) : (
            <Text fw={600}>Üye Detayı</Text>
          )
        }
        size="xl"
        centered
      >
        {loading ? (
          <Center h={300}>
            <Loader size="lg" />
          </Center>
        ) : member ? (
          <Stack gap="md">
            {/* Profile Info */}
            <Card withBorder p="sm" radius="md">
              <Group gap="xl">
                {member.phone && (
                  <Group gap="xs">
                    <IconPhone size={16} color="gray" />
                    <Text size="sm">{formatPhone(member.phone)}</Text>
                  </Group>
                )}
                <Group gap="xs">
                  <IconCalendar size={16} color="gray" />
                  <Text size="sm">Kayıt: {formatDate(member.join_date)}</Text>
                </Group>
              </Group>
            </Card>

            {/* Active Classes */}
            <div>
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">Aktif Dersler</Text>
                <Button 
                  variant="light" 
                  size="xs" 
                  leftSection={<IconCreditCard size={14} />}
                  onClick={() => handleOpenPaymentModal()}
                >
                  Ödeme Yap
                </Button>
              </Group>

              {activeClasses.length === 0 ? (
                <Text c="dimmed" size="sm">Kayıtlı ders yok</Text>
              ) : (
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  {activeClasses.map((mc) => {
                    const isOverdue = isPaymentOverdue(mc.next_payment_date)
                    return (
                      <Card key={mc.id} withBorder radius="md" p="sm">
                        <Group justify="space-between" mb="xs">
                          <Text fw={500} size="sm">{mc.classes?.name || 'Ders'}</Text>
                          {isOverdue && <Badge color="red" size="xs">Gecikmiş</Badge>}
                        </Group>
                        
                        <Group gap="lg" mb="xs">
                          <Group gap={4}>
                            <IconCurrencyLira size={14} color="gray" />
                            <Text size="xs" c="dimmed">{formatCurrency(mc.price || 0)}</Text>
                          </Group>
                          <Group gap={4}>
                            <IconCalendar size={14} color={isOverdue ? 'red' : 'gray'} />
                            <Text size="xs" c={isOverdue ? 'red' : 'dimmed'}>
                              {formatDate(mc.next_payment_date)}
                            </Text>
                          </Group>
                        </Group>

                        <Button 
                          variant="light" 
                          size="xs" 
                          fullWidth
                          onClick={() => handleOpenPaymentModal(mc.class_id)}
                        >
                          Ödeme Yap
                        </Button>
                      </Card>
                    )
                  })}
                </SimpleGrid>
              )}
            </div>

            <Divider />

            {/* Payment History */}
            <div>
              <Group gap="xs" mb="xs">
                <IconHistory size={16} />
                <Text fw={600} size="sm">Ödeme Geçmişi</Text>
              </Group>
              
              {payments.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="md">Henüz ödeme yok</Text>
              ) : (
                <Table highlightOnHover withTableBorder striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Tarih</Table.Th>
                      <Table.Th>Tutar</Table.Th>
                      <Table.Th>Ders</Table.Th>
                      <Table.Th>Dönem</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {payments.slice(0, 5).map((payment) => (
                      <Table.Tr key={payment.id}>
                        <Table.Td>{formatDate(payment.payment_date)}</Table.Td>
                        <Table.Td fw={600} c="green">{formatCurrency(payment.amount)}</Table.Td>
                        <Table.Td>{(payment as any).classes?.name || '-'}</Table.Td>
                        <Table.Td>
                          {payment.period_start && payment.period_end
                            ? `${formatDate(payment.period_start)} - ${formatDate(payment.period_end)}`
                            : '-'}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
              {payments.length > 5 && (
                <Text size="xs" c="dimmed" ta="center" mt="xs">
                  +{payments.length - 5} daha fazla ödeme
                </Text>
              )}
            </div>
          </Stack>
        ) : (
          <Text c="dimmed" ta="center">Üye bulunamadı</Text>
        )}
      </Modal>

      {/* Payment Modal */}
      {member && (
        <ClassPaymentModal
          opened={paymentModalOpened}
          onClose={() => setPaymentModalOpened(false)}
          memberId={member.id}
          memberClasses={activeClasses}
          preselectedClassId={selectedClassId}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  )
}

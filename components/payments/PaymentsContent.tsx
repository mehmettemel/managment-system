/**
 * Payments Content (Client Component)
 */

'use client'

import { useState } from 'react'
import {
  Button,
  Group,
  Table,
  Badge,
  Card,
  Text,
  ActionIcon,
} from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { PaymentDrawer } from './PaymentDrawer'
import { Payment } from '@/types'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDisclosure } from '@mantine/hooks'
import { deletePayment } from '@/actions/payments'
import { showSuccess, showError } from '@/utils/notifications'
import { formatCurrency } from '@/utils/formatters'
import dayjs from 'dayjs'

interface PaymentsContentProps {
  initialPayments: Payment[]
}

export function PaymentsContent({ initialPayments }: PaymentsContentProps) {
  const [opened, { open, close }] = useDisclosure(false)
  const [payments, setPayments] = useState(initialPayments)

  const handleDelete = async (id: number) => {
    if (confirm('Bu ödeme kaydını silmek istediğinize emin misiniz?')) {
      const res = await deletePayment(id)
      if (res.error) showError(res.error)
      else {
        showSuccess('Ödeme silindi')
        // Optimistic update or refresh needed, simplistic here:
        setPayments(payments.filter(p => p.id !== id))
      }
    }
  }

  // Get member name logic is tricky here as payment only has member_id.
  // In a real app we should fetch payments with member relation.
  // For now we just show member ID or use a different Server Action.
  // Let's rely on basic table for now, or update the Server Action to join members.

  return (
    <>
      <Group justify="flex-end">
        <Button leftSection={<IconPlus size={20} />} onClick={open}>
          Ödeme Al
        </Button>
      </Group>

      {payments.length === 0 ? (
        <EmptyState
          title="Ödeme Kaydı Yok"
          description="Henüz tahsilat yapılmamış."
          action={
            <Button variant="light" onClick={open}>
              İlk Ödemeyi Al
            </Button>
          }
        />
      ) : (
        <Card withBorder radius="md">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tarih</Table.Th>
                <Table.Th>Tutar</Table.Th>
                <Table.Th>Yöntem</Table.Th>
                <Table.Th>Dönem</Table.Th>
                <Table.Th>Açıklama</Table.Th>
                <Table.Th style={{ width: 80 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {payments.map((payment) => (
                <Table.Tr key={payment.id}>
                  <Table.Td>{dayjs(payment.payment_date).format('DD.MM.YYYY')}</Table.Td>
                  <Table.Td fw={700} c="green">
                    {formatCurrency(Number(payment.amount))}
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="dot">{payment.payment_method}</Badge>
                  </Table.Td>
                  <Table.Td>
                    {payment.period_start && dayjs(payment.period_start).format('MMM YYYY')}
                  </Table.Td>
                  <Table.Td className="text-sm text-gray-500">
                    {payment.description}
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(payment.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <PaymentDrawer
        opened={opened}
        onClose={close}
        onSuccess={() => {/* Refresh logic */}}
      />
    </>
  )
}

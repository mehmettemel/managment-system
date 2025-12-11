'use client'

import { useState } from 'react'
import {
  Table,
  Badge,
  Button,
  ActionIcon,
  Group,
  Text,
  LoadingOverlay,
} from '@mantine/core'
import {
  IconCheck,
  IconX,
  IconCurrencyLira,
  IconCreditCard,
} from '@tabler/icons-react'
import { PaymentScheduleItem } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { formatDate } from '@/utils/date-helpers'
import { processClassPayment, deletePayment } from '@/actions/payments'
import { showSuccess, showError } from '@/utils/notifications'
import { modals } from '@mantine/modals'

interface PaymentScheduleTableProps {
  schedule: PaymentScheduleItem[]
  memberId: number
  classId: number
  onUpdate: () => void
}

export function PaymentScheduleTable({
  schedule,
  memberId,
  classId,
  onUpdate,
}: PaymentScheduleTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handlePay = async (item: PaymentScheduleItem) => {
    modals.openConfirmModal({
      title: 'Ödeme Onayı',
      children: (
        <Text size="sm">
          <strong>{item.periodLabel}</strong> dönemi için{' '}
          <strong>{formatCurrency(item.amount)}</strong> ödeme alınsın mı?
        </Text>
      ),
      labels: { confirm: 'Ödeme Al (Nakit)', cancel: 'İptal' },
      onConfirm: async () => {
        setLoadingId(item.periodMonth)
        const res = await processClassPayment({
          memberId,
          classId,
          amount: item.amount,
          periodDate: item.periodMonth,
          paymentMethod: 'Nakit', // Default to cash for quick action, or expand to modal
        })
        
        if (res.error) showError(res.error)
        else {
            showSuccess('Ödeme alındı')
            onUpdate()
        }
        setLoadingId(null)
      },
    })
  }

  const handleCancelPay = async (item: PaymentScheduleItem) => {
    if (!item.paymentId) return

    modals.openConfirmModal({
      title: 'Ödeme İptali',
      children: (
        <Text size="sm">
          <strong>{item.periodLabel}</strong> ödemesi iptal edilsin mi? (Geri alınamaz)
        </Text>
      ),
      labels: { confirm: 'Evet, İptal Et', cancel: 'Vazgeç' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        setLoadingId(item.periodMonth)
        const res = await deletePayment(item.paymentId!)
        
        if (res.error) showError(res.error)
        else {
            showSuccess('Ödeme iptal edildi')
            onUpdate()
        }
        setLoadingId(null)
      },
    })
  }

  return (
    <div style={{ position: 'relative' }}>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Dönem</Table.Th>
            <Table.Th>Durum</Table.Th>
            <Table.Th>Tutar</Table.Th>
            <Table.Th>İşlem Tarihi</Table.Th>
            <Table.Th>Yöntem</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>İşlem</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {schedule.map((item) => (
            <Table.Tr key={item.periodMonth}>
              <Table.Td>
                <Text fw={600}>{item.periodLabel}</Text>
              </Table.Td>
              <Table.Td>
                {item.status === 'paid' ? (
                  <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
                    Ödendi
                  </Badge>
                ) : item.status === 'overdue' ? (
                  <Badge color="red" variant="light" leftSection={<IconX size={12} />}>
                    Gecikmiş
                  </Badge>
                ) : (
                  <Badge color="gray" variant="light">
                    Ödenmedi
                  </Badge>
                )}
              </Table.Td>
              <Table.Td>{formatCurrency(item.amount)}</Table.Td>
              <Table.Td>
                {item.paymentDate ? formatDate(item.paymentDate) : '-'}
              </Table.Td>
              <Table.Td>
                 {item.paymentMethod || '-'}
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                 {item.status === 'paid' ? (
                     <Button 
                        color="red" 
                        variant="subtle" 
                        size="xs"
                        loading={loadingId === item.periodMonth}
                        onClick={() => handleCancelPay(item)}
                     >
                         İptal
                     </Button>
                 ) : (
                     <Button 
                        variant="light" 
                        size="xs"
                        leftSection={<IconCreditCard size={14} />}
                        loading={loadingId === item.periodMonth}
                        onClick={() => handlePay(item)}
                     >
                         Ödeme Al
                     </Button>
                 )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  )
}

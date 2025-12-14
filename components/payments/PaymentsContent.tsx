/**
 * Payments Content (Client Component)
 * Updated for class-based payment system
 */

'use client';

import { useState } from 'react';
import {
  Button,
  Group,
  Table,
  Badge,
  Card,
  Text,
  ActionIcon,
  Alert,
} from '@mantine/core';
import { IconInfoCircle, IconTrash } from '@tabler/icons-react';
import { Payment } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { deletePayment } from '@/actions/payments';
import { showSuccess, showError } from '@/utils/notifications';
import { formatCurrency, formatPaymentMethod } from '@/utils/formatters';
import dayjs from 'dayjs';
import Link from 'next/link';

interface PaymentsContentProps {
  initialPayments: Payment[];
}

export function PaymentsContent({ initialPayments }: PaymentsContentProps) {
  const [payments, setPayments] = useState(initialPayments);

  const handleDelete = async (id: number) => {
    if (confirm('Bu ödeme kaydını silmek istediğinize emin misiniz?')) {
      const res = await deletePayment(id);
      if (res.error) showError(res.error);
      else {
        showSuccess('Ödeme silindi');
        setPayments(payments.filter((p) => p.id !== id));
      }
    }
  };

  return (
    <>
      {payments.length === 0 ? (
        <EmptyState
          title="Ödeme Kaydı Yok"
          description="Henüz tahsilat yapılmamış."
          action={
            <Button variant="light" component={Link} href="/members">
              Üyelere Git
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
                <Table.Th>Ders</Table.Th>
                <Table.Th>Yöntem</Table.Th>
                <Table.Th>Dönem</Table.Th>
                <Table.Th>Açıklama</Table.Th>
                <Table.Th style={{ width: 80 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {payments.map((payment) => (
                <Table.Tr key={payment.id}>
                  <Table.Td>
                    {dayjs(payment.payment_date).format('DD.MM.YYYY')}
                  </Table.Td>
                  <Table.Td fw={700} c="green">
                    {formatCurrency(Number(payment.amount))}
                  </Table.Td>
                  <Table.Td>{(payment as any).classes?.name || '-'}</Table.Td>
                  <Table.Td>
                    <Badge variant="dot">{formatPaymentMethod(payment.payment_method)}</Badge>
                  </Table.Td>
                  <Table.Td>
                    {payment.period_start &&
                      dayjs(payment.period_start).format('MMM YYYY')}
                  </Table.Td>
                  <Table.Td className="text-sm text-gray-500 dark:text-gray-400">
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
    </>
  );
}

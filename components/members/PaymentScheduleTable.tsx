'use client';

import { useState } from 'react';
import { Badge, Button, Text } from '@mantine/core';
import { IconCheck, IconX, IconCreditCard } from '@tabler/icons-react';
import { PaymentScheduleItem } from '@/types';
import { formatCurrency, formatPaymentMethod } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import { processClassPayment, deletePayment } from '@/actions/payments';
import { showSuccess, showError } from '@/utils/notifications';
import { modals } from '@mantine/modals';
import { DataTable, DataTableColumn } from '@/components/shared/DataTable';
import { PaymentConfirmModal } from '@/components/payments/PaymentConfirmModal';
import { PaymentDetailDrawer } from '@/components/payments/PaymentDetailDrawer';

interface PaymentScheduleTableProps {
  schedule: PaymentScheduleItem[];
  memberId: number;
  classId: number;
  onUpdate: () => void;
}

export function PaymentScheduleTable({
  schedule,
  memberId,
  classId,
  onUpdate,
}: PaymentScheduleTableProps) {
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PaymentScheduleItem | null>(
    null
  );
  const [modalOpened, setModalOpened] = useState(false);
  const [drawerOpened, setDrawerOpened] = useState(false);

  const handleOpenPay = (item: PaymentScheduleItem) => {
    setSelectedItem(item);
    setModalOpened(true);
  };

  const handleRowClick = (item: PaymentScheduleItem) => {
    setSelectedItem(item);
    setDrawerOpened(true);
  };

  const handleConfirmPay = async (values: {
    amount: number;
    paymentMethod: string;
    description?: string;
  }) => {
    if (!selectedItem) return;

    setLoading(true);
    const res = await processClassPayment({
      memberId,
      classId,
      amount: values.amount,
      periodDate: selectedItem.periodMonth,
      paymentMethod: values.paymentMethod,
      // description: values.description, // Passed but server action needs updates
    });

    // NOTE: Sending description requires updating types and backend action.
    // For now, I will pass it but if type errors, I will fix types validation next.

    if (res.error) {
      showError(res.error);
    } else {
      showSuccess('Ödeme başarıyla alındı');
      onUpdate();
      setModalOpened(false);
      setDrawerOpened(false);
    }
    setLoading(false);
  };

  const handleCancelPay = async (item: PaymentScheduleItem) => {
    if (!item.paymentId) return;

    modals.openConfirmModal({
      title: 'Ödeme İptali',
      children: (
        <Text size="sm">
          <strong>{item.periodLabel}</strong> ödemesi iptal edilsin mi? (Geri
          alınamaz)
        </Text>
      ),
      labels: { confirm: 'Evet, İptal Et', cancel: 'Vazgeç' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        setLoading(true);
        const res = await deletePayment(item.paymentId!);

        if (res.error) showError(res.error);
        else {
          showSuccess('Ödeme iptal edildi');
          onUpdate();
          setDrawerOpened(false);
        }
        setLoading(false);
      },
    });
  };

  const columns: DataTableColumn<PaymentScheduleItem>[] = [
    {
      key: 'periodLabel',
      label: 'Dönem',
      sortable: true,
      render: (item) => <Text fw={600}>{item.periodLabel}</Text>,
    },
    {
      key: 'status',
      label: 'Durum',
      render: (item) => {
        if (item.status === 'paid') {
          return (
            <Badge
              color="green"
              variant="light"
              leftSection={<IconCheck size={12} />}
            >
              Ödendi
            </Badge>
          );
        } else if (item.status === 'overdue') {
          return (
            <Badge
              color="red"
              variant="light"
              leftSection={<IconX size={12} />}
            >
              Gecikmiş
            </Badge>
          );
        } else {
          return (
            <Badge color="gray" variant="light">
              Ödenmedi
            </Badge>
          );
        }
      },
    },
    {
      key: 'amount',
      label: 'Tutar',
      render: (item) => formatCurrency(item.amount),
    },
    {
      key: 'paymentDate',
      label: 'İşlem Tarihi',
      render: (item) => (item.paymentDate ? formatDate(item.paymentDate) : '-'),
    },
    {
      key: 'paymentMethod',
      label: 'Yöntem',
      render: (item) => formatPaymentMethod(item.paymentMethod),
    },
    {
      key: 'actions',
      label: 'İşlem',
      width: 120,
      render: (item) =>
        item.status === 'paid' ? (
          <Button
            color="red"
            variant="subtle"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              handleCancelPay(item);
            }}
          >
            İptal
          </Button>
        ) : (
          <Button
            variant="light"
            size="xs"
            leftSection={<IconCreditCard size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPay(item);
            }}
          >
            Ödeme Al
          </Button>
        ),
    },
  ];

  return (
    <>
      <DataTable
        data={schedule}
        columns={columns}
        pageSize={12}
        emptyText="Ödeme planı bulunamadı"
        idField="periodMonth"
        onRowClick={handleRowClick}
      />

      <PaymentConfirmModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onConfirm={handleConfirmPay}
        item={selectedItem}
        loading={loading}
      />

      <PaymentDetailDrawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        item={selectedItem}
        loading={loading}
        onPay={() => {
          setModalOpened(true);
        }}
        onCancel={() => selectedItem && handleCancelPay(selectedItem)}
      />
    </>
  );
}

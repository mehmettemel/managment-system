'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Badge, Group, Text, Stack } from '@mantine/core';
import { DataTable, DataTableColumn } from '@/components/shared/DataTable';
import { getMemberPayments } from '@/actions/payments';
import { PaymentWithClass } from '@/types';
import { formatDate } from '@/utils/date-helpers';
import { formatCurrency } from '@/utils/formatters';
import { showError } from '@/utils/notifications';

interface PaymentHistoryProps {
  memberId: number;
  classId?: number;
}

export function PaymentHistory({ memberId, classId }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMemberPayments(memberId, page, pageSize);
      if (response.error) {
        showError(response.error);
      } else {
        const { data, meta } = response.data;
        let filteredData = data || [];

        // Optional client-side filtering if API doesn't support classId filtering yet
        if (classId) {
          filteredData = filteredData.filter((p) => p.class_id === classId);
        }

        setPayments(filteredData as PaymentWithClass[]);
        setTotalRecords(meta?.total || 0);
      }
    } catch (err) {
      console.error(err);
      showError('Ödeme geçmişi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [memberId, page, classId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const columns: DataTableColumn<PaymentWithClass>[] = [
    {
      key: 'payment_date',
      label: 'Tarih',
      sortable: true,
      render: (row) => formatDate(row.payment_date),
    },
    {
      key: 'amount',
      label: 'Tutar',
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: 'class',
      label: 'Ders',
      render: (row) => row.classes?.name || '-',
    },
    {
      key: 'payment_method',
      label: 'Ödeme Yöntemi',
      render: (row) => (
        <Badge variant="light" color="gray">
          {row.payment_method === 'cash' || row.payment_method === 'Nakit'
            ? 'Nakit'
            : row.payment_method === 'credit_card' ||
                row.payment_method === 'Kredi Kartı'
              ? 'Kredi Kartı'
              : 'Havale/EFT'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (
        row // Keeping it simple, assumed completed based on table query
      ) => (
        <Badge color="green" variant="dot">
          Tamamlandı
        </Badge>
      ),
    },
  ];

  return (
    <Stack gap="md">
      <Title order={5}>Ödeme Geçmişi</Title>
      <DataTable
        data={payments}
        columns={columns}
        loading={loading}
        totalRecords={totalRecords}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
      />
    </Stack>
  );
}

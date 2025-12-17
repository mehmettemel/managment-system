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
  // Controlled props
  payments?: PaymentWithClass[];
  totalRecords?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  // Filter props
  classes?: { label: string; value: string }[];
  selectedClassFilter?: string | null;
  onClassFilterChange?: (value: string | null) => void;
}

export function PaymentHistory({
  memberId,
  classId,
  payments: controlledPayments,
  totalRecords: controlledTotal,
  page: controlledPage,
  pageSize: controlledPageSize = 10,
  onPageChange,
  classes,
  selectedClassFilter,
  onClassFilterChange,
}: PaymentHistoryProps) {
  const [internalPayments, setInternalPayments] = useState<PaymentWithClass[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [internalTotal, setInternalTotal] = useState(0);
  const [internalPage, setInternalPage] = useState(1);
  const internalPageSize = 10;

  const isControlled = controlledPayments !== undefined;
  const displayPayments = isControlled ? controlledPayments : internalPayments;
  const displayTotal = isControlled ? controlledTotal || 0 : internalTotal;
  const displayPage = isControlled ? controlledPage || 1 : internalPage;
  const displayPageSize = isControlled ? controlledPageSize : internalPageSize;

  const handlePageChange = (p: number) => {
    if (isControlled && onPageChange) {
      onPageChange(p);
    } else {
      setInternalPage(p);
    }
  };

  const fetchPayments = useCallback(async () => {
    if (isControlled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await getMemberPayments(
        memberId,
        internalPage,
        internalPageSize
      );
      if (response.error) {
        showError(response.error);
      } else {
        const { data, meta } = response.data;
        let filteredData = data || [];

        if (classId) {
          filteredData = filteredData.filter((p) => p.class_id === classId);
        }

        setInternalPayments(filteredData as PaymentWithClass[]);
        setInternalTotal(meta?.total || 0);
      }
    } catch (err) {
      console.error(err);
      showError('Ödeme geçmişi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [memberId, internalPage, classId, isControlled]);

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
      render: (row) => row.snapshot_class_name || row.classes?.name || '-',
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
      render: (row) => (
        <Badge color="green" variant="dot">
          Tamamlandı
        </Badge>
      ),
    },
  ];

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={5}>Ödeme Geçmişi</Title>
        {/* Render Filters if provided */}
        {classes && onClassFilterChange && (
          // Use a simple select or just show it's filtered
          <Badge variant="light">
            {selectedClassFilter
              ? classes.find((c) => c.value === selectedClassFilter)?.label
              : 'Tümü'}
          </Badge>
        )}
      </Group>
      <DataTable
        data={displayPayments}
        columns={columns}
        loading={loading}
        totalRecords={displayTotal}
        page={displayPage}
        onPageChange={handlePageChange}
        pageSize={displayPageSize}
      />
    </Stack>
  );
}

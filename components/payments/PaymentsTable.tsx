'use client';

import { useState, useEffect } from 'react';
import { Paper, MultiSelect, Group, Stack, Text, Badge } from '@mantine/core';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { getFilteredPayments } from '@/actions/payments';
import { useMembers } from '@/hooks/use-members';
import { useClasses } from '@/hooks/use-classes';
import { Payment } from '@/types';
import { formatCurrency, formatPaymentMethod } from '@/utils/formatters';
import dayjs from 'dayjs';
import { showError } from '@/utils/notifications';
import { TruncatedTooltip } from '@/components/shared/TruncatedTooltip';

// Extend Payment type to include joined relations
interface PaymentWithRelations extends Payment {
  members?: { id: number; first_name: string; last_name: string } | null;
  classes?: { id: number; name: string } | null;
}

export function PaymentsTable() {
  const [data, setData] = useState<PaymentWithRelations[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Sorting State
  const [sortField, setSortField] = useState<string>('payment_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filters State
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  // Fetched Data for Filters
  const { members } = useMembers();
  const { classes } = useClasses();

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await getFilteredPayments(
        page,
        pageSize,
        {
          memberIds: selectedMembers.length > 0 ? selectedMembers : undefined,
          classIds: selectedClasses.length > 0 ? selectedClasses : undefined,
          paymentMethods:
            selectedMethods.length > 0 ? selectedMethods : undefined,
        },
        {
          field: sortField,
          direction: sortDirection,
        }
      );

      if (response.error) {
        showError(response.error);
        setData([]);
      } else if (response.data) {
        setData(response.data.data as PaymentWithRelations[]);
        setTotalRecords(response.data.meta.total);
      }
    } catch (error) {
      console.error(error);
      showError('Ödemeler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [
    page,
    pageSize,
    selectedMembers,
    selectedClasses,
    selectedMethods,
    sortField,
    sortDirection,
  ]);

  // Handle Sort Change
  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    setPage(1); // Reset to first page on sort
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedMembers, selectedClasses, selectedMethods]);

  const columns: DataTableColumn<PaymentWithRelations>[] = [
    {
      key: 'payment_date',
      label: 'Tarih',
      sortable: true,
      render: (item) => dayjs(item.payment_date).format('DD MMM YYYY'),
    },
    {
      key: 'member_id',
      label: 'Üye',
      render: (item) =>
        item.members
          ? `${item.members.first_name} ${item.members.last_name}`
          : 'Silinmiş Üye',
    },
    {
      key: 'class_id',
      label: 'Ders',
      render: (item) => item.classes?.name || '-',
    },
    {
      key: 'amount',
      label: 'Tutar',
      sortable: true,
      render: (item) => (
        <Text fw={500} size="sm">
          {formatCurrency(item.amount)}
        </Text>
      ),
    },
    {
      key: 'payment_method',
      label: 'Ödeme Yöntemi',
      render: (item) => (
        <Badge variant="light" color="gray">
          {formatPaymentMethod(item.payment_method)}
        </Badge>
      ),
    },
    {
      key: 'description',
      label: 'Açıklama',
      render: (item) => (
        <TruncatedTooltip text={item.description} maxLength={25} size="sm" />
      ),
    },
    {
      key: 'period_start',
      label: 'Dönem',
      render: (item) =>
        item.period_start ? dayjs(item.period_start).format('MMMM YYYY') : '-',
    },
  ];

  const memberOptions = members.map((m) => ({
    value: String(m.id),
    label: `${m.first_name} ${m.last_name}`,
  }));

  const classOptions = classes.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  const methodOptions = [
    { value: 'Nakit', label: 'Nakit' },
    { value: 'Kredi Kartı', label: 'Kredi Kartı' },
    { value: 'Havale/EFT', label: 'Havale/EFT' },
  ];

  return (
    <Stack gap="md">
      {/* Filters */}
      <Paper withBorder p="md" radius="md">
        <Group align="flex-end">
          <MultiSelect
            label="Üye Filtresi"
            placeholder="Üye seçiniz"
            data={memberOptions}
            value={selectedMembers}
            onChange={setSelectedMembers}
            searchable
            clearable
            style={{ flex: 1 }}
          />
          <MultiSelect
            label="Ders Filtresi"
            placeholder="Ders seçiniz"
            data={classOptions}
            value={selectedClasses}
            onChange={setSelectedClasses}
            searchable
            clearable
            style={{ flex: 1 }}
          />
          <MultiSelect
            label="Ödeme Yöntemi"
            placeholder="Yöntem seçiniz"
            data={methodOptions}
            value={selectedMethods}
            onChange={setSelectedMethods}
            clearable
            style={{ flex: 1 }}
          />
        </Group>
      </Paper>

      {/* Table */}
      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        totalRecords={totalRecords}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        emptyText="Kriterlere uygun ödeme bulunamadı."
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
    </Stack>
  );
}

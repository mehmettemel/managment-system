'use client';

import { useState, useEffect } from 'react';
import {
  Paper,
  Group,
  Stack,
  Text,
  Badge,
  Button,
  Select,
  TextInput,
  ActionIcon,
  Menu,
} from '@mantine/core';
import {
  IconPlus,
  IconFileExport,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconSearch,
} from '@tabler/icons-react';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { getExpenses, deleteExpense, deleteExpenses, getAllExpenses } from '@/actions/expenses';
import { Expense, ExpenseCategory } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import dayjs from 'dayjs';
import { showError, showSuccess } from '@/utils/notifications';
import { TruncatedTooltip } from '@/components/shared/TruncatedTooltip';
import { ExpenseDrawer } from './ExpenseDrawer';
import { DateInput } from '@mantine/dates';
import { modals } from '@mantine/modals';

// Expense categories in Turkish
const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'Kantin', label: 'Kantin' },
  { value: 'Temizlik', label: 'Temizlik' },
  { value: 'Kira', label: 'Kira' },
  { value: 'Elektrik', label: 'Elektrik' },
  { value: 'Su', label: 'Su' },
  { value: 'İnternet', label: 'İnternet' },
  { value: 'Bakım-Onarım', label: 'Bakım-Onarım' },
  { value: 'Maaş', label: 'Maaş' },
  { value: 'Malzeme', label: 'Malzeme' },
  { value: 'Para İadesi', label: 'Para İadesi' },
  { value: 'Diğer', label: 'Diğer' },
];

export function ExpensesContent() {
  const [data, setData] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Sorting State
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Drawer State
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Selection State
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await getExpenses(page, pageSize, {
        category: selectedCategory || undefined,
        startDate: startDate ? dayjs(startDate).format('YYYY-MM-DD') : undefined,
        endDate: endDate ? dayjs(endDate).format('YYYY-MM-DD') : undefined,
        searchTerm: searchTerm || undefined,
      });

      if (response.error) {
        showError(response.error);
        setData([]);
      } else if (response.data) {
        setData(response.data.data);
        setTotalRecords(response.data.meta.total);
      }
    } catch (error) {
      console.error(error);
      showError('Giderler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [
    page,
    pageSize,
    selectedCategory,
    startDate,
    endDate,
    searchTerm,
    sortField,
    sortDirection,
  ]);

  // Handle Sort Change
  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    setPage(1);
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, startDate, endDate, searchTerm]);

  // Handle Add Expense
  const handleAdd = () => {
    setEditingExpense(null);
    setDrawerOpened(true);
  };

  // Handle Edit Expense
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDrawerOpened(true);
  };

  // Handle Delete Expense
  const handleDelete = async (id: number) => {
    modals.openConfirmModal({
      title: 'Gider Sil',
      children: <Text size="sm">Bu gideri silmek istediğinizden emin misiniz?</Text>,
      labels: { confirm: 'Sil', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const result = await deleteExpense(id);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess('Gider başarıyla silindi');
          fetchExpenses();
        }
      },
    });
  };

  // Handle Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    modals.openConfirmModal({
      title: 'Toplu Silme',
      children: (
        <Text size="sm">
          {selectedRows.length} gideri silmek istediğinizden emin misiniz?
        </Text>
      ),
      labels: { confirm: 'Sil', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const result = await deleteExpenses(selectedRows);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess(`${selectedRows.length} gider başarıyla silindi`);
          setSelectedRows([]);
          fetchExpenses();
        }
      },
    });
  };

  // Handle Drawer Close
  const handleDrawerClose = (shouldRefresh?: boolean) => {
    setDrawerOpened(false);
    setEditingExpense(null);
    if (shouldRefresh) {
      fetchExpenses();
    }
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Kantin: 'grape',
      Temizlik: 'blue',
      Kira: 'red',
      Elektrik: 'yellow',
      Su: 'cyan',
      İnternet: 'violet',
      'Bakım-Onarım': 'orange',
      Maaş: 'teal',
      Malzeme: 'pink',
      'Para İadesi': 'red',
      Diğer: 'gray',
    };
    return colors[category] || 'gray';
  };

  // Handle Export to CSV
  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await getAllExpenses({
        category: selectedCategory || undefined,
        startDate: startDate ? dayjs(startDate).format('YYYY-MM-DD') : undefined,
        endDate: endDate ? dayjs(endDate).format('YYYY-MM-DD') : undefined,
        searchTerm: searchTerm || undefined,
      });

      if (response.error || !response.data) {
        showError(response.error || 'Export işlemi başarısız');
        return;
      }

      // Create CSV content
      const headers = ['Tarih', 'Kategori', 'Açıklama', 'Tutar', 'Fiş No'];
      const csvRows = [headers.join(',')];

      response.data.forEach((expense) => {
        const row = [
          dayjs(expense.date).format('DD/MM/YYYY'),
          expense.category,
          `"${expense.description.replace(/"/g, '""')}"`, // Escape quotes
          expense.amount,
          expense.receipt_number || '',
        ];
        csvRows.push(row.join(','));
      });

      // Create and download file
      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `giderler_${dayjs().format('YYYY-MM-DD')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      showSuccess(`${response.data.length} gider başarıyla export edildi`);
    } catch (error) {
      console.error(error);
      showError('Export işlemi sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const columns: DataTableColumn<Expense>[] = [
    {
      key: 'date',
      label: 'Tarih',
      sortable: true,
      render: (item) => dayjs(item.date).format('DD MMM YYYY'),
    },
    {
      key: 'category',
      label: 'Kategori',
      render: (item) => (
        <Badge variant="light" color={getCategoryColor(item.category)}>
          {item.category}
        </Badge>
      ),
    },
    {
      key: 'description',
      label: 'Açıklama',
      render: (item) => (
        <TruncatedTooltip text={item.description} maxLength={30} size="sm" />
      ),
    },
    {
      key: 'amount',
      label: 'Tutar',
      sortable: true,
      render: (item) => (
        <Text fw={500} size="sm" c="red">
          -{formatCurrency(item.amount)}
        </Text>
      ),
    },
    {
      key: 'receipt_number',
      label: 'Fiş No',
      render: (item) => (
        <Text size="xs" c="dimmed">
          {item.receipt_number || '-'}
        </Text>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (item) => (
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEdit size={16} />}
              onClick={() => handleEdit(item)}
            >
              Düzenle
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash size={16} />}
              color="red"
              onClick={() => handleDelete(item.id)}
            >
              Sil
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ];

  return (
    <>
      <Stack gap="md">
        {/* Actions Bar */}
        <Group justify="space-between">
          <Group>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleAdd}
              variant="filled"
            >
              Gider Ekle
            </Button>
            {selectedRows.length > 0 && (
              <Button
                leftSection={<IconTrash size={16} />}
                onClick={handleBulkDelete}
                color="red"
                variant="light"
              >
                Seçilenleri Sil ({selectedRows.length})
              </Button>
            )}
          </Group>
          <Button
            leftSection={<IconFileExport size={16} />}
            variant="light"
            onClick={handleExport}
            loading={loading}
          >
            Dışa Aktar
          </Button>
        </Group>

        {/* Filters */}
        <Paper withBorder p="md" radius="md">
          <Group align="flex-end">
            <Select
              label="Kategori"
              placeholder="Tümü"
              data={EXPENSE_CATEGORIES}
              value={selectedCategory}
              onChange={setSelectedCategory}
              clearable
              style={{ flex: 1 }}
            />
            <DateInput
              label="Başlangıç Tarihi"
              placeholder="Seçiniz"
              value={startDate}
              onChange={setStartDate as any}
              clearable
              style={{ flex: 1 }}
            />
            <DateInput
              label="Bitiş Tarihi"
              placeholder="Seçiniz"
              value={endDate}
              onChange={setEndDate as any}
              clearable
              style={{ flex: 1 }}
            />
            <TextInput
              label="Ara"
              placeholder="Açıklama veya fiş no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
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
          emptyText="Kriterlere uygun gider bulunamadı."
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
        />
      </Stack>

      {/* Expense Drawer */}
      <ExpenseDrawer
        opened={drawerOpened}
        onClose={handleDrawerClose}
        expense={editingExpense}
      />
    </>
  );
}

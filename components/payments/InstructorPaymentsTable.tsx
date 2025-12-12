'use client';

import {
  Table,
  Button,
  Badge,
  Group,
  Text,
  Paper,
  Tabs,
  MultiSelect,
} from '@mantine/core';
import { processPayout, getFilteredInstructorPayouts } from '@/actions/finance';
import { showSuccess, showError } from '@/utils/notifications';
import { modals } from '@mantine/modals';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Instructor, InstructorPayoutWithDetails } from '@/types';
import { IconCash, IconHistory, IconListCheck } from '@tabler/icons-react';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import { DataTable, DataTableColumn } from '@/components/shared/DataTable';

interface PayableItem {
  instructor: Instructor;
  totalAmount: number;
  entryCount: number;
}

interface InstructorPaymentsTableProps {
  data: PayableItem[];
  // Payouts can be initial data or removed if we fetch everything client side for history
  // Keeping it as prop isn't strictly necessary if we fetch on mount, but let's keep it clean.
}

export function InstructorPaymentsTable({
  data,
}: InstructorPaymentsTableProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string | null>('payable');
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});

  // History State
  const [historyData, setHistoryData] = useState<InstructorPayoutWithDetails[]>(
    []
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortField, setSortField] = useState<string>('payment_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);

  // Create options for filter from the payable data (active instructors)
  // Ideally we should have a useInstructors hook or pass all instructors.
  // For now, let's use the instructors from the payable list + any others we might need?
  // Actually, better to use the unique instructors from the payable list if that's all we have,
  // BUT that only shows instructors who are owed money.
  // Let's assume for now we can filter by the instructors present in the payable list,
  // or I should fetch all instructors.
  // Since I don't have useInstructors hook handy in context, I'll derive from data OR
  // ideally I should fetch them. Let's see if I can use unique names from history? No.
  // Let's rely on `data` (Payable items) for now, as it contains active instructors usually.
  const instructorOptions = data.map((item) => ({
    value: String(item.instructor.id),
    label: `${item.instructor.first_name} ${item.instructor.last_name}`,
  }));

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await getFilteredInstructorPayouts(
        page,
        pageSize,
        {
          instructorIds:
            selectedInstructors.length > 0 ? selectedInstructors : undefined,
        },
        {
          field: sortField,
          direction: sortDirection,
        }
      );

      if (response.error) {
        showError(response.error);
        setHistoryData([]);
      } else if (response.data) {
        setHistoryData(response.data.data);
        setTotalRecords(response.data.meta.total);
      }
    } catch (error) {
      showError('Geçmiş yüklenirken hata oluştu');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [
    activeTab,
    page,
    pageSize,
    selectedInstructors,
    sortField,
    sortDirection,
  ]);

  // Handle Sort Change
  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    setPage(1);
  };

  const handlePay = (item: PayableItem) => {
    modals.openConfirmModal({
      title: 'Ödeme Onayı',
      children: (
        <Text size="sm">
          {item.instructor.first_name} {item.instructor.last_name} için{' '}
          <Text span fw={700}>
            {formatCurrency(item.totalAmount)}
          </Text>{' '}
          tutarındaki hakediş ödemesini onaylıyor musunuz?
        </Text>
      ),
      labels: { confirm: 'Ödeme Yap', cancel: 'İptal' },
      confirmProps: { color: 'green' },
      onConfirm: async () => {
        setLoadingMap((prev) => ({ ...prev, [item.instructor.id]: true }));
        try {
          const res = await processPayout(item.instructor.id, item.totalAmount);
          if (res.error) {
            showError(res.error);
          } else {
            showSuccess('Ödeme Başarılı');
            router.refresh();
            // Refresh history if active
            if (activeTab === 'history') fetchHistory();
          }
        } catch (err) {
          showError('Hata oluştu');
        } finally {
          setLoadingMap((prev) => ({ ...prev, [item.instructor.id]: false }));
        }
      },
    });
  };

  const historyColumns: DataTableColumn<InstructorPayoutWithDetails>[] = [
    {
      key: 'instructor_id',
      label: 'Eğitmen',
      sortable: false, // Relational sort complex, disabled for now or generic
      render: (row) =>
        `${row.instructors?.first_name} ${row.instructors?.last_name}`,
    },
    {
      key: 'payment_date',
      label: 'Tarih',
      sortable: true,
      render: (row) => formatDate(row.payment_date),
    },
    {
      key: 'amount',
      label: 'Tutar',
      sortable: true,
      render: (row) => (
        <Text c="green" fw={500}>
          {formatCurrency(row.amount)}
        </Text>
      ),
    },
    {
      key: 'note',
      label: 'Not',
      render: (row) => row.note || '-',
    },
  ];

  return (
    <Paper withBorder radius="md">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="payable" leftSection={<IconListCheck size={16} />}>
            Ödenecekler
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
            Ödeme Geçmişi
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="payable" p="md">
          {data.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">
              Şu an ödemesi gelen eğitmen bulunmamaktadır.
            </Text>
          ) : (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Eğitmen</Table.Th>
                  <Table.Th>Bekleyen Hakediş Sayısı</Table.Th>
                  <Table.Th>Toplam Tutar</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.map((item) => (
                  <Table.Tr key={item.instructor.id}>
                    <Table.Td fw={500}>
                      {item.instructor.first_name} {item.instructor.last_name}
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="lg">
                        {item.entryCount} İşlem
                      </Badge>
                    </Table.Td>
                    <Table.Td fw={700} fz="lg" c="green">
                      {formatCurrency(item.totalAmount)}
                    </Table.Td>
                    <Table.Td>
                      <Button
                        color="green"
                        leftSection={<IconCash size={16} />}
                        onClick={() => handlePay(item)}
                        loading={loadingMap[item.instructor.id]}
                      >
                        Ödeme Yap
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="history" p="md">
          <Group mb="md">
            <MultiSelect
              placeholder="Eğitmen Filtrele"
              data={instructorOptions}
              value={selectedInstructors}
              onChange={setSelectedInstructors}
              clearable
              searchable
              style={{ width: 300 }}
            />
          </Group>
          <DataTable
            data={historyData}
            columns={historyColumns}
            loading={historyLoading}
            totalRecords={totalRecords}
            page={page}
            onPageChange={setPage}
            pageSize={pageSize}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            emptyText="Geçmiş ödeme kaydı bulunamadı."
          />
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}

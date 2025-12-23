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
  Select,
  Stack,
} from '@mantine/core';
import {
  processPayout,
  getFilteredInstructorPayouts,
  getInstructorLedgerDetails,
} from '@/actions/finance';
import { showSuccess, showError } from '@/utils/notifications';
import { modals } from '@mantine/modals';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Instructor, InstructorPayoutWithDetails } from '@/types';
import { IconCash, IconHistory, IconListCheck, IconReceipt } from '@tabler/icons-react';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import { DataTable, DataTableColumn } from '@/components/shared/DataTable';
import { InstructorPaymentModal } from './InstructorPaymentModal';

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

  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState<{
    opened: boolean;
    instructor: Instructor | null;
    totalAmount: number;
    entryCount: number;
  }>({
    opened: false,
    instructor: null,
    totalAmount: 0,
    entryCount: 0,
  });

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

  // Ledger Details State
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerInstructorFilter, setLedgerInstructorFilter] = useState<string | null>(null);
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<'pending' | 'paid' | 'all'>('all');

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

  const fetchLedgerDetails = async () => {
    setLedgerLoading(true);
    try {
      const response = await getInstructorLedgerDetails(
        ledgerInstructorFilter ? Number(ledgerInstructorFilter) : undefined,
        ledgerStatusFilter
      );

      if (response.error) {
        showError(response.error);
        setLedgerData([]);
      } else if (response.data) {
        setLedgerData(response.data);
      }
    } catch (error) {
      showError('Komisyon detayları yüklenirken hata oluştu');
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    } else if (activeTab === 'details') {
      fetchLedgerDetails();
    }
  }, [
    activeTab,
    page,
    pageSize,
    selectedInstructors,
    sortField,
    sortDirection,
    ledgerInstructorFilter,
    ledgerStatusFilter,
  ]);

  // Handle Sort Change
  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    setPage(1);
  };

  const handlePay = (item: PayableItem) => {
    setPaymentModal({
      opened: true,
      instructor: item.instructor,
      totalAmount: item.totalAmount,
      entryCount: item.entryCount,
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
      key: 'notes',
      label: 'Not',
      render: (row) => row.notes || '-',
    },
  ];

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'green';
      case 'pending':
      case 'payable':
        return 'orange';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Ödendi';
      case 'pending':
        return 'Beklemede';
      case 'payable':
        return 'Ödenebilir';
      case 'cancelled':
        return 'İptal';
      default:
        return status;
    }
  };

  return (
    <Paper withBorder radius="md">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="payable" leftSection={<IconListCheck size={16} />}>
            Ödenecekler
          </Tabs.Tab>
          <Tabs.Tab value="details" leftSection={<IconReceipt size={16} />}>
            Komisyon Detayları
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

        <Tabs.Panel value="details" p="md">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Group>
                <Select
                  placeholder="Tüm Eğitmenler"
                  data={[
                    { value: 'all', label: 'Tüm Eğitmenler' },
                    ...instructorOptions,
                  ]}
                  value={ledgerInstructorFilter || 'all'}
                  onChange={(val) =>
                    setLedgerInstructorFilter(val === 'all' ? null : val)
                  }
                  clearable
                  searchable
                  style={{ width: 250 }}
                />
                <Select
                  placeholder="Durum"
                  data={[
                    { value: 'all', label: 'Tümü' },
                    { value: 'pending', label: 'Bekleyen' },
                    { value: 'paid', label: 'Ödenen' },
                  ]}
                  value={ledgerStatusFilter}
                  onChange={(val) =>
                    setLedgerStatusFilter((val as any) || 'all')
                  }
                  style={{ width: 150 }}
                />
              </Group>
              {ledgerData.length > 0 && (
                <Group gap="xl">
                  <div>
                    <Text size="xs" c="dimmed">
                      Toplam Kayıt
                    </Text>
                    <Text fw={700} size="lg">
                      {ledgerData.length}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Toplam Komisyon
                    </Text>
                    <Text fw={700} size="lg" c="blue">
                      {formatCurrency(
                        ledgerData.reduce((sum, entry) => sum + Number(entry.amount), 0)
                      )}
                    </Text>
                  </div>
                </Group>
              )}
            </Group>

            {ledgerLoading ? (
              <Text ta="center" c="dimmed" py="xl">
                Yükleniyor...
              </Text>
            ) : ledgerData.length === 0 ? (
              <Text ta="center" c="dimmed" py="xl">
                Komisyon kaydı bulunamadı.
              </Text>
            ) : (
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Eğitmen</Table.Th>
                    <Table.Th>Öğrenci</Table.Th>
                    <Table.Th>Ders</Table.Th>
                    <Table.Th>Ödeme Tutarı</Table.Th>
                    <Table.Th>Komisyon</Table.Th>
                    <Table.Th>Ödeme Tarihi</Table.Th>
                    <Table.Th>Vade Tarihi</Table.Th>
                    <Table.Th>Durum</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {ledgerData.map((entry) => {
                    const payment = entry.payments as any;
                    const member = payment?.members;
                    const classData = payment?.classes;
                    const instructor = entry.instructors;

                    return (
                      <Table.Tr key={entry.id}>
                        <Table.Td>
                          {instructor
                            ? `${instructor.first_name} ${instructor.last_name}`
                            : '-'}
                        </Table.Td>
                        <Table.Td>
                          {member
                            ? `${member.first_name} ${member.last_name}`
                            : '-'}
                        </Table.Td>
                        <Table.Td>{classData?.name || '-'}</Table.Td>
                        <Table.Td>
                          <Text fw={500}>
                            {payment?.amount
                              ? formatCurrency(payment.amount)
                              : '-'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={700} c="blue">
                            {formatCurrency(entry.amount)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {payment?.payment_date
                            ? formatDate(payment.payment_date)
                            : '-'}
                        </Table.Td>
                        <Table.Td>{formatDate(entry.due_date)}</Table.Td>
                        <Table.Td>
                          <Badge
                            color={getStatusBadgeColor(entry.status)}
                            variant="light"
                          >
                            {getStatusLabel(entry.status)}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
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

      {/* Month-by-Month Payment Modal */}
      <InstructorPaymentModal
        opened={paymentModal.opened}
        onClose={() =>
          setPaymentModal({
            opened: false,
            instructor: null,
            totalAmount: 0,
            entryCount: 0,
          })
        }
        instructor={paymentModal.instructor}
        totalPending={paymentModal.totalAmount}
        entryCount={paymentModal.entryCount}
        onSuccess={() => {
          router.refresh();
          if (activeTab === 'history') fetchHistory();
          if (activeTab === 'details') fetchLedgerDetails();
        }}
      />
    </Paper>
  );
}

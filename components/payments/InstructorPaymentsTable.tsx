'use client';

import { Table, Button, Badge, Group, Text, Paper, Tabs } from '@mantine/core';
import { processPayout } from '@/actions/finance';
import { showSuccess, showError } from '@/utils/notifications';
import { modals } from '@mantine/modals';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Instructor, InstructorPayout } from '@/types';
import { IconCash, IconHistory, IconListCheck } from '@tabler/icons-react';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import { DataTable, DataTableColumn } from '@/components/shared/DataTable';

interface PayableItem {
  instructor: Instructor;
  totalAmount: number;
  entryCount: number;
}

// Extend Payout type to include instructor details
interface InstructorPayoutWithType extends InstructorPayout {
  instructors?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface InstructorPaymentsTableProps {
  data: PayableItem[];
  payouts: InstructorPayoutWithType[];
}

export function InstructorPaymentsTable({
  data,
  payouts,
}: InstructorPaymentsTableProps) {
  const router = useRouter();
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});

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
          }
        } catch (err) {
          showError('Hata oluştu');
        } finally {
          setLoadingMap((prev) => ({ ...prev, [item.instructor.id]: false }));
        }
      },
    });
  };

  const historyColumns: DataTableColumn<InstructorPayoutWithType>[] = [
    {
      key: 'instructor_id',
      label: 'Eğitmen',
      render: (row) =>
        `${row.instructors?.first_name} ${row.instructors?.last_name}`,
    },
    {
      key: 'payment_date',
      label: 'Tarih',
      render: (row) => formatDate(row.payment_date),
    },
    {
      key: 'amount',
      label: 'Tutar',
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
      <Tabs defaultValue="payable">
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
          <DataTable
            data={payouts}
            columns={historyColumns}
            pageSize={10}
            emptyText="Geçmiş ödeme kaydı bulunamadı."
          />
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}

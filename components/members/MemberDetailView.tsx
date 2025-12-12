'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Title,
  Text,
  Card,
  Group,
  Stack,
  Loader,
  Center,
  ActionIcon,
  Badge,
  Container,
  SimpleGrid,
  Tabs,
  Button,
  Grid,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconPhone,
  IconCalendar,
  IconHistory,
} from '@tabler/icons-react';
import { getMemberById, transferMember } from '@/actions/members';
import { getMemberPayments, processClassPayment } from '@/actions/payments';
import { formatPhone, formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import { Member, MemberClassWithDetails, Payment } from '@/types';
import { EnrollmentCard } from './EnrollmentCard';
import { MemberTransferModal } from './MemberTransferModal';
import { PaymentConfirmModal } from '@/components/payments/PaymentConfirmModal';
import { DataTable, DataTableColumn } from '@/components/shared/DataTable';
import { showSuccess, showError } from '@/utils/notifications';
import { useClasses } from '@/hooks/use-classes';

interface MemberDetailViewProps {
  memberId: number;
}

export function MemberDetailView({ memberId }: MemberDetailViewProps) {
  const router = useRouter();
  const { classes } = useClasses(); // For transfer modal options

  const [member, setMember] = useState<Member | null>(null);
  const [activeEnrollments, setActiveEnrollments] = useState<
    MemberClassWithDetails[]
  >([]);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [transferModal, setTransferModal] = useState<{
    open: boolean;
    enrollment: MemberClassWithDetails | null;
  }>({ open: false, enrollment: null });
  const [payModal, setPayModal] = useState<{
    open: boolean;
    enrollment: MemberClassWithDetails | null;
  }>({ open: false, enrollment: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [memberRes, paymentsRes] = await Promise.all([
        getMemberById(memberId),
        getMemberPayments(memberId),
      ]);

      if (memberRes.data) {
        setMember(memberRes.data);
        // Filter for active enrollments
        setActiveEnrollments(
          memberRes.data.member_classes.filter((mc) => mc.active) || []
        );
      }

      if (paymentsRes.data) {
        setPaymentHistory(paymentsRes.data);
      }
    } catch (error) {
      console.error(error);
      showError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleTransferClick = (enrollment: MemberClassWithDetails) => {
    setTransferModal({ open: true, enrollment });
  };

  const handlePayClick = (enrollment: MemberClassWithDetails) => {
    setPayModal({ open: true, enrollment });
  };

  const onTransferConfirm = async (values: {
    newClassId: string;
    priceStrategy: 'KEEP_OLD' | 'USE_NEW';
  }) => {
    if (!transferModal.enrollment) return;

    setActionLoading(true);
    const result = await transferMember(
      memberId,
      transferModal.enrollment.class_id,
      Number(values.newClassId),
      values.priceStrategy
    );

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Transfer başarıyla gerçekleşti');
      setTransferModal({ open: false, enrollment: null });
      fetchData();
    }
    setActionLoading(false);
  };

  const onPayConfirm = async (values: {
    amount: number;
    paymentMethod: string;
    description?: string;
  }) => {
    if (!payModal.enrollment) return;

    setActionLoading(true);
    // Determine the period date (next_payment_date or today if null)
    // Next payment date is usually the START of the period we are paying for?
    // Or the END?
    // "Sonraki Ödeme Tarihi" usually means DUE DATE.
    // If due date is 20 Oct, and I pay, I am paying for period starting 20 Oct?
    // Let's assume periodDate = next_payment_date if exists, else today.
    const periodDate =
      payModal.enrollment.next_payment_date || new Date().toISOString();

    const result = await processClassPayment({
      memberId,
      classId: payModal.enrollment.class_id,
      amount: values.amount,
      paymentMethod: values.paymentMethod,
      periodDate: periodDate,
      description: values.description,
    });

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Ödeme alındı');
      setPayModal({ open: false, enrollment: null });
      fetchData();
    }
    setActionLoading(false);
  };

  // Setup column for payment history
  const historyColumns: DataTableColumn<Payment>[] = [
    {
      key: 'snapshot_class_name',
      label: 'Ders',
      render: (row) => (
        <Text fw={500}>
          {row.snapshot_class_name || (row as any).classes?.name || '-'}
        </Text>
      ),
    },
    {
      key: 'period_start',
      label: 'Dönem',
      render: (row) =>
        row.period_start ? formatDate(row.period_start, 'MMMM YYYY') : '-',
    },
    {
      key: 'amount',
      label: 'Tutar',
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: 'payment_date',
      label: 'İşlem Tarihi',
      render: (row) => formatDate(row.payment_date),
    },
    {
      key: 'payment_method',
      label: 'Yöntem',
      render: (row) => row.payment_method,
    },
    {
      key: 'snapshot_price',
      label: 'Kayıtlı Fiyat',
      render: (row) =>
        row.snapshot_price ? formatCurrency(row.snapshot_price) : '-',
    },
  ];

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!member) {
    return (
      <Center h={400}>
        <Text>Üye bulunamadı.</Text>
      </Center>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group align="flex-start" justify="space-between">
          <Group>
            <ActionIcon
              variant="light"
              color="gray"
              size="lg"
              onClick={() => router.back()}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <div>
              <Group gap="xs">
                <Title order={2}>
                  {member.first_name} {member.last_name}
                </Title>
                <Badge
                  color={
                    member.status === 'active'
                      ? 'green'
                      : member.status === 'frozen'
                        ? 'blue'
                        : 'gray'
                  }
                >
                  {member.status === 'active'
                    ? 'Aktif'
                    : member.status === 'frozen'
                      ? 'Dondurulmuş'
                      : 'Arşivlenmiş'}
                </Badge>
              </Group>
              <Group gap="lg" mt="xs">
                {member.phone && (
                  <Group gap={4}>
                    <IconPhone size={16} style={{ opacity: 0.7 }} />
                    <Text size="sm">{formatPhone(member.phone)}</Text>
                  </Group>
                )}
                <Group gap={4}>
                  <IconCalendar size={16} style={{ opacity: 0.7 }} />
                  <Text size="sm">Kayıt: {formatDate(member.join_date)}</Text>
                </Group>
              </Group>
            </div>
          </Group>
        </Group>

        {/* Active Enrollments */}
        <Title order={4}>Kayıtlı Dersler</Title>
        {activeEnrollments.length === 0 ? (
          <Card withBorder>
            <Text c="dimmed" ta="center">
              Aktif ders kaydı bulunmuyor.
            </Text>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {activeEnrollments.map((enrollment) => (
              <EnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
                onPay={() => handlePayClick(enrollment)}
                onTransfer={() => handleTransferClick(enrollment)}
              />
            ))}
          </SimpleGrid>
        )}

        {/* History Tabs */}
        <Card withBorder radius="md" mt="lg">
          <Tabs defaultValue="history">
            <Tabs.List>
              <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
                Ödeme Geçmişi
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="history" pt="md">
              <DataTable
                data={paymentHistory}
                columns={historyColumns}
                pageSize={10}
                emptyText="Ödeme geçmişi bulunamadı."
              />
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>

      {/* Modals */}
      {transferModal.enrollment && (
        <MemberTransferModal
          opened={transferModal.open}
          onClose={() => setTransferModal({ ...transferModal, open: false })}
          enrollment={transferModal.enrollment}
          classes={classes}
          onConfirm={onTransferConfirm}
          loading={actionLoading}
        />
      )}

      {payModal.enrollment && (
        <PaymentConfirmModal
          opened={payModal.open}
          onClose={() => setPayModal({ ...payModal, open: false })}
          onConfirm={onPayConfirm}
          loading={actionLoading}
          item={{
            amount:
              payModal.enrollment.custom_price ??
              payModal.enrollment.classes?.price_monthly ??
              0,
            periodLabel: payModal.enrollment.next_payment_date
              ? formatDate(payModal.enrollment.next_payment_date, 'MMMM YYYY')
              : 'Ödeme',
            status: 'unpaid',
            periodMonth:
              payModal.enrollment.next_payment_date || new Date().toISOString(),
          }}
        />
      )}
    </Container>
  );
}

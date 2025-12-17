'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Button,
  Alert,
  ThemeIcon,
  Divider,
  SimpleGrid,
  Modal,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconPhone,
  IconCalendar,
  IconHistory,
  IconAlertCircle,
  IconCreditCard,
  IconUser,
  IconClock,
} from '@tabler/icons-react';
import {
  getMemberById,
  updateMemberClassDetails,
  terminateEnrollment,
} from '@/actions/members';
import { getMemberPayments, processClassPayment } from '@/actions/payments';
import { getClassById } from '@/actions/classes';
import { unfreezeLog } from '@/actions/freeze';
import { TerminationModal } from '../members/TerminationModal';
import { TerminationFormValues } from '@/types';
import { formatPhone, formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import {
  MemberClassWithDetails,
  PaymentWithClass,
  MemberWithClasses,
  PaymentType,
  ClassWithInstructor,
} from '@/types';
import { EnrollmentCard } from '../members/EnrollmentCard';
import { FreezeMemberDrawer } from '../members/FreezeMemberDrawer';
import { PaymentScheduleTable } from '../members/PaymentScheduleTable';
import { PaymentConfirmModal } from '@/components/payments/PaymentConfirmModal';
import { DataTable, DataTableColumn } from '@/components/shared/DataTable';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { getPaymentSchedule } from '@/actions/payments';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import type { PaymentScheduleItem } from '@/types';
import { showSuccess, showError } from '@/utils/notifications';
import { TruncatedTooltip } from '@/components/shared/TruncatedTooltip';
import { EditEnrollmentModal } from '../members/EditEnrollmentModal';

interface EnrollmentDetailViewProps {
  enrollmentId: number;
  memberId: number;
  classId: number;
  effectiveDate: string;
}

export function EnrollmentDetailView({
  enrollmentId,
  memberId,
  classId,
  effectiveDate,
}: EnrollmentDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromMember = searchParams.get('from') === 'member';

  const [member, setMember] = useState<MemberWithClasses | null>(null);
  const [classData, setClassData] = useState<ClassWithInstructor | null>(null);
  const [enrollment, setEnrollment] = useState<MemberClassWithDetails | null>(
    null
  );
  const [paymentHistory, setPaymentHistory] = useState<PaymentWithClass[]>([]);
  const [allPaymentHistory, setAllPaymentHistory] = useState<
    PaymentWithClass[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize] = useState(10);
  const [paymentTotalRecords, setPaymentTotalRecords] = useState(0);

  // Modals state
  const [payModal, setPayModal] = useState<{
    open: boolean;
    enrollment: MemberClassWithDetails | null;
  }>({ open: false, enrollment: null });
  const [scheduleModal, setScheduleModal] = useState<{
    open: boolean;
    enrollment: MemberClassWithDetails | null;
    schedule: PaymentScheduleItem[];
  }>({ open: false, enrollment: null, schedule: [] });
  const [freezeModal, setFreezeModal] = useState<{
    open: boolean;
    enrollment: MemberClassWithDetails | null;
  }>({ open: false, enrollment: null });
  const [dropModal, setDropModal] = useState<{
    open: boolean;
    enrollment: MemberClassWithDetails | null;
  }>({ open: false, enrollment: null });
  const [editModal, setEditModal] = useState<{
    open: boolean;
    enrollment: MemberClassWithDetails | null;
  }>({ open: false, enrollment: null });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [memberRes, classRes, paginatedPaymentsRes, allPaymentsRes] =
        await Promise.all([
          getMemberById(memberId),
          getClassById(classId),
          getMemberPayments(memberId, paymentPage, paymentPageSize),
          getMemberPayments(memberId, 1, 9999),
        ]);

      if (memberRes.data) {
        setMember(memberRes.data);
        const enrollmentData = memberRes.data.member_classes?.find(
          (mc: any) => mc.id === enrollmentId
        );
        setEnrollment((enrollmentData as any) || null);
      }

      if (classRes.data) {
        setClassData(classRes.data);
      }

      if (paginatedPaymentsRes.data) {
        // Filter only this class payments
        const classPayments = paginatedPaymentsRes.data.data.filter(
          (p: PaymentWithClass) => p.member_class_id === enrollmentId
        );
        setPaymentHistory(classPayments);
        setPaymentTotalRecords(classPayments.length);
      }

      if (allPaymentsRes.data) {
        const allClassPayments = allPaymentsRes.data.data.filter(
          (p: PaymentWithClass) => p.member_class_id === enrollmentId
        );
        setAllPaymentHistory(allClassPayments);
      }
    } catch (error) {
      console.error(error);
      showError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [memberId, classId, enrollmentId, paymentPage, paymentPageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEditPriceClick = (enrollment: MemberClassWithDetails) => {
    setEditModal({ open: true, enrollment });
  };

  const onEditEnrollmentConfirm = async (values: {
    price: number;
    payment_interval: number;
    custom_price?: number;
  }) => {
    if (!editModal.enrollment) return;

    setActionLoading(true);
    const result = await updateMemberClassDetails(
      editModal.enrollment.member_id,
      editModal.enrollment.class_id,
      {
        custom_price: values.custom_price,
        payment_interval: values.payment_interval,
      }
    );

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Ders planı güncellendi');
      setEditModal({ open: false, enrollment: null });
      setPaymentPage(1);
      fetchData();
    }
    setActionLoading(false);
  };

  const isDateFrozen = (
    enrollment: MemberClassWithDetails,
    date: dayjs.Dayjs
  ): boolean => {
    const enrollmentFrozenLogs =
      member?.frozen_logs?.filter(
        (log) => log.member_class_id === enrollment.id
      ) || [];

    return enrollmentFrozenLogs.some((log) => {
      const freezeStart = dayjs(log.start_date);
      const freezeEnd = log.end_date
        ? dayjs(log.end_date)
        : dayjs('2099-12-31');

      return (
        date.isSameOrAfter(freezeStart, 'day') &&
        date.isSameOrBefore(freezeEnd, 'day')
      );
    });
  };

  const getComputedNextDate = (enrollment: MemberClassWithDetails): string => {
    const classPayments = allPaymentHistory.filter((p) => {
      if (p.member_class_id) {
        return p.member_class_id === enrollment.id;
      }
      if (p.class_id === enrollment.class_id) {
        const paymentDate = dayjs(p.period_start);
        const enrollStart = dayjs(enrollment.created_at);
        return paymentDate.isSameOrAfter(enrollStart, 'day');
      }
      return false;
    });

    const paidDates = new Set(
      classPayments.map((p) => dayjs(p.period_start).format('YYYY-MM-DD'))
    );

    const enrollmentDate = dayjs(enrollment.created_at || new Date());
    let check = enrollmentDate;

    for (let i = 0; i < 120; i++) {
      if (isDateFrozen(enrollment, check)) {
        check = check.add(1, 'month');
        continue;
      }

      if (paidDates.has(check.format('YYYY-MM-DD'))) {
        check = check.add(1, 'month');
      } else {
        return check.format('YYYY-MM-DD');
      }
    }
    return check.format('YYYY-MM-DD');
  };

  const getOverdueMonthsCount = (
    enrollment: MemberClassWithDetails
  ): number => {
    const classPayments = allPaymentHistory.filter((p) => {
      if (p.member_class_id) {
        return p.member_class_id === enrollment.id;
      }
      if (p.class_id === enrollment.class_id) {
        const paymentDate = dayjs(p.period_start);
        const enrollStart = dayjs(enrollment.created_at);
        return paymentDate.isSameOrAfter(enrollStart, 'day');
      }
      return false;
    });

    const paidDates = new Set(
      classPayments.map((p) => dayjs(p.period_start).format('YYYY-MM-DD'))
    );

    const enrollmentDate = dayjs(enrollment.created_at || new Date());
    const today = dayjs(effectiveDate);
    let overdueCount = 0;
    let check = enrollmentDate;

    for (let i = 0; i < 120; i++) {
      if (check.isSameOrAfter(today, 'day')) {
        break;
      }

      if (isDateFrozen(enrollment, check)) {
        check = check.add(1, 'month');
        continue;
      }

      if (!paidDates.has(check.format('YYYY-MM-DD'))) {
        overdueCount++;
      }

      check = check.add(1, 'month');
    }

    return overdueCount;
  };

  const handlePayClick = (enrollment: MemberClassWithDetails) => {
    const computedDate = getComputedNextDate(enrollment);
    setPayModal({
      open: true,
      enrollment: { ...enrollment, next_payment_date: computedDate },
    });
  };

  const handleFreezeClick = (enrollment: MemberClassWithDetails) => {
    setFreezeModal({ open: true, enrollment });
  };

  const handleDropClick = (enrollment: MemberClassWithDetails) => {
    setDropModal({ open: true, enrollment });
  };

  const handleUnfreezeLog = async (logId: number) => {
    setActionLoading(true);
    const result = await unfreezeLog(logId);
    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Ders aktifleştirildi');
      fetchData();
    }
    setActionLoading(false);
  };

  const handleViewSchedule = async (enrollment: MemberClassWithDetails) => {
    setActionLoading(true);
    const res = await getPaymentSchedule(memberId, enrollment.id);
    if (res.data) {
      setScheduleModal({ open: true, enrollment, schedule: res.data });
    } else {
      showError('Ödeme planı yüklenemedi');
    }
    setActionLoading(false);
  };

  const onDropConfirm = async (values: TerminationFormValues) => {
    if (!dropModal.enrollment) return;

    setActionLoading(true);
    const result = await terminateEnrollment(dropModal.enrollment.id, {
      terminationDate: values.terminationDate,
      financialAction: values.financialAction,
      refundAmount: values.refundAmount,
    });

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Ders sonlandırma işlemi başarılı');
      router.push(`/classes?openDrawer=${classId}`);
    }
    setActionLoading(false);
  };

  const onPayConfirm = async (values: {
    amount: number;
    paymentMethod: string;
    description?: string;
    monthCount?: number;
    targetPeriods?: string[];
    paymentType?: PaymentType;
  }) => {
    if (!payModal.enrollment) return;

    setActionLoading(true);
    const periodDate =
      payModal.enrollment.next_payment_date || new Date().toISOString();

    const result = await processClassPayment({
      memberId,
      classId: payModal.enrollment.class_id,
      amount: values.amount,
      paymentMethod: values.paymentMethod,
      periodDate: periodDate,
      description: values.description,
      monthCount: values.monthCount,
      targetPeriods: values.targetPeriods,
      paymentType: values.paymentType,
    });

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Ödeme alındı');
      setPayModal({ open: false, enrollment: null });
      setPaymentPage(1);
      fetchData();
    }
    setActionLoading(false);
  };

  const historyColumns: DataTableColumn<PaymentWithClass>[] = [
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
      label: 'Ödeme Tarihi',
      render: (row) => formatDate(row.payment_date),
    },
    {
      key: 'payment_method',
      label: 'Yöntem',
      render: (row) => row.payment_method,
    },
    {
      key: 'description',
      label: 'Açıklama',
      render: (row) => (
        <TruncatedTooltip text={row.description} maxLength={30} size="sm" />
      ),
    },
  ];

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!member || !enrollment || !classData) {
    return (
      <Center h={400}>
        <Text>Kayıt bulunamadı.</Text>
      </Center>
    );
  }

  const lastPaymentDate = allPaymentHistory
    .filter((p) => p.member_class_id === enrollmentId)
    .sort(
      (a, b) =>
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    )[0]?.payment_date;

  const computedEnrollment = {
    ...enrollment,
    next_payment_date: getComputedNextDate(enrollment),
    overdueMonthsCount: getOverdueMonthsCount(enrollment),
  };

  const activeLog = member.frozen_logs?.find(
    (log) => log.member_class_id === enrollment.id && !log.end_date
  );

  const enrollmentFrozenLogs =
    member.frozen_logs?.filter(
      (log) => log.member_class_id === enrollment.id
    ) || [];

  const isOverdue = !activeLog && computedEnrollment.overdueMonthsCount > 0;

  const enrollmentPrice =
    computedEnrollment.custom_price ??
    computedEnrollment.classes?.price_monthly ??
    0;

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group align="flex-start">
          <ActionIcon
            variant="light"
            color="gray"
            size="lg"
            onClick={() => {
              if (fromMember) {
                router.push(`/members/${memberId}`);
              } else {
                router.push(`/classes?openDrawer=${classId}`);
              }
            }}
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <div style={{ flex: 1 }}>
            <Group gap="xs" mb={4}>
              <Title order={2}>
                {member.first_name} {member.last_name}
              </Title>
              <Badge size="lg" variant="dot" color="blue">
                Ders Detayı
              </Badge>
            </Group>
            {member.phone && (
              <Group gap={4}>
                <IconPhone size={16} style={{ opacity: 0.7 }} />
                <Text size="sm" c="dimmed">
                  {formatPhone(member.phone)}
                </Text>
              </Group>
            )}
          </div>
        </Group>

        {/* Overdue Alert */}
        {isOverdue && computedEnrollment.overdueMonthsCount > 0 && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Gecikmiş Ödemeler"
            color="red"
            variant="filled"
          >
            <Text size="sm" c="white">
              Bu derste{' '}
              <strong>{computedEnrollment.overdueMonthsCount} aylık</strong>{' '}
              gecikmiş ödeme var. İlk gecikme:{' '}
              {formatDate(computedEnrollment.next_payment_date!)}
            </Text>
          </Alert>
        )}

        {/* Main Enrollment Card */}
        <Card withBorder padding="lg" radius="md">
          <Stack gap="lg">
            {/* Ders Başlığı ve Durum */}
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Group>
                <ThemeIcon size={50} radius="md" variant="light" color="blue">
                  <IconCreditCard size={28} />
                </ThemeIcon>
                <div>
                  <Title order={3}>{classData.name}</Title>
                  <Group gap="xs" mt={4}>
                    <Badge variant="light" color="blue">
                      {classData.day_of_week}
                    </Badge>
                    <Text size="sm" c="dimmed">
                      {classData.start_time?.toString().slice(0, 5)} •{' '}
                      {classData.duration_minutes} dk
                    </Text>
                    {classData.instructors && (
                      <>
                        <Text size="sm" c="dimmed">
                          •
                        </Text>
                        <Group gap={4}>
                          <IconUser size={14} />
                          <Text size="sm" c="dimmed">
                            {classData.instructors.first_name}{' '}
                            {classData.instructors.last_name}
                          </Text>
                        </Group>
                      </>
                    )}
                  </Group>
                </div>
              </Group>

              <Group gap="xs">
                {computedEnrollment.active ? (
                  <Badge color="green" size="lg" variant="light">
                    AKTİF
                  </Badge>
                ) : (
                  <Badge color="gray" size="lg" variant="light">
                    PASİF
                  </Badge>
                )}
                {activeLog && (
                  <Badge color="blue" size="lg" variant="filled">
                    DONDURULMUŞ
                  </Badge>
                )}
              </Group>
            </Group>

            <Divider />

            {/* Bilgiler Grid */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
              <div>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb={4}>
                  Kayıt Tarihi
                </Text>
                <Group gap={6}>
                  <IconCalendar size={18} style={{ opacity: 0.6 }} />
                  <Text fw={600} size="md">
                    {formatDate(computedEnrollment.created_at)}
                  </Text>
                </Group>
              </div>

              <div>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb={4}>
                  Son Ödeme
                </Text>
                <Group gap={6}>
                  <IconHistory size={18} style={{ opacity: 0.6 }} />
                  <Text fw={600} size="md">
                    {lastPaymentDate ? formatDate(lastPaymentDate) : '-'}
                  </Text>
                </Group>
              </div>

              <div>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb={4}>
                  Sonraki Ödeme
                </Text>
                <Text
                  fw={700}
                  size="md"
                  c={isOverdue ? 'red' : activeLog ? 'dimmed' : 'green'}
                >
                  {computedEnrollment.next_payment_date
                    ? formatDate(computedEnrollment.next_payment_date)
                    : '-'}
                </Text>
                {isOverdue && (
                  <Badge size="xs" color="red" variant="filled" mt={4}>
                    GECİKMİŞ
                  </Badge>
                )}
              </div>

              <div>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb={4}>
                  Aylık Ücret
                </Text>
                <Text fw={700} size="lg" c="orange">
                  {formatCurrency(enrollmentPrice)}
                </Text>
                {computedEnrollment.custom_price && (
                  <Badge size="xs" color="orange" variant="light" mt={4}>
                    ÖZEL
                  </Badge>
                )}
              </div>
            </SimpleGrid>

            <Divider />

            {/* Action Buttons */}
            <Group justify="space-between" wrap="wrap">
              <Group gap="sm">
                <Button
                  leftSection={<IconCreditCard size={18} />}
                  color="green"
                  size="md"
                  onClick={() => handlePayClick(computedEnrollment)}
                  disabled={!!activeLog}
                >
                  Ödeme Al
                </Button>

                <Button
                  variant="light"
                  color="blue"
                  size="md"
                  onClick={() => handleViewSchedule(computedEnrollment)}
                >
                  Ödeme Planı
                </Button>

                <Button
                  variant="light"
                  color="orange"
                  size="md"
                  onClick={() => handleEditPriceClick(computedEnrollment)}
                >
                  Fiyat Düzenle
                </Button>
              </Group>

              <Group gap="sm">
                {activeLog ? (
                  <Button
                    variant="light"
                    color="green"
                    size="md"
                    onClick={() => handleUnfreezeLog(activeLog.id)}
                  >
                    Dondurma Kaldır
                  </Button>
                ) : (
                  <Button
                    variant="light"
                    color="blue"
                    size="md"
                    onClick={() => handleFreezeClick(computedEnrollment)}
                  >
                    Dondur
                  </Button>
                )}

                <Button
                  variant="light"
                  color="red"
                  size="md"
                  onClick={() => handleDropClick(computedEnrollment)}
                >
                  Dersten Çıkar
                </Button>
              </Group>
            </Group>
          </Stack>
        </Card>

        {/* Payment History */}
        <Card withBorder radius="md" padding="lg">
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <IconHistory size={20} />
              <Title order={4}>Ödeme Geçmişi</Title>
            </Group>
          </Group>
          <DataTable
            data={paymentHistory}
            columns={historyColumns}
            pageSize={paymentPageSize}
            emptyText="Bu derse ait ödeme geçmişi bulunamadı."
            totalRecords={paymentTotalRecords}
            page={paymentPage}
            onPageChange={setPaymentPage}
          />
        </Card>
      </Stack>

      {/* Modals */}
      <TerminationModal
        opened={dropModal.open}
        onClose={() => setDropModal({ open: false, enrollment: null })}
        enrollment={dropModal.enrollment}
        onConfirm={onDropConfirm}
        loading={actionLoading}
      />
      <FreezeMemberDrawer
        opened={freezeModal.open}
        onClose={() => setFreezeModal({ open: false, enrollment: null })}
        member={member}
        initialSelectedEnrollmentId={freezeModal.enrollment?.id}
        onSuccess={fetchData}
        effectiveDate={effectiveDate}
        allPayments={allPaymentHistory}
      />
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
            periodMonth: payModal.enrollment.next_payment_date || effectiveDate,
            description: payModal.enrollment.next_payment_date
              ? `${formatDate(payModal.enrollment.next_payment_date, 'MMMM YYYY')} Ödemesi`
              : 'Ödeme',
          }}
          maxMonths={payModal.enrollment.payment_interval || 1}
        />
      )}
      <EditEnrollmentModal
        opened={editModal.open}
        onClose={() => setEditModal({ open: false, enrollment: null })}
        enrollment={editModal.enrollment}
        onConfirm={onEditEnrollmentConfirm}
        loading={actionLoading}
      />

      {/* Payment Schedule Modal */}
      {scheduleModal.enrollment && (
        <Modal
          opened={scheduleModal.open}
          onClose={() => setScheduleModal({ ...scheduleModal, open: false })}
          title={`${scheduleModal.enrollment.classes?.name} - Ödeme Planı`}
          size="xl"
          centered
        >
          <PaymentScheduleTable
            schedule={scheduleModal.schedule}
            memberId={memberId}
            classId={classId}
            onUpdate={() => {
              fetchData();
              // Refresh schedule after payment
              handleViewSchedule(scheduleModal.enrollment!);
            }}
          />
        </Modal>
      )}
    </Container>
  );
}

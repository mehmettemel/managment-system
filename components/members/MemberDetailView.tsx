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
  Modal,
  Alert,
  Select,
  ThemeIcon,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconPhone,
  IconCalendar,
  IconHistory,
  IconPlus,
  IconRotateClockwise,
  IconArrowRight,
  IconAlertCircle,
  IconCreditCard,
} from '@tabler/icons-react';
import {
  getMemberById,
  updateMemberClassDetails,
  terminateEnrollment,
  addMemberToClasses,
} from '@/actions/members';
import { getMemberPayments, processClassPayment } from '@/actions/payments';
import { getClasses } from '@/actions/classes';
import { unfreezeLog, unfreezeMembership } from '@/actions/freeze';
import { TerminationModal, TerminationFormValues } from './TerminationModal';
import { formatPhone, formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import {
  Member,
  MemberClassWithDetails,
  Payment,
  PaymentWithClass,
  FrozenLog,
  MemberWithClasses,
  PaymentType,
  Class,
} from '@/types';
import { EnrollmentCard } from './EnrollmentCard';
import { FreezeStatusCard } from './FreezeStatusCard';
import { FreezeMemberDrawer } from './FreezeMemberDrawer';
import { PaymentScheduleTable } from './PaymentScheduleTable';
import { PaymentHistory } from './PaymentHistory';
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
import { EditEnrollmentModal } from './EditEnrollmentModal';
import { AddEnrollmentModal } from './AddEnrollmentModal';

interface MemberDetailViewProps {
  memberId: number;
  effectiveDate: string;
  focusedClassId?: number;
}

export function MemberDetailView({
  memberId,
  effectiveDate,
  focusedClassId,
}: MemberDetailViewProps) {
  const router = useRouter();

  const [member, setMember] = useState<MemberWithClasses | null>(null);
  const [activeEnrollments, setActiveEnrollments] = useState<
    MemberClassWithDetails[]
  >([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentWithClass[]>([]); // Paginated for display
  const [allPaymentHistory, setAllPaymentHistory] = useState<
    PaymentWithClass[]
  >([]); // All payments for calculations
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state for payment history
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize] = useState(10);
  const [paymentTotalRecords, setPaymentTotalRecords] = useState(0);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(
    focusedClassId ? focusedClassId.toString() : null
  );

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
  // Drop modal (Dersten Ayrıl)
  const [dropModal, setDropModal] = useState<{
    open: boolean;
    enrollment: MemberClassWithDetails | null;
  }>({ open: false, enrollment: null });

  // Edit modal
  const [editModal, setEditModal] = useState<{
    open: boolean;
    enrollment: MemberClassWithDetails | null;
  }>({ open: false, enrollment: null });

  // Add class modal
  const [addClassModal, setAddClassModal] = useState<{
    open: boolean;
    availableClasses: Class[];
  }>({ open: false, availableClasses: [] });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [memberRes, paginatedPaymentsRes, allPaymentsRes, classesRes] =
        await Promise.all([
          getMemberById(memberId),
          getMemberPayments(memberId, paymentPage, paymentPageSize), // Paginated for display
          getMemberPayments(memberId, 1, 9999), // All payments for calculations
          getClasses(),
        ]);

      if (memberRes.data) {
        setMember(memberRes.data);
        // Filter for active enrollments
        let enrollments = (memberRes.data.member_classes.filter(
          (mc: any) => mc.active
        ) || []) as any;

        if (focusedClassId) {
          enrollments = enrollments.filter(
            (e: any) => e.class_id === focusedClassId
          );
        }

        setActiveEnrollments(enrollments);
      }

      if (paginatedPaymentsRes.data) {
        setPaymentHistory(paginatedPaymentsRes.data.data);
        setPaymentTotalRecords(paginatedPaymentsRes.data.meta.total);
      }

      if (allPaymentsRes.data) {
        setAllPaymentHistory(allPaymentsRes.data.data);
      }

      if (classesRes.data) {
        setAllClasses(classesRes.data);
      }
    } catch (error) {
      console.error(error);
      showError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [memberId, paymentPage, paymentPageSize, focusedClassId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Separate effect for payment page changes to avoid full data refetch
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const paymentsRes = await getMemberPayments(
          memberId,
          paymentPage,
          paymentPageSize
        );

        if (paymentsRes.data) {
          setPaymentHistory(paymentsRes.data.data);
          setPaymentTotalRecords(paymentsRes.data.meta.total);
        }
      } catch (error) {
        console.error(error);
        showError('Ödeme geçmişi yüklenirken hata oluştu');
      }
    };

    // Only fetch payments when page changes (not on initial load, fetchData handles that)
    if (paymentPage > 1) {
      fetchPayments();
    }
  }, [memberId, paymentPage, paymentPageSize]);

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
      setPaymentPage(1); // Reset to first page
      fetchData();
    }
    setActionLoading(false);
  };

  // Helper to check if a date is frozen for an enrollment
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
        : dayjs('2099-12-31'); // Indefinite freeze

      return (
        date.isSameOrAfter(freezeStart, 'day') &&
        date.isSameOrBefore(freezeEnd, 'day')
      );
    });
  };

  // Helper to calculate effective next payment date client-side
  const getComputedNextDate = (enrollment: MemberClassWithDetails): string => {
    // CRITICAL: Filter by member_class_id (specific enrollment), not just class_id
    // A member can enroll in the same class multiple times with different dates
    // FALLBACK: If member_class_id is null (old data), filter by class_id AND date range
    const classPayments = allPaymentHistory.filter((p) => {
      // Prefer member_class_id if available
      if (p.member_class_id) {
        return p.member_class_id === enrollment.id;
      }
      // Fallback for old data without member_class_id
      // Only include payments that are within this enrollment's date range
      if (p.class_id === enrollment.class_id) {
        const paymentDate = dayjs(p.period_start);
        const enrollStart = dayjs(enrollment.created_at);
        // Only include if payment is on or after enrollment date
        return paymentDate.isSameOrAfter(enrollStart, 'day');
      }
      return false;
    });

    const paidDates = new Set(
      classPayments.map((p) => dayjs(p.period_start).format('YYYY-MM-DD'))
    );

    // Start from THIS enrollment's registration date (not member's join date)
    const enrollmentDate = dayjs(enrollment.created_at || new Date());

    let check = enrollmentDate;
    for (let i = 0; i < 120; i++) {
      // Skip frozen dates
      if (isDateFrozen(enrollment, check)) {
        check = check.add(1, 'month');
        continue;
      }

      // Check if this exact date is paid
      if (paidDates.has(check.format('YYYY-MM-DD'))) {
        check = check.add(1, 'month');
      } else {
        // Return the unpaid date
        return check.format('YYYY-MM-DD');
      }
    }
    return check.format('YYYY-MM-DD');
  };

  // Calculate overdue months count for an enrollment
  const getOverdueMonthsCount = (
    enrollment: MemberClassWithDetails
  ): number => {
    // CRITICAL: Filter by member_class_id (specific enrollment), not just class_id
    // A member can enroll in the same class multiple times with different dates
    // FALLBACK: If member_class_id is null (old data), filter by class_id AND date range
    const classPayments = allPaymentHistory.filter((p) => {
      // Prefer member_class_id if available
      if (p.member_class_id) {
        return p.member_class_id === enrollment.id;
      }
      // Fallback for old data without member_class_id
      // Only include payments that are within this enrollment's date range
      if (p.class_id === enrollment.class_id) {
        const paymentDate = dayjs(p.period_start);
        const enrollStart = dayjs(enrollment.created_at);
        // Only include if payment is on or after enrollment date
        return paymentDate.isSameOrAfter(enrollStart, 'day');
      }
      return false;
    });
    const paidDates = new Set(
      classPayments.map((p) => dayjs(p.period_start).format('YYYY-MM-DD'))
    );

    // Start from THIS enrollment's registration date (not member's join date)
    const enrollmentDate = dayjs(enrollment.created_at || new Date());
    const today = dayjs(effectiveDate);
    let overdueCount = 0;
    let check = enrollmentDate;

    // Iterate through monthly cycles from enrollment date until today
    for (let i = 0; i < 120; i++) {
      // Stop if we've reached or passed today (today's payment is not yet overdue)
      if (check.isSameOrAfter(today, 'day')) {
        break;
      }

      // Skip frozen dates
      if (isDateFrozen(enrollment, check)) {
        check = check.add(1, 'month');
        continue;
      }

      // If not paid and before today, it's overdue
      if (!paidDates.has(check.format('YYYY-MM-DD'))) {
        overdueCount++;
      }

      check = check.add(1, 'month');
    }

    return overdueCount;
  };

  const computedEnrollments = activeEnrollments.map((e) => ({
    ...e,
    next_payment_date: getComputedNextDate(e),
    overdueMonthsCount: getOverdueMonthsCount(e),
  }));

  // Filter payment history by class
  const filteredPaymentHistory = selectedClassFilter
    ? paymentHistory.filter(
        (p) => p.class_id?.toString() === selectedClassFilter
      )
    : paymentHistory;

  const filteredPaymentTotalRecords = selectedClassFilter
    ? allPaymentHistory.filter(
        (p) => p.class_id?.toString() === selectedClassFilter
      ).length
    : paymentTotalRecords;

  // Check for overdue payments
  const overdueEnrollments = computedEnrollments.filter((e) => {
    const activeFreezeLog = member?.frozen_logs?.find(
      (log) => log.member_class_id === e.id && !log.end_date
    );
    return !activeFreezeLog && e.overdueMonthsCount > 0;
  });

  // Handlers
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

  const handlePaymentSuccess = () => {
    fetchData();
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
    // CRITICAL: Send enrollment.id (member_class_id), not class_id
    // A member can enroll in the same class multiple times
    const res = await getPaymentSchedule(memberId, enrollment.id);
    if (res.data) {
      setScheduleModal({ open: true, enrollment, schedule: res.data });
    } else {
      showError('Ödeme planı yüklenemedi');
    }
    setActionLoading(false);
  };

  const handleAddClassClick = () => {
    // Filter out already enrolled classes
    const enrolledClassIds = new Set(activeEnrollments.map((e) => e.class_id));
    const available = allClasses.filter((c) => !enrolledClassIds.has(c.id));

    if (available.length === 0) {
      showError('Tüm derslere kayıtlısınız');
      return;
    }

    setAddClassModal({ open: true, availableClasses: available });
  };

  const onAddClassConfirm = async (
    registrations: {
      class_id: number;
      price: number;
      duration: number;
    }[]
  ) => {
    setActionLoading(true);
    const result = await addMemberToClasses(memberId, registrations);

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Ders kayıtları eklendi');
      setAddClassModal({ open: false, availableClasses: [] });
      fetchData(); // Refresh data
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
      setDropModal({ open: false, enrollment: null });
      setPaymentPage(1); // Reset to first page
      fetchData();
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
      monthCount: values.monthCount,
      targetPeriods: values.targetPeriods,
      paymentType: values.paymentType,
    });

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Ödeme alındı');
      setPayModal({ open: false, enrollment: null });
      setPaymentPage(1); // Reset to first page
      fetchData();
    }
    setActionLoading(false);
  };

  const handleUnfreezeAll = async () => {
    if (!member) return;
    setActionLoading(true);
    const result = await unfreezeMembership(member.id);
    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Üyelik aktifleştirildi');
      fetchData();
    }
    setActionLoading(false);
  };

  const historyColumns: DataTableColumn<PaymentWithClass>[] = [
    {
      key: 'status',
      label: 'Durum',
      render: (row) => {
        const isActive = row.member_classes?.active;
        return (
          <Badge color={isActive ? 'green' : 'gray'} variant="light" size="sm">
            {isActive ? 'Aktif Kayıt' : 'Pasif Kayıt'}
          </Badge>
        );
      },
    },
    {
      key: 'snapshot_class_name',
      label: 'Ders',
      render: (row) => (
        <Text fw={500}>
          {row.snapshot_class_name || row.classes?.name || '-'}
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
      label: 'Ödeme Tarihi',
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
    {
      key: 'description',
      label: 'Açıklama',
      render: (row) => (
        <TruncatedTooltip text={row.description} maxLength={20} size="sm" />
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

        {/* Freeze Status Card */}
        {member.frozen_logs && (
          <FreezeStatusCard
            member={member}
            logs={member.frozen_logs || []}
            effectiveDate={effectiveDate}
            onUnfreezeClick={handleUnfreezeAll}
          />
        )}

        {/* Overdue Payments Alert */}
        {overdueEnrollments.length > 0 &&
          (() => {
            const totalOverdueMonths = overdueEnrollments.reduce(
              (sum, e) => sum + (e.overdueMonthsCount || 0),
              0
            );

            // Only show alert if there are actual overdue months
            if (totalOverdueMonths === 0) return null;

            return (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Gecikmiş Ödemeler"
                color="red"
                variant="light"
              >
                <Stack gap="xs">
                  <Text size="sm">
                    Bu üyenin <strong>{overdueEnrollments.length}</strong>{' '}
                    dersinde toplam <strong>{totalOverdueMonths} adet</strong>{' '}
                    gecikmiş ödeme bulunmaktadır:
                  </Text>
                  {overdueEnrollments.map((e) => {
                    if (!e.overdueMonthsCount || e.overdueMonthsCount === 0)
                      return null;

                    return (
                      <Group key={e.id} gap="xs">
                        <Text size="sm" fw={500}>
                          • {e.classes?.name}:
                        </Text>
                        <Text size="sm" c="red">
                          {e.overdueMonthsCount === 1
                            ? '1 ay gecikmiş'
                            : `${e.overdueMonthsCount} ay gecikmiş`}
                        </Text>
                        <Text size="sm" c="dimmed">
                          (İlk gecikme: {formatDate(e.next_payment_date!)})
                        </Text>
                      </Group>
                    );
                  })}
                </Stack>
              </Alert>
            );
          })()}

        {/* Active Enrollments */}
        <Group justify="space-between" align="center">
          <Title order={4}>
            {focusedClassId ? 'Ders Detayı' : 'Kayıtlı Dersler'}
          </Title>
          {!focusedClassId && (
            <Button
              leftSection={<IconPlus size={16} />}
              variant="light"
              onClick={handleAddClassClick}
            >
              Ders Ekle
            </Button>
          )}
        </Group>
        {computedEnrollments.length === 0 ? (
          focusedClassId ? (
            <Text c="dimmed">Bu derse ait aktif kayıt bulunamadı.</Text>
          ) : (
            <Card withBorder p="xl">
              <Stack align="center" gap="md">
                <Text c="dimmed" ta="center" size="lg" fw={500}>
                  Henüz ders kaydı bulunmuyor
                </Text>
                <Text c="dimmed" ta="center" size="sm">
                  Üyeyi derslerinize kaydetmek için aşağıdaki butona tıklayın
                </Text>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleAddClassClick}
                  size="md"
                >
                  İlk Dersi Ekle
                </Button>
              </Stack>
            </Card>
          )
        ) : (
          <Stack gap="md">
            {computedEnrollments.map((enrollment) => {
              // Logic for Focused View: Show full card
              if (focusedClassId) {
                const activeLog = member.frozen_logs?.find(
                  (log) =>
                    log.member_class_id === enrollment.id && !log.end_date
                );
                const enrollmentFrozenLogs =
                  member.frozen_logs?.filter(
                    (log) => log.member_class_id === enrollment.id
                  ) || [];

                return (
                  <EnrollmentCard
                    key={enrollment.id}
                    enrollment={enrollment}
                    effectiveDate={effectiveDate}
                    activeFreezeLog={activeLog}
                    pastFrozenLogs={enrollmentFrozenLogs}
                    onPay={() => handlePayClick(enrollment)}
                    onDrop={() => handleDropClick(enrollment)}
                    onFreeze={() => handleFreezeClick(enrollment)}
                    onUnfreeze={() => {
                      if (activeLog) handleUnfreezeLog(activeLog.id);
                    }}
                    onViewSchedule={() => handleViewSchedule(enrollment)}
                    onEditPrice={() => handleEditPriceClick(enrollment)}
                  />
                );
              }

              // Logic for General View: Show simplified Summary Card
              return (
                <Card key={enrollment.id} withBorder padding="md" radius="md">
                  <Group justify="space-between">
                    <Group>
                      <ThemeIcon size="lg" variant="light" color="blue">
                        <IconCreditCard size={20} />
                      </ThemeIcon>
                      <div>
                        <Text fw={600} size="lg">
                          {enrollment.classes?.name}
                        </Text>
                        <Group gap="xs">
                          <Badge
                            size="sm"
                            variant="dot"
                            color={enrollment.active ? 'green' : 'gray'}
                          >
                            {enrollment.active ? 'Aktif' : 'Pasif'}
                          </Badge>
                          <Text size="sm" c="dimmed">
                            Kayıt: {formatDate(enrollment.created_at)}
                          </Text>
                        </Group>
                      </div>
                    </Group>
                    <Button
                      variant="light"
                      rightSection={<IconArrowRight size={16} />}
                      onClick={() =>
                        router.push(
                          `/classes/${enrollment.class_id}/enrollments/${memberId}`
                        )
                      }
                    >
                      Yönet & Detay
                    </Button>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        )}

        {/* History Tabs - Only show in Focused Mode */}
        {focusedClassId && (
          <Card withBorder radius="md" mt="lg">
            <Tabs defaultValue="history">
              <Tabs.List>
                <Tabs.Tab
                  value="history"
                  leftSection={<IconHistory size={16} />}
                >
                  Ödeme Geçmişi
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="history" pt="md">
                <Stack gap="md">
                  <Group>
                    <Select
                      placeholder="Tüm Dersler"
                      value={selectedClassFilter}
                      onChange={setSelectedClassFilter}
                      data={[
                        { value: '', label: 'Tüm Dersler' },
                        ...Array.from(
                          new Set(
                            allPaymentHistory
                              .filter((p) => p.class_id)
                              .map((p) => p.class_id!.toString())
                          )
                        ).map((classId) => {
                          const payment = allPaymentHistory.find(
                            (p) => p.class_id?.toString() === classId
                          );
                          return {
                            value: classId,
                            label:
                              payment?.snapshot_class_name ||
                              payment?.classes?.name ||
                              `Ders ${classId}`,
                          };
                        }),
                      ]}
                      clearable
                      style={{ width: 250 }}
                    />
                    {selectedClassFilter && (
                      <Text size="sm" c="dimmed">
                        {filteredPaymentTotalRecords} ödeme bulundu
                      </Text>
                    )}
                  </Group>
                  <DataTable
                    data={filteredPaymentHistory}
                    columns={historyColumns}
                    pageSize={paymentPageSize}
                    emptyText="Ödeme geçmişi bulunamadı."
                    totalRecords={filteredPaymentTotalRecords}
                    page={paymentPage}
                    onPageChange={setPaymentPage}
                  />
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </Card>
        )}
      </Stack>
      {/* Modals */}
      {/* Drop / Termination Modal */}
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
      {/* Payment Schedule Modal */}
      <Modal
        opened={scheduleModal.open}
        onClose={() => setScheduleModal({ ...scheduleModal, open: false })}
        title={`${scheduleModal.enrollment?.classes?.name} - Ödeme Planı`}
        size="xl"
        centered
      >
        {scheduleModal.enrollment && (
          <PaymentScheduleTable
            schedule={scheduleModal.schedule}
            memberId={memberId}
            classId={scheduleModal.enrollment.class_id}
            onUpdate={() => {
              fetchData();
              // Refresh schedule after payment
              handleViewSchedule(scheduleModal.enrollment!);
            }}
          />
        )}
      </Modal>
      <EditEnrollmentModal
        opened={editModal.open}
        onClose={() => setEditModal({ open: false, enrollment: null })}
        enrollment={editModal.enrollment}
        onConfirm={onEditEnrollmentConfirm}
        loading={actionLoading}
      />
      <AddEnrollmentModal
        opened={addClassModal.open}
        onClose={() => setAddClassModal({ open: false, availableClasses: [] })}
        availableClasses={addClassModal.availableClasses}
        onConfirm={onAddClassConfirm}
        loading={actionLoading}
      />
    </Container>
  );
}

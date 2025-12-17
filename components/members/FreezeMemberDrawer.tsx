/**
 * Drawer component for freezing a member
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Modal,
  Button,
  Stack,
  Text,
  Textarea,
  Switch,
  Group,
  LoadingOverlay,
  Checkbox,
  ScrollArea,
  Alert,
  Badge,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconSnowflake, IconAlertCircle, IconCurrencyLira } from '@tabler/icons-react';
import { freezeMembership } from '@/actions/freeze';
import { showSuccess, showError } from '@/utils/notifications';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import type { Member, MemberWithClasses, PaymentWithClass } from '@/types';
import dayjs from 'dayjs';

interface FreezeMemberDrawerProps {
  opened: boolean;
  onClose: () => void;
  member: Member | MemberWithClasses | null;
  onSuccess?: () => void;
  initialSelectedEnrollmentId?: number | null;
  effectiveDate?: string;
  allPayments?: PaymentWithClass[];
}

export function FreezeMemberDrawer({
  opened,
  onClose,
  member,
  onSuccess,
  initialSelectedEnrollmentId,
  effectiveDate,
  allPayments = [],
}: FreezeMemberDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [isIndefinite, setIsIndefinite] = useState(false);

  // We need to know available classes to freeze
  // Cast member to MemberWithClasses if possible
  const memberWithClasses = member as MemberWithClasses | null;
  const activeClasses =
    memberWithClasses?.member_classes?.filter((mc) => mc.active) || [];

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Calculate prepaid balance for an enrollment
  const calculatePrepaidBalance = (enrollmentId: number) => {
    const enrollment = activeClasses.find((mc) => mc.id === enrollmentId);
    if (!enrollment) return null;

    // Get all payments for this enrollment
    const enrollmentPayments = allPayments.filter(
      (p) => p.member_class_id === enrollmentId
    );

    if (enrollmentPayments.length === 0) return null;

    // Find the latest paid period
    const latestPayment = enrollmentPayments.reduce((latest, payment) => {
      if (!latest) return payment;
      return dayjs(payment.period_end || payment.period_start).isAfter(
        dayjs(latest.period_end || latest.period_start)
      )
        ? payment
        : latest;
    }, enrollmentPayments[0]);

    const latestPaidPeriodEnd = dayjs(
      latestPayment.period_end || latestPayment.period_start
    );
    const today = dayjs(effectiveDate || new Date());

    // If latest paid period is in the future, calculate unused months
    if (latestPaidPeriodEnd.isAfter(today)) {
      const unusedMonths = latestPaidPeriodEnd.diff(today, 'month', true);
      const unusedDays = Math.floor(latestPaidPeriodEnd.diff(today, 'day'));

      return {
        hasBalance: true,
        unusedMonths: Math.floor(unusedMonths),
        unusedDays,
        latestPaidPeriodEnd: latestPaidPeriodEnd.format('YYYY-MM-DD'),
        amount: (enrollment.custom_price || 0) * Math.floor(unusedMonths),
      };
    }

    return null;
  };

  const form = useForm({
    initialValues: {
      start_date: new Date(),
      end_date: null as Date | null,
      reason: '',
    },
    validate: {
      start_date: (value) => (value ? null : 'Başlangıç tarihi gerekli'),
      end_date: (value) =>
        !isIndefinite && !value
          ? 'Bitiş tarihi gerekli (veya süresiz seçeneğini işaretleyin)'
          : null,
    },
  });

  // Reset form when drawer opens/closes or member changes
  useEffect(() => {
    if (opened) {
      form.reset();
      setLoading(false);
      setIsIndefinite(false);

      // Handle initial selection
      if (initialSelectedEnrollmentId) {
        setSelectedClasses([String(initialSelectedEnrollmentId)]);
      } else if (activeClasses.length > 0) {
        // Default: select all active classes
        setSelectedClasses(activeClasses.map((c) => String(c.id)));
      } else {
        setSelectedClasses([]);
      }
    }
  }, [opened, member, initialSelectedEnrollmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (values: typeof form.values) => {
    if (!member) return;

    // If we have active classes but none selected, show error
    if (activeClasses.length > 0 && selectedClasses.length === 0) {
      showError('Lütfen en az bir ders seçin veya işlemi iptal edin.');
      return;
    }

    setLoading(true);
    try {
      const formData = {
        member_id: member.id,
        start_date: values.start_date.toISOString().split('T')[0],
        end_date: isIndefinite
          ? undefined
          : values.end_date?.toISOString().split('T')[0],
        reason: values.reason,
        is_indefinite: isIndefinite,
        selectedEnrollmentIds: selectedClasses.map(Number),
      };

      const res = await freezeMembership(formData);

      if (res.error) {
        showError(res.error);
      } else {
        showSuccess('Üyelik donduruldu');
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      showError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Üyeliği Dondur" centered>
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Text size="sm" c="dimmed">
            Seçilen Üye:{' '}
            <Text span fw={700}>
              {member?.first_name} {member?.last_name}
            </Text>
          </Text>

          {activeClasses.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Dondurulacak Dersler
              </Text>
              <Checkbox.Group
                value={selectedClasses}
                onChange={setSelectedClasses}
              >
                <Stack gap="sm">
                  {activeClasses.map((mc) => {
                    const prepaidBalance = calculatePrepaidBalance(mc.id);

                    return (
                      <div key={mc.id}>
                        <Checkbox
                          value={String(mc.id)}
                          label={`${mc.classes?.name || 'Ders'} (${mc.payment_interval ? mc.payment_interval + ' Ay' : 'Aylık'})`}
                        />
                        {prepaidBalance && prepaidBalance.hasBalance && (
                          <Alert
                            icon={<IconAlertCircle size={16} />}
                            color="orange"
                            variant="light"
                            mt="xs"
                            ml={28}
                          >
                            <Stack gap={4}>
                              <Group gap="xs">
                                <IconCurrencyLira size={14} />
                                <Text size="xs" fw={500}>
                                  Ön Ödeme Var: {formatCurrency(prepaidBalance.amount)}
                                </Text>
                              </Group>
                              <Text size="xs" c="dimmed">
                                {prepaidBalance.unusedMonths > 0 && `${prepaidBalance.unusedMonths} ay `}
                                {prepaidBalance.unusedDays > 0 && `${prepaidBalance.unusedDays} gün`}
                                {' '}kullanılmamış ödeme var
                              </Text>
                              <Text size="xs" c="dimmed">
                                Son ödenen dönem: {formatDate(prepaidBalance.latestPaidPeriodEnd)}
                              </Text>
                            </Stack>
                          </Alert>
                        )}
                      </div>
                    );
                  })}
                </Stack>
              </Checkbox.Group>
            </Stack>
          )}

          <Switch
            label="Süresiz Dondur (Dönüş tarihi belli değil)"
            checked={isIndefinite}
            onChange={(event) => setIsIndefinite(event.currentTarget.checked)}
          />

          <DateInput
            label="Başlangıç Tarihi"
            placeholder="Tarih seçin"
            value={form.values.start_date}
            onChange={(date) => form.setFieldValue('start_date', date as any)}
            error={form.errors.start_date}
            required
          />

          {!isIndefinite && (
            <DateInput
              label="Bitiş Tarihi"
              placeholder="Tarih seçin"
              value={form.values.end_date}
              onChange={(date) => form.setFieldValue('end_date', date as any)}
              error={form.errors.end_date}
              required
              minDate={form.values.start_date || undefined}
            />
          )}

          <Textarea
            label="Sebep (Opsiyonel)"
            placeholder="Örn: Sağlık sorunu, tatil..."
            {...form.getInputProps('reason')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button
              type="submit"
              color="cyan"
              loading={loading}
              disabled={
                activeClasses.length > 0 && selectedClasses.length === 0
              }
              leftSection={<IconSnowflake size={16} />}
            >
              Dondur
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

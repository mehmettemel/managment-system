'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Select,
  NumberInput,
  Button,
  Group,
  Text,
  Alert,
} from '@mantine/core';
import { IconInfoCircle, IconCalendar } from '@tabler/icons-react';
import {
  processClassPayment,
  calculateNewPaymentDate,
} from '@/actions/payments';
import { showSuccess, showError } from '@/utils/notifications';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import type { MemberClassWithDetails } from '@/types';

interface ClassPaymentModalProps {
  opened: boolean;
  onClose: () => void;
  memberId: number;
  memberClasses: MemberClassWithDetails[];
  preselectedClassId?: number | null;
  onSuccess?: () => void;
}

export function ClassPaymentModal({
  opened,
  onClose,
  memberId,
  memberClasses,
  preselectedClassId,
  onSuccess,
}: ClassPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | ''>(0);
  const [monthsToPay, setMonthsToPay] = useState<number | ''>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>('Nakit');
  const [newDatePreview, setNewDatePreview] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (opened) {
      const classId = preselectedClassId?.toString() || null;
      setSelectedClassId(classId);

      if (classId) {
        const mc = memberClasses.find((c) => c.class_id.toString() === classId);
        if (mc) setAmount(mc.price || 0);
      } else {
        setAmount(0);
      }

      setMonthsToPay(1);
      setPaymentMethod('Nakit');
      setNewDatePreview(null);
    }
  }, [opened, preselectedClassId, memberClasses]);

  // Update amount when class changes
  useEffect(() => {
    if (selectedClassId) {
      const mc = memberClasses.find(
        (c) => c.class_id.toString() === selectedClassId
      );
      if (mc) setAmount(mc.price || 0);
    }
  }, [selectedClassId, memberClasses]);

  // Calculate new date preview
  useEffect(() => {
    const fetchPreview = async () => {
      if (selectedClassId && monthsToPay && Number(monthsToPay) > 0) {
        const result = await calculateNewPaymentDate(
          memberId,
          Number(selectedClassId),
          Number(monthsToPay)
        );
        if (result.data) {
          setNewDatePreview(result.data.newDate);
        }
      } else {
        setNewDatePreview(null);
      }
    };
    fetchPreview();
  }, [selectedClassId, monthsToPay, memberId]);

  const handleSubmit = async () => {
    if (!selectedClassId || !amount || !monthsToPay) {
      showError('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    const result = await processClassPayment({
      memberId,
      classId: Number(selectedClassId),
      amount: Number(amount),
      monthsToPay: Number(monthsToPay),
      paymentMethod,
    });

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Ödeme başarıyla kaydedildi');
      onSuccess?.();
    }
    setLoading(false);
  };

  const classOptions = memberClasses.map((mc) => ({
    value: mc.class_id.toString(),
    label: mc.classes?.name || `Ders #${mc.class_id}`,
  }));

  const selectedClass = memberClasses.find(
    (c) => c.class_id.toString() === selectedClassId
  );
  const totalAmount = (amount || 0) * (Number(monthsToPay) || 1);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>Ödeme Yap</Text>}
      size="md"
    >
      <Stack>
        <Select
          label="Ders Seçimi"
          placeholder="Ders seçin"
          data={classOptions}
          value={selectedClassId}
          onChange={setSelectedClassId}
          required
        />

        <NumberInput
          label="Aylık Tutar"
          placeholder="0"
          value={amount}
          onChange={(val) => setAmount(typeof val === 'number' ? val : 0)}
          min={0}
          prefix="₺ "
          thousandSeparator=","
          required
        />

        <NumberInput
          label="Kaç Ay?"
          placeholder="1"
          value={monthsToPay}
          onChange={(val) => setMonthsToPay(typeof val === 'number' ? val : 1)}
          min={1}
          max={12}
          required
        />

        <Select
          label="Ödeme Yöntemi"
          data={['Nakit', 'Kredi Kartı', 'Havale', 'Diğer']}
          value={paymentMethod}
          onChange={(val) => setPaymentMethod(val || 'Nakit')}
        />

        {/* Total Preview */}
        <Alert variant="light" color="blue" icon={<IconInfoCircle />}>
          <Group justify="space-between">
            <Text size="sm">Toplam Tutar:</Text>
            <Text fw={700}>{formatCurrency(totalAmount)}</Text>
          </Group>
        </Alert>

        {/* New Date Preview */}
        {newDatePreview && (
          <Alert variant="light" color="grape" icon={<IconCalendar />}>
            <Text size="sm">
              Yeni ödeme tarihi: <strong>{formatDate(newDatePreview)}</strong>{' '}
              olacaktır.
            </Text>
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!selectedClassId || !amount || !monthsToPay}
          >
            Ödemeyi Kaydet
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

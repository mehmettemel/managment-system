import { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Group,
  TextInput,
  Select,
  Stack,
  Text,
  Paper,
  Checkbox,
  ScrollArea,
  NumberInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCreditCard, IconCalendar, IconTag } from '@tabler/icons-react';
import { PaymentScheduleItem, PaymentType } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

export interface PaymentItem {
  amount: number;
  periodLabel: string;
  periodMonth?: string;
  status?: string;
  description?: string;
}

interface PaymentConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (values: {
    amount: number;
    paymentMethod: string;
    description?: string;
    monthCount?: number;
    targetPeriods?: string[];
    paymentType?: PaymentType;
  }) => Promise<void>;
  item: PaymentScheduleItem | null;
  loading?: boolean;
  maxMonths?: number; // Commitment duration
}

export function PaymentConfirmModal({
  opened,
  onClose,
  onConfirm,
  item,
  loading = false,
  maxMonths = 1,
}: PaymentConfirmModalProps) {
  // State for selected specific months (e.g. ['2025-03-01', '2025-04-01'])
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);

  // Base price per month
  const pricePerMonth = item?.amount || 0;

  const form = useForm({
    initialValues: {
      amount: item?.amount || 0,
      paymentMethod: 'Nakit',
      description: item?.description || '',
      paymentType: 'monthly' as PaymentType,
    },
    validate: {
      paymentMethod: (value) => (!value ? 'Ödeme yöntemi seçiniz' : null),
      amount: (value) => (value <= 0 ? 'Tutar 0 dan büyük olmalı' : null),
    },
  });

  // Generate potential months to pay
  const [potentialMonths, setPotentialMonths] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    if (opened && item?.periodMonth) {
      const start = dayjs(item.periodMonth);
      const months = [];
      const limit = maxMonths > 0 ? maxMonths : 1;

      for (let i = 0; i < limit; i++) {
        const d = start.add(i, 'month');
        months.push({
          value: d.format('YYYY-MM-DD'),
          label: d.locale('tr').format('MMMM YYYY'), // "Mart 2025"
        });
      }
      setPotentialMonths(months);

      // Default select JUST the first one
      setSelectedPeriods([months[0].value]);

      form.setValues({
        amount: item?.amount || 0,
        description: item?.description || '',
        paymentType: 'monthly',
      });
    }
  }, [opened, item, maxMonths]);

  // Auto-update amount and description when selection changes (if Monthly)
  useEffect(() => {
    if (selectedPeriods.length > 0) {
      // Sort to ensure chronological order in description
      const sorted = [...selectedPeriods].sort(
        (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf()
      );
      const labels = sorted
        .map((p) => dayjs(p).locale('tr').format('MMMM YYYY'))
        .join(', ');

      const newDesc = `${labels} Ödemesi`;
      const newAmount = pricePerMonth * selectedPeriods.length;

      // Only auto-update if type is monthly (standard flow)
      if (form.values.paymentType === 'monthly') {
        form.setFieldValue('amount', newAmount);
        form.setFieldValue('description', newDesc);
      } else if (form.values.paymentType === 'difference') {
        // Keep description logic but don't force amount (user enters diff)
        // Actually diff description might be custom.
        // Let's just suggest it.
      }
    } else {
      // Clear?
    }
  }, [selectedPeriods, pricePerMonth, form.values.paymentType]);

  const handleSubmit = async (values: typeof form.values) => {
    const sortedPeriods = [...selectedPeriods].sort(
      (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf()
    );

    await onConfirm({
      amount: values.amount,
      paymentMethod: values.paymentMethod,
      description: values.description,
      monthCount: sortedPeriods.length,
      targetPeriods: sortedPeriods,
      paymentType: values.paymentType,
    });

    form.reset();
    setSelectedPeriods([]);
  };

  const togglePeriod = (periodValue: string) => {
    if (selectedPeriods.includes(periodValue)) {
      setSelectedPeriods(selectedPeriods.filter((p) => p !== periodValue));
    } else {
      setSelectedPeriods([...selectedPeriods, periodValue]);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Ödeme Al"
      centered
      size="sm"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Payment Type Selection */}
          <Select
            label="Ödeme Türü"
            data={[
              { value: 'monthly', label: 'Aylık Aidat' },
              { value: 'difference', label: 'Fark Ödemesi (Transfer)' },
              { value: 'registration', label: 'Kayıt Ücreti' },
            ]}
            leftSection={<IconTag size={16} />}
            {...form.getInputProps('paymentType')}
          />

          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Dönemler
            </Text>
            <Paper withBorder p="xs" radius="md">
              <ScrollArea h={potentialMonths.length > 5 ? 200 : 'auto'}>
                <Stack gap="xs">
                  {potentialMonths.map((m) => (
                    <Checkbox
                      key={m.value}
                      label={m.label}
                      checked={selectedPeriods.includes(m.value)}
                      onChange={() => togglePeriod(m.value)}
                    />
                  ))}
                </Stack>
              </ScrollArea>
            </Paper>
          </Stack>

          <Paper withBorder p="sm" radius="md" bg="gray.0">
            <Stack gap="xs">
              <NumberInput
                label="Tutar"
                leftSection="₺"
                thousandSeparator=","
                decimalSeparator="."
                {...form.getInputProps('amount')}
              />
            </Stack>
          </Paper>

          <Select
            label="Ödeme Yöntemi"
            placeholder="Seçiniz"
            data={[
              { value: 'Nakit', label: 'Nakit' },
              { value: 'Kredi Kartı', label: 'Kredi Kartı' },
              { value: 'Havale/EFT', label: 'Havale/EFT' },
            ]}
            leftSection={<IconCreditCard size={16} />}
            {...form.getInputProps('paymentMethod')}
          />

          <TextInput
            label="Açıklama (Opsiyonel)"
            placeholder="Ödeme notu..."
            {...form.getInputProps('description')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={selectedPeriods.length === 0}
            >
              Ödeme Al
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

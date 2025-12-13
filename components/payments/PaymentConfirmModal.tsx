'use client';
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
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCreditCard, IconCalendar } from '@tabler/icons-react';
import { PaymentScheduleItem } from '@/types';
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

  const pricePerMonth = item?.amount || 0;
  // If user selects multiple, sum them up
  const totalAmount = pricePerMonth * (selectedPeriods.length || 1);

  const form = useForm({
    initialValues: {
      paymentMethod: 'Nakit',
      description: item?.description || '',
    },
    validate: {
      paymentMethod: (value) => (!value ? 'Ödeme yöntemi seçiniz' : null),
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
      // If maxMonths is defined, show up to that many + maybe a buffer?
      // User requested "shows 1 and 3" if 3.
      // We will show ALL individual months up to maxMonths, allowing user to tick them.
      // But typically we pay sequentially.
      // Let's generate maxMonths options.
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

      form.setFieldValue('description', item?.description || '');
    }
  }, [opened, item, maxMonths]);

  // Auto-update description when selected months change
  useEffect(() => {
    if (selectedPeriods.length > 0) {
      // Sort to ensure chronological order in description
      const sorted = [...selectedPeriods].sort(
        (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf()
      );
      const labels = sorted
        .map((p) => dayjs(p).locale('tr').format('MMMM YYYY'))
        .join(', ');
      form.setFieldValue('description', `${labels} Ödemesi`);
    } else {
      form.setFieldValue('description', '');
    }
  }, [selectedPeriods]); // Dependencies: only when selection changes

  const handleSubmit = async (values: typeof form.values) => {
    // Sort selected periods chronologically
    const sortedPeriods = [...selectedPeriods].sort(
      (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf()
    );

    await onConfirm({
      amount: totalAmount,
      paymentMethod: values.paymentMethod,
      description: values.description, // User can still edit it after auto-fill
      monthCount: sortedPeriods.length,
      targetPeriods: sortedPeriods,
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
          <Text size="sm" fw={500}>
            Ödenecek Aylar
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

          <Paper withBorder p="sm" radius="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Aylık Ücret:
              </Text>
              <Text fw={500}>{formatCurrency(pricePerMonth)}</Text>
            </Group>
            <Group justify="space-between" mt="xs">
              <Text size="sm" c="dimmed">
                Toplam ({selectedPeriods.length} ay):
              </Text>
              <Text fw={700} size="lg" c="blue">
                {formatCurrency(totalAmount)}
              </Text>
            </Group>
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
              {formatCurrency(totalAmount)} Öde
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

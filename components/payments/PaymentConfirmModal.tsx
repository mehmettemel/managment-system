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
  NumberInput,
  Paper,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconCurrencyLira,
  IconCreditCard,
  IconCalendar,
} from '@tabler/icons-react';
import { PaymentScheduleItem } from '@/types';
import { formatCurrency } from '@/utils/formatters';

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
  }) => Promise<void>;
  item: PaymentScheduleItem | null;
  loading?: boolean;
}

export function PaymentConfirmModal({
  opened,
  onClose,
  onConfirm,
  item,
  loading = false,
}: PaymentConfirmModalProps) {
  const [monthCount, setMonthCount] = useState<string>('1');
  const pricePerMonth = item?.amount || 0;
  const totalAmount = pricePerMonth * Number(monthCount);

  const form = useForm({
    initialValues: {
      paymentMethod: 'Nakit',
      description: item?.description || '',
    },
    validate: {
      paymentMethod: (value) => (!value ? 'Ödeme yöntemi seçiniz' : null),
    },
  });

  // Reset month count when modal opens with new item
  useEffect(() => {
    if (opened) {
      setMonthCount('1');
      form.setFieldValue('description', item?.description || '');
    }
  }, [opened, item]);

  const handleSubmit = async (values: typeof form.values) => {
    await onConfirm({
      amount: totalAmount,
      paymentMethod: values.paymentMethod,
      description: values.description,
      monthCount: Number(monthCount),
    });
    form.reset();
    setMonthCount('1');
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
          {item && (
            <Text size="sm" c="dimmed">
              <strong>{item.periodLabel}</strong> döneminden itibaren ödeme
            </Text>
          )}

          <Select
            label="Kaç Ay Ödenecek?"
            description="Seçilen ay sayısı kadar ödeme alınacak"
            value={monthCount}
            onChange={(val) => setMonthCount(val || '1')}
            data={[
              { value: '1', label: '1 Ay' },
              { value: '2', label: '2 Ay' },
              { value: '3', label: '3 Ay' },
              { value: '6', label: '6 Ay' },
              { value: '12', label: '12 Ay (1 Yıl)' },
            ]}
            leftSection={<IconCalendar size={16} />}
          />

          <Paper withBorder p="sm" radius="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Aylık Ücret:
              </Text>
              <Text fw={500}>{formatCurrency(pricePerMonth)}</Text>
            </Group>
            <Group justify="space-between" mt="xs">
              <Text size="sm" c="dimmed">
                Toplam ({monthCount} ay):
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
            <Button type="submit" loading={loading}>
              {formatCurrency(totalAmount)} Öde
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

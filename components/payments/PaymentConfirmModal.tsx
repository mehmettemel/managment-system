'use client';

import { useState } from 'react';
import {
  Modal,
  Button,
  Group,
  TextInput,
  Select,
  Stack,
  Text,
  NumberInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCurrencyLira, IconCreditCard } from '@tabler/icons-react';
import { PaymentScheduleItem } from '@/types';
import { formatCurrency } from '@/utils/formatters';

export interface PaymentItem {
  amount: number;
  periodLabel: string;
  periodMonth?: string; // ISO date string for the period
  status?: string;
  description?: string; // Pre-filled description
}

interface PaymentConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (values: {
    amount: number;
    paymentMethod: string;
    description?: string;
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
  const form = useForm({
    initialValues: {
      amount: item.amount,
      paymentMethod: 'cash',
      description: item.description || '',
    },
    validate: {
      amount: (value) => (value <= 0 ? 'Tutar 0 dan büyük olmalıdır' : null),
      paymentMethod: (value) => (!value ? 'Ödeme yöntemi seçiniz' : null),
    },
  });

  // Update form when item changes
  if (item && form.values.amount !== item.amount && !form.isDirty('amount')) {
    form.setFieldValue('amount', item.amount);
  }

  const handleSubmit = async (values: typeof form.values) => {
    await onConfirm({
      amount: values.amount,
      paymentMethod: values.paymentMethod,
      description: values.description,
    });
    form.reset();
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
              <strong>{item.periodLabel}</strong> dönemi ödemesi
            </Text>
          )}

          <NumberInput
            label="Tutar"
            placeholder="0.00"
            leftSection={<IconCurrencyLira size={16} />}
            thousandSeparator=","
            decimalSeparator="."
            hideControls
            {...form.getInputProps('amount')}
          />

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
              Ödemeyi Tamamla
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

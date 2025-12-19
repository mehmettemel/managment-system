'use client';

import { useEffect } from 'react';
import {
  Drawer,
  Stack,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Button,
  Group,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { Expense, ExpenseCategory, ExpenseFormData } from '@/types';
import { createExpense, updateExpense } from '@/actions/expenses';
import { showError, showSuccess } from '@/utils/notifications';
import dayjs from 'dayjs';

interface ExpenseDrawerProps {
  opened: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  expense?: Expense | null;
}

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'Kantin', label: 'Kantin' },
  { value: 'Temizlik', label: 'Temizlik' },
  { value: 'Kira', label: 'Kira' },
  { value: 'Elektrik', label: 'Elektrik' },
  { value: 'Su', label: 'Su' },
  { value: 'İnternet', label: 'İnternet' },
  { value: 'Bakım-Onarım', label: 'Bakım-Onarım' },
  { value: 'Maaş', label: 'Maaş' },
  { value: 'Malzeme', label: 'Malzeme' },
  { value: 'Para İadesi', label: 'Para İadesi' },
  { value: 'Diğer', label: 'Diğer' },
];

export function ExpenseDrawer({ opened, onClose, expense }: ExpenseDrawerProps) {
  const form = useForm<{
    amount: number | string;
    category: ExpenseCategory | null;
    description: string;
    date: Date | null;
    receipt_number: string;
  }>({
    initialValues: {
      amount: '',
      category: null,
      description: '',
      date: new Date(),
      receipt_number: '',
    },
    validate: {
      amount: (value) => {
        const num = Number(value);
        if (!value || isNaN(num) || num <= 0) {
          return 'Geçerli bir tutar giriniz';
        }
        return null;
      },
      category: (value) => (!value ? 'Kategori seçiniz' : null),
      description: (value) =>
        !value || value.trim().length === 0 ? 'Açıklama giriniz' : null,
      date: (value) => (!value ? 'Tarih seçiniz' : null),
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (expense) {
      form.setValues({
        amount: expense.amount,
        category: expense.category as ExpenseCategory,
        description: expense.description,
        date: new Date(expense.date),
        receipt_number: expense.receipt_number || '',
      });
    } else {
      form.reset();
    }
  }, [expense, opened]);

  const handleSubmit = async (values: typeof form.values) => {
    const formData: ExpenseFormData = {
      amount: Number(values.amount),
      category: values.category!,
      description: values.description.trim(),
      date: dayjs(values.date!).format('YYYY-MM-DD'),
      receipt_number: values.receipt_number.trim() || undefined,
    };

    const result = expense
      ? await updateExpense(expense.id, formData)
      : await createExpense(formData);

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess(expense ? 'Gider güncellendi' : 'Gider eklendi');
      form.reset();
      onClose(true);
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={() => {
        form.reset();
        onClose(false);
      }}
      title={expense ? 'Gider Düzenle' : 'Yeni Gider'}
      position="right"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <DateInput
            label="Tarih"
            placeholder="Tarih seçiniz"
            required
            {...form.getInputProps('date')}
          />

          <Select
            label="Kategori"
            placeholder="Kategori seçiniz"
            data={EXPENSE_CATEGORIES}
            required
            searchable
            {...form.getInputProps('category')}
          />

          <NumberInput
            label="Tutar"
            placeholder="0.00"
            required
            min={0}
            decimalScale={2}
            fixedDecimalScale
            thousandSeparator=","
            prefix="₺"
            {...form.getInputProps('amount')}
          />

          <Textarea
            label="Açıklama"
            placeholder="Gider açıklaması..."
            required
            minRows={3}
            maxRows={6}
            autosize
            {...form.getInputProps('description')}
          />

          <TextInput
            label="Fiş / Fatura Numarası"
            placeholder="Opsiyonel"
            {...form.getInputProps('receipt_number')}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => {
                form.reset();
                onClose(false);
              }}
            >
              İptal
            </Button>
            <Button type="submit">{expense ? 'Güncelle' : 'Ekle'}</Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}

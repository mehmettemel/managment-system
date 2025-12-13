/**
 * AddEnrollmentModal Component
 * Modal for adding class enrollments to existing members
 * Separated from MemberDrawer for cleaner UX and separation of concerns
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  MultiSelect,
  NumberInput,
  Select,
  Button,
  Group,
  Text,
  Card,
  Grid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { formatCurrency } from '@/utils/formatters';
import { IconCalendar, IconClock } from '@tabler/icons-react';
import type { Class } from '@/types';

interface AddEnrollmentModalProps {
  opened: boolean;
  onClose: () => void;
  availableClasses: Class[]; // Classes not yet enrolled
  onConfirm: (
    registrations: {
      class_id: number;
      price: number;
      duration: number;
    }[]
  ) => Promise<void>;
  loading?: boolean;
}

interface FormValues {
  class_ids: string[];
  prices: Record<string, number>;
  durations: Record<string, number>;
}

export function AddEnrollmentModal({
  opened,
  onClose,
  availableClasses,
  onConfirm,
  loading = false,
}: AddEnrollmentModalProps) {
  const form = useForm<FormValues>({
    initialValues: {
      class_ids: [],
      prices: {},
      durations: {},
    },
    validate: {
      class_ids: (value) =>
        value && value.length > 0 ? null : 'En az bir ders seçmelisiniz',
    },
  });

  // Auto-populate prices from class defaults when class is selected
  useEffect(() => {
    const selectedIds = form.values.class_ids;
    const currentPrices = { ...form.values.prices };
    const currentDurations = { ...form.values.durations };
    let changed = false;

    selectedIds.forEach((id) => {
      if (currentPrices[id] === undefined) {
        const cls = availableClasses.find((c) => String(c.id) === id);
        currentPrices[id] = cls ? Number(cls.price_monthly) : 0;
        changed = true;
      }
      if (currentDurations[id] === undefined) {
        currentDurations[id] = 1; // Default 1 month
        changed = true;
      }
    });

    if (changed) {
      form.setFieldValue('prices', currentPrices);
      form.setFieldValue('durations', currentDurations);
    }
  }, [form.values.class_ids, availableClasses]);

  const handleSubmit = async (values: FormValues) => {
    const registrations = values.class_ids.map((id) => ({
      class_id: Number(id),
      price: values.prices[id] || 0,
      duration: values.durations[id] || 1,
    }));

    await onConfirm(registrations);
    form.reset();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const classOptions = availableClasses.map((c) => ({
    value: String(c.id),
    label: `${c.name} (${c.day_of_week} ${c.start_time?.slice(0, 5)})`,
  }));

  const selectedClasses = availableClasses.filter((c) =>
    form.values.class_ids.includes(String(c.id))
  );

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Derse Kayıt"
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <MultiSelect
            label="Dersleri Seçin"
            placeholder="Ders ara..."
            data={classOptions}
            searchable
            required
            {...form.getInputProps('class_ids')}
            description="Üyeyi kaydetmek istediğiniz dersleri seçin"
          />

          {/* Dynamic Price/Duration for each selected class */}
          {selectedClasses.length > 0 && (
            <Stack gap="md" mt="xs">
              <Text size="sm" fw={500}>
                Ders Detayları:
              </Text>
              {selectedClasses.map((c) => {
                const cId = String(c.id);
                return (
                  <Card
                    key={c.id}
                    withBorder
                    radius="sm"
                    p="sm"
                    className="bg-gray-50 dark:bg-zinc-900/50"
                  >
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <Text fw={600} size="sm">
                          {c.name}
                        </Text>
                        <Group gap={4} c="dimmed">
                          <IconCalendar size={12} />
                          <Text size="xs">{c.day_of_week}</Text>
                          <IconClock size={12} />
                          <Text size="xs">{c.start_time?.slice(0, 5)}</Text>
                        </Group>
                      </Group>
                    </Group>

                    <Grid>
                      <Grid.Col span={6}>
                        <NumberInput
                          label="Anlaşılan Ücret"
                          prefix="₺ "
                          min={0}
                          thousandSeparator=","
                          decimalSeparator="."
                          {...form.getInputProps(`prices.${cId}`)}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Select
                          label="Üyelik Süresi"
                          data={[
                            { value: '1', label: '1 Ay' },
                            { value: '3', label: '3 Ay' },
                            { value: '6', label: '6 Ay' },
                            { value: '12', label: '1 Yıl' },
                          ]}
                          {...form.getInputProps(`durations.${cId}`)}
                          onChange={(val) =>
                            form.setFieldValue(`durations.${cId}`, Number(val))
                          }
                          value={String(form.values.durations[cId] || 1)}
                        />
                      </Grid.Col>
                    </Grid>
                  </Card>
                );
              })}

              <Group justify="flex-end">
                <Text size="sm" c="dimmed">
                  Toplam Aylık Ücret:{' '}
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {formatCurrency(
                      Object.values(form.values.prices).reduce(
                        (a, b) => a + Number(b),
                        0
                      )
                    )}
                  </span>
                </Text>
              </Group>
            </Stack>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" loading={loading}>
              Derslere Kaydet
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

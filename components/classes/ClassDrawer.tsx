/**
 * Class Drawer Component
 * For creating and editing classes
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Drawer,
  Button,
  TextInput,
  Stack,
  Group,
  Text,
  Select,
  NumberInput,
  Checkbox,
  Alert,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { createClass, updateClass } from '@/actions/classes';
import { showSuccess, showError } from '@/utils/notifications';
import type { Class, ClassInsert, Instructor, DanceType } from '@/types';
import { IconClock, IconAlertCircle } from '@tabler/icons-react';

interface ClassDrawerProps {
  opened: boolean;
  onClose: () => void;
  classItem?: Class | null;
  instructors: Instructor[];
  danceTypes: DanceType[];
  onSuccess?: () => void;
}

export function ClassDrawer({
  opened,
  onClose,
  classItem,
  instructors,
  danceTypes,
  onSuccess,
}: ClassDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [updateExistingPrices, setUpdateExistingPrices] = useState(false);

  const form = useForm<ClassInsert>({
    initialValues: {
      name: '',
      instructor_id: null,
      dance_type_id: null,
      day_of_week: 'Pazartesi',
      start_time: '19:00',
      duration_minutes: 60,
      price_monthly: 0,
      instructor_commission_rate: null,
    },
    validate: {
      name: (value) => (value.trim().length < 2 ? 'Ders adı gerekli' : null),
      instructor_id: (value) => (!value ? 'Eğitmen seçimi zorunludur' : null),
      start_time: (value) => (!value ? 'Başlangıç saati zorunludur' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (classItem) {
        // Editing existing class - use type assertion for new fields until types are regenerated
        const item = classItem as any;
        form.setValues({
          name: item.name || '',
          instructor_id: item.instructor_id || null,
          dance_type_id: item.dance_type_id || null,
          day_of_week: item.day_of_week || 'Pazartesi',
          start_time: item.start_time || '19:00',
          duration_minutes: item.duration_minutes || 60,
          price_monthly: item.price_monthly || 0,
          instructor_commission_rate: item.instructor_commission_rate || null,
        });
      } else {
        // Creating new class - reset to initial values
        form.setValues({
          name: '',
          instructor_id: null,
          dance_type_id: null,
          day_of_week: 'Pazartesi',
          start_time: '19:00',
          duration_minutes: 60,
          price_monthly: 0,
          instructor_commission_rate: null,
        });
      }
    }
  }, [opened, classItem]);

  const handleSubmit = async (values: ClassInsert) => {
    setLoading(true);
    try {
      // Ensure specific types for numbers
      const payload = {
        ...values,
        instructor_id: Number(values.instructor_id),
        dance_type_id: Number(values.dance_type_id),
        duration_minutes: Number(values.duration_minutes),
        price_monthly: Number(values.price_monthly),
        instructor_commission_rate: values.instructor_commission_rate
          ? Number(values.instructor_commission_rate)
          : null,
      };

      if (classItem) {
        const result = await updateClass(classItem.id, payload, updateExistingPrices);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess(
            updateExistingPrices
              ? 'Ders ve mevcut üyelerin fiyatı güncellendi'
              : 'Ders güncellendi'
          );
          setUpdateExistingPrices(false);
          onSuccess?.();
          onClose();
        }
      } else {
        const result = await createClass(payload);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess('Ders eklendi');
          form.reset();
          setUpdateExistingPrices(false);
          onSuccess?.();
          onClose();
        }
      }
    } catch (error) {
      showError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const instructorOptions = instructors.map((inst) => ({
    value: String(inst.id),
    label: `${inst.first_name} ${inst.last_name}`,
  }));

  const days = [
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
    'Cumartesi',
    'Pazar',
  ];

  return (
    <Drawer
      opened={opened}
      onClose={() => {
        setUpdateExistingPrices(false);
        onClose();
      }}
      title={
        <Text size="lg" fw={600}>
          {classItem ? 'Ders Düzenle' : 'Yeni Ders Ekle'}
        </Text>
      }
      position="right"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Ders Adı"
            placeholder="Örn: Başlangıç Salsa"
            required
            {...form.getInputProps('name')}
          />

          <Select
            label="Eğitmen"
            placeholder="Seçin"
            data={instructorOptions}
            searchable
            required
            {...form.getInputProps('instructor_id')}
            value={
              form.values.instructor_id
                ? String(form.values.instructor_id)
                : null
            }
            onChange={(val) =>
              form.setFieldValue('instructor_id', val ? Number(val) : null)
            }
          />

          <Select
            label="Dans Türü"
            placeholder="Seçin (Opsiyonel)"
            data={danceTypes.map((dt) => ({
              value: String(dt.id),
              label: dt.name,
            }))}
            searchable
            clearable
            {...form.getInputProps('dance_type_id')}
            value={
              form.values.dance_type_id
                ? String(form.values.dance_type_id)
                : null
            }
            onChange={(val) =>
              form.setFieldValue('dance_type_id', val ? Number(val) : null)
            }
          />

          <Select
            label="Gün"
            data={days}
            required
            {...form.getInputProps('day_of_week')}
          />

          <TimeInput
            label="Başlangıç Saati"
            required
            leftSection={<IconClock size={16} />}
            {...form.getInputProps('start_time')}
          />

          <NumberInput
            label="Süre (Dakika)"
            min={15}
            step={15}
            required
            {...form.getInputProps('duration_minutes')}
          />

          <NumberInput
            label="Aylık Ücret"
            min={0}
            step={100}
            leftSection="₺"
            thousandSeparator="."
            decimalSeparator=","
            {...form.getInputProps('price_monthly')}
          />

          <NumberInput
            label="Eğitmen Komisyon Oranı (%)"
            description="Bu ders için özel komisyon oranı (boş bırakılırsa eğitmenin varsayılan oranı kullanılır)"
            min={0}
            max={100}
            step={5}
            leftSection="%"
            placeholder="Varsayılan oranı kullan"
            {...form.getInputProps('instructor_commission_rate')}
          />

          {classItem && form.values.price_monthly !== classItem.price_monthly && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Fiyat Değişikliği"
              color="orange"
            >
              <Stack gap="xs">
                <Text size="sm">
                  Dersin fiyatını değiştiriyorsunuz. Mevcut üyelerin fiyatını da güncellemek ister misiniz?
                </Text>
                <Checkbox
                  label="Mevcut üyelerin fiyatını da güncelle"
                  description="Aktif olarak bu derse kayıtlı tüm üyelerin aylık ödemesi yeni fiyata güncellenecek"
                  checked={updateExistingPrices}
                  onChange={(e) => setUpdateExistingPrices(e.currentTarget.checked)}
                />
              </Stack>
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" loading={loading}>
              Kaydet
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}

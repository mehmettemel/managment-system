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
  Radio,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { createClass, updateClass } from '@/actions/classes';
import { showSuccess, showError } from '@/utils/notifications';
import type { Class, Instructor, DanceType } from '@/types';
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
  const [previousInstructorId, setPreviousInstructorId] = useState<
    number | null
  >(null);
  const [instructorChangeDetected, setInstructorChangeDetected] =
    useState(false);
  const [commissionType, setCommissionType] = useState<
    'default' | 'specialty' | 'custom'
  >('default');

  const form = useForm({
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
      price_monthly: (value) => (value <= 0 ? 'Aylık ücret 0 TL olamaz' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (classItem) {
        // Editing possible existing class
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

        // Determine commission type
        if (item.instructor_commission_rate === null) {
          setCommissionType('default');
        } else {
          // Check if it matches specialty
          const instr = instructors.find((i) => i.id === item.instructor_id);
          // Use Number() to ensure type safety for IDs and Rates
          const specRate = instr?.instructor_rates?.find(
            (r) => Number(r.dance_type_id) === Number(item.dance_type_id)
          )?.rate;

          if (
            specRate !== undefined &&
            Math.abs(
              Number(specRate) - Number(item.instructor_commission_rate)
            ) < 0.01
          ) {
            setCommissionType('specialty');
          } else {
            // custom logic or legacy
            setCommissionType('custom');
          }
        }

        setPreviousInstructorId(item.instructor_id);
      } else {
        // Creating new class
        form.setValues({
          name: '',
          instructor_id: null,
          dance_type_id: null,
          day_of_week: 'Pazartesi',
          start_time: '19:00',
          duration_minutes: 60,
          price_monthly: 0,
          instructor_commission_rate: null, // Default
        });
        setCommissionType('default');
        setPreviousInstructorId(null);
      }
      setInstructorChangeDetected(false);
    }
  }, [opened, classItem]); // Instructors stable

  // Detect instructor change
  useEffect(() => {
    if (!classItem || !previousInstructorId) return;

    const currentInstructorId = form.values.instructor_id;

    if (currentInstructorId && currentInstructorId !== previousInstructorId) {
      setInstructorChangeDetected(true);
    } else {
      setInstructorChangeDetected(false);
    }
  }, [form.values.instructor_id, previousInstructorId, classItem]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // Determine final rate logic
      let finalCommissionRate: number | null = null;

      if (commissionType === 'default') {
        finalCommissionRate = null;
      } else if (commissionType === 'specialty') {
        const instr = instructors.find((i) => i.id === values.instructor_id);
        const specRate = instr?.instructor_rates?.find(
          (r) => Number(r.dance_type_id) === Number(values.dance_type_id)
        )?.rate;
        finalCommissionRate = specRate !== undefined ? specRate : null;
      } else if (commissionType === 'custom') {
        finalCommissionRate = values.instructor_commission_rate;
      }

      const payload: any = {
        name: values.name,
        instructor_id: values.instructor_id
          ? Number(values.instructor_id)
          : null,
        dance_type_id: values.dance_type_id
          ? Number(values.dance_type_id)
          : null,
        day_of_week: values.day_of_week,
        start_time: values.start_time,
        duration_minutes: Number(values.duration_minutes),
        price_monthly: Number(values.price_monthly),
        instructor_commission_rate: finalCommissionRate,
      };

      if (classItem) {
        const result = await updateClass(
          classItem.id,
          payload,
          updateExistingPrices
        );
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess(
            updateExistingPrices
              ? 'Ders ve mevcut üyelerin fiyatı güncellendi'
              : 'Ders güncellendi'
          );
          setUpdateExistingPrices(false);
          setInstructorChangeDetected(false);
          setPreviousInstructorId(null);
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
          setInstructorChangeDetected(false);
          setPreviousInstructorId(null);
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

  const getPreviousInstructor = () =>
    instructors.find((i) => i.id === previousInstructorId);
  const getCurrentInstructor = () =>
    instructors.find((i) => i.id === form.values.instructor_id);

  const handleUseNewInstructorDefault = () => {
    const newInstructor = getCurrentInstructor();
    if (newInstructor) {
      // Logic handled in submit, but we can set form for custom visualization or reset
      setCommissionType('default');
      setInstructorChangeDetected(false);
    }
  };

  const handleKeepCurrentRate = () => {
    // Force to custom to preserve the numeric value
    setCommissionType('custom');
    setInstructorChangeDetected(false);
  };

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
        setInstructorChangeDetected(false);
        setPreviousInstructorId(null);
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

          {instructorChangeDetected &&
            (() => {
              const prevInstructor = getPreviousInstructor();
              const newInstructor = getCurrentInstructor();
              const currentRate = (classItem as any)
                ?.instructor_commission_rate;
              const newDefaultRate = newInstructor?.default_commission_rate;

              return (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Eğitmen Değişikliği Tespit Edildi"
                  color="blue"
                >
                  <Stack gap="xs">
                    <Text size="sm">
                      <strong>Eski Eğitmen:</strong>{' '}
                      {prevInstructor?.first_name} {prevInstructor?.last_name}
                      <br />
                      {currentRate !== null && currentRate !== undefined && (
                        <>Bu derste özel komisyon: %{currentRate}</>
                      )}
                    </Text>
                    <Text size="sm">
                      <strong>Yeni Eğitmen:</strong> {newInstructor?.first_name}{' '}
                      {newInstructor?.last_name}
                      <br />
                      Varsayılan komisyon: %{newDefaultRate ?? 0}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Komisyon oranını nasıl güncellemek istersiniz?
                    </Text>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        onClick={handleUseNewInstructorDefault}
                      >
                        Yeni varsayılanı kullan (%{newDefaultRate ?? 0})
                      </Button>
                      <Button
                        size="xs"
                        variant="light"
                        color="gray"
                        onClick={handleKeepCurrentRate}
                      >
                        Mevcut oranı koru
                        {currentRate !== null && currentRate !== undefined
                          ? ` (%${currentRate})`
                          : ''}
                      </Button>
                    </Group>
                  </Stack>
                </Alert>
              );
            })()}

          {/* New Commission Selection Logic */}
          {(() => {
            const instr = instructors.find(
              (i) => i.id === form.values.instructor_id
            );
            const danceType = danceTypes.find(
              (dt) => dt.id === form.values.dance_type_id
            );
            const defaultRate = instr?.default_commission_rate ?? 30;
            const specialtyRate = instr?.instructor_rates?.find(
              (r) => r.dance_type_id === form.values.dance_type_id
            )?.rate;

            return (
              <Stack gap={4}>
                <Text size="sm" fw={500}>
                  Eğitmen Komisyonu
                </Text>
                <Radio.Group
                  value={commissionType}
                  onChange={(val: any) => setCommissionType(val)}
                >
                  <Stack gap="xs" mt="xs">
                    <Radio
                      value="default"
                      label={`Varsayılan Komisyon (%${defaultRate})`}
                    />
                    {specialtyRate !== undefined && (
                      <Radio
                        value="specialty"
                        label={`Uzmanlık: ${danceType?.name ?? 'Seçili Dans'} (%${specialtyRate})`}
                      />
                    )}
                    {commissionType === 'custom' && (
                      <Radio
                        value="custom"
                        label={`Özel Tanımlı (%${form.values.instructor_commission_rate})`}
                        disabled // Cannot switch INTO custom, only preserve
                      />
                    )}
                  </Stack>
                </Radio.Group>
                <Text size="xs" c="dimmed" mt={4}>
                  {commissionType === 'default' &&
                    `Eğitmenin varsayılan komisyon oranı kullanılır (%${defaultRate}).`}
                  {commissionType === 'specialty' &&
                    `Bu dans türü için tanımlı uzmanlık oranı kullanılır (%${specialtyRate}).`}
                  {commissionType === 'custom' &&
                    `Bu ders için manuel tanımlanmış özel oran korunuyor (%${form.values.instructor_commission_rate}).`}
                </Text>
              </Stack>
            );
          })()}

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
            onChange={(val) => {
              const newVal = val ? Number(val) : null;
              form.setFieldValue('dance_type_id', newVal);
            }}
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

          {classItem &&
            form.values.price_monthly !== classItem.price_monthly && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Fiyat Değişikliği"
                color="orange"
              >
                <Stack gap="xs">
                  <Text size="sm">
                    Dersin fiyatını değiştiriyorsunuz. Mevcut üyelerin fiyatını
                    da güncellemek ister misiniz?
                  </Text>
                  <Checkbox
                    label="Mevcut üyelerin fiyatını da güncelle"
                    description="Aktif olarak bu derse kayıtlı tüm üyelerin aylık ödemesi yeni fiyata güncellenecek"
                    checked={updateExistingPrices}
                    onChange={(e) =>
                      setUpdateExistingPrices(e.currentTarget.checked)
                    }
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

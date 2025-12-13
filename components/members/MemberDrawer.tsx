/**
 * Member Drawer Component
 * For creating and editing members with enhanced class-based pricing logic
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Drawer,
  Button,
  TextInput,
  Stack,
  Group,
  MultiSelect,
  NumberInput,
  Text,
  Select,
  Card,
  Grid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { formatCurrency } from '@/utils/formatters';
import { MaskedPhoneInput } from '@/components/shared/MaskedPhoneInput';
import {
  createMember,
  updateMember,
  getMemberById,
  updateMemberClassDetails,
  addMemberToClasses,
} from '@/actions/members';
import { showSuccess, showError } from '@/utils/notifications';
import type { Member, MemberFormData } from '@/types';
import { IconCalendar, IconClock } from '@tabler/icons-react';

interface MemberDrawerProps {
  opened: boolean;
  onClose: () => void;
  member?: Member | null;
  classes: any[]; // We need full class objects here
  onSuccess?: () => void;
}

interface FormValues {
  first_name: string;
  last_name: string;
  phone: string;
  class_ids: string[];
  // Flat map of class_id -> price
  prices: Record<string, number>;
  // Flat map of class_id -> duration
  durations: Record<string, number>;
}

export function MemberDrawer({
  opened,
  onClose,
  member,
  classes,
  onSuccess,
}: MemberDrawerProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      first_name: '',
      last_name: '',
      phone: '',
      class_ids: [],
      prices: {},
      durations: {},
    },
    validate: {
      first_name: (value) =>
        value && value.trim().length >= 2 ? null : 'Ad en az 2 karakter olmalı',
      last_name: (value) =>
        value && value.trim().length >= 2
          ? null
          : 'Soyad en az 2 karakter olmalı',
      class_ids: (value) =>
        value && value.length > 0 ? null : 'En az bir ders seçmelisiniz',
    },
  });

  // Initialize form when member prop changes (for editing)
  useEffect(() => {
    const fetchDetails = async () => {
      if (member) {
        setLoading(true);

        // Fetch relations (classes)
        const { data } = await getMemberById(member.id);

        const existingClassIds: string[] = [];
        const existingPrices: Record<string, number> = {};
        const existingDurations: Record<string, number> = {};

        if (data && data.member_classes) {
          data.member_classes.forEach((mc: any) => {
            const cId = String(mc.class_id);
            if (mc.active) {
              existingClassIds.push(cId);
              existingPrices[cId] = Number(mc.price) || 0;
              existingDurations[cId] = mc.payment_interval || 1;
            }
          });
        }

        form.setValues({
          first_name: member.first_name,
          last_name: member.last_name,
          phone: member.phone || '',
          class_ids: existingClassIds,
          prices: existingPrices,
          durations: existingDurations,
        });

        setLoading(false);
      } else {
        form.reset();
        form.setValues({
          first_name: '',
          last_name: '',
          phone: '',
          class_ids: [],
          prices: {},
          durations: {},
        });
      }
    };

    if (opened) {
      fetchDetails();
    }
  }, [opened, member]);

  // Watch class_ids to initialize defaults for new selections
  useEffect(() => {
    const selectedIds = form.values.class_ids;
    const currentPrices = { ...form.values.prices };
    const currentDurations = { ...form.values.durations };
    let changed = false;

    selectedIds.forEach((id) => {
      if (currentPrices[id] === undefined) {
        const cls = classes.find((c) => String(c.id) === id);
        currentPrices[id] = cls ? Number(cls.price_monthly) : 0;
        changed = true;
      }
      if (currentDurations[id] === undefined) {
        currentDurations[id] = 1; // Default duration 1 month
        changed = true;
      }
    });

    if (changed) {
      form.setFieldValue('prices', currentPrices);
      form.setFieldValue('durations', currentDurations);
    }
  }, [form.values.class_ids, classes]);

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (member) {
        // Update logic - simplistic for now, just main info
        // Class updates are complex in edit mode with this new structure,
        // usually strictly handled via add/remove class specific actions, not full overwrite.
        // For now, let's allow updating name/phone. Class changes might require a specialized logic or just delete/add in database.
        // Given complexity, let's only update basic info and show a warning or handling for classes elsewhere?
        // OR: for now, map the class changes? It's risky to delete member_classes and recreate due to payment history.
        // Best approach for MVP Update: Update Personal Info ONLY. Class changes should be done via "Manage Classes" or similar if needed.
        // But user might expect to add a class here.
        // Let's stick to updating basic info here as per `updateMember` capability.

        const result = await updateMember(member.id, {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
        });

        // Update class details (price and duration)
        // We iterate over existing classes and update them if needed
        const existingClassIds = new Set<string>();

        if ((member as any).member_classes) {
          await Promise.all(
            (member as any).member_classes.map(async (mc: any) => {
              const cId = String(mc.class_id);
              existingClassIds.add(cId); // Track existing

              // Only process if it is STILL selected (logic below keeps select enabled)
              // But currently removal is not supported, so they should be in values.class_ids
              if (values.class_ids.includes(cId)) {
                const newPrice = values.prices[cId];
                const newDuration = values.durations[cId];

                if (newPrice !== undefined || newDuration !== undefined) {
                  await updateMemberClassDetails(member.id, mc.class_id, {
                    price:
                      newPrice !== undefined ? Number(newPrice) : undefined,
                    custom_price:
                      newPrice !== undefined ? Number(newPrice) : undefined,
                    payment_interval:
                      newDuration !== undefined
                        ? Number(newDuration)
                        : undefined,
                  });
                }
              }
            })
          );
        }

        // D1: Identify NEW classes and add them
        const newClassIds = values.class_ids.filter(
          (id) => !existingClassIds.has(id)
        );

        if (newClassIds.length > 0) {
          const newRegistrations = newClassIds.map((id) => ({
            class_id: Number(id),
            price: values.prices[id] || 0,
            duration: values.durations[id] || 1,
          }));

          const addResult = await addMemberToClasses(
            member.id,
            newRegistrations
          );
          if (addResult.error) {
            showError(
              'Yeni dersler eklenirken hata oluştu: ' + addResult.error
            );
            // Return or continue? Let's assume partial success is OK or just notify.
          }
        }

        if (result.error) showError(result.error);
        else {
          showSuccess('Üye bilgileri ve ders detayları güncellendi');
          onSuccess?.();
          onClose();
        }
        onClose(); // Ensure close runs if success
        // Note: onClose calls reset so we are good.
      } else {
        // Create Logic
        const classRegistrations = values.class_ids.map((id) => ({
          class_id: Number(id),
          price: values.prices[id] || 0,
          duration: values.durations[id] || 1,
        }));

        const formData: MemberFormData = {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          phone: values.phone?.trim(),
          class_registrations: classRegistrations,
        };

        const result = await createMember(formData);
        if (result.error) showError(result.error);
        else {
          showSuccess('Yeni üye eklendi');
          form.reset();
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

  const classOptions = classes.map((c) => ({
    value: String(c.id),
    label: `${c.name} (${c.day_of_week} ${c.start_time?.slice(0, 5)})`,
  }));

  const selectedClasses = classes.filter((c) =>
    form.values.class_ids.includes(String(c.id))
  );

  return (
    <Drawer
      opened={opened}
      onClose={() => {
        form.reset();
        onClose();
      }}
      title={
        <Text size="lg" fw={600}>
          {member ? 'Üye Düzenle' : 'Yeni Üye Kaydı'}
        </Text>
      }
      position="right"
      size="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* 1. Personal Info */}
          <Card withBorder radius="md" p="md">
            <Text fw={600} mb="sm" c="dimmed">
              Kişisel Bilgiler
            </Text>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Ad"
                  placeholder="Ahmet"
                  required
                  {...form.getInputProps('first_name')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Soyad"
                  placeholder="Yılmaz"
                  required
                  {...form.getInputProps('last_name')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <MaskedPhoneInput
                  label="Telefon"
                  {...form.getInputProps('phone')}
                />
              </Grid.Col>
            </Grid>
          </Card>

          {/* 2. Membership Selection */}
          <Card withBorder radius="md" p="md">
            <Text fw={600} mb="sm" c="dimmed">
              Ders Seçimi ve Ücretlendirme
            </Text>
            <Stack>
              <MultiSelect
                label="Dersleri Seçin"
                placeholder="Ders ara..."
                data={classOptions}
                searchable
                required
                {...form.getInputProps('class_ids')}
                description={
                  member
                    ? 'Yeni ders ekleyebilir veya mevcut derslerin ücretini güncelleyebilirsiniz'
                    : 'Üyenin katılacağı dersler'
                }
                // disabled={!!member} // Enabled for D1
              />

              {/* Dynamic Price/Duration Fields for Each Selected Class */}
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
                              <IconCalendar size={12} />{' '}
                              <Text size="xs">{c.day_of_week}</Text>
                              <IconClock size={12} />{' '}
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
                                form.setFieldValue(
                                  `durations.${cId}`,
                                  Number(val)
                                )
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
            </Stack>
          </Card>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" loading={loading} disabled={!form.isValid()}>
              Kaydet
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}

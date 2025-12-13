/**
 * Member Drawer Component
 * Simplified for creating and editing member personal information only
 * Class management moved to MemberDetailView for better UX
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
  Card,
  Grid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { MaskedPhoneInput } from '@/components/shared/MaskedPhoneInput';
import { createMember, updateMember } from '@/actions/members';
import { showSuccess, showError } from '@/utils/notifications';
import type { Member, MemberFormData } from '@/types';

interface MemberDrawerProps {
  opened: boolean;
  onClose: () => void;
  member?: Member | null;
  onSuccess?: () => void;
}

interface FormValues {
  first_name: string;
  last_name: string;
  phone: string;
}

export function MemberDrawer({
  opened,
  onClose,
  member,
  onSuccess,
}: MemberDrawerProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      first_name: '',
      last_name: '',
      phone: '',
    },
    validate: {
      first_name: (value) =>
        value && value.trim().length >= 2 ? null : 'Ad en az 2 karakter olmalı',
      last_name: (value) =>
        value && value.trim().length >= 2
          ? null
          : 'Soyad en az 2 karakter olmalı',
    },
  });

  // Initialize form when member prop changes (for editing)
  useEffect(() => {
    if (opened) {
      if (member) {
        // Edit mode: Load member data
        form.setValues({
          first_name: member.first_name,
          last_name: member.last_name,
          phone: member.phone || '',
        });
      } else {
        // Create mode: Reset to empty
        form.reset();
      }
    }
  }, [opened, member]);

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (member) {
        // Edit Mode: Update personal info only
        const result = await updateMember(member.id, {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          phone: values.phone?.trim(),
        });

        if (result.error) {
          showError(result.error);
        } else {
          showSuccess('Üye bilgileri güncellendi');
          onSuccess?.();
          onClose();
        }
      } else {
        // Create Mode: Create member without classes
        const formData: MemberFormData = {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          phone: values.phone?.trim(),
          // No class_registrations - will be added later from detail view
        };

        const result = await createMember(formData);
        if (result.error) {
          showError(result.error);
        } else {
          showSuccess('Yeni üye eklendi! Artık derslerine kayıt yapabilirsiniz.');
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
      size="md"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Personal Info Card */}
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

          {/* Helper Text for Create Mode */}
          {!member && (
            <Text size="sm" c="dimmed" ta="center">
              Ders kayıtlarını üye oluşturduktan sonra detay sayfasından
              ekleyebilirsiniz.
            </Text>
          )}

          {/* Submit Buttons */}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={loading}>
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

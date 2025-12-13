/**
 * Drawer component for freezing a member
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Modal,
  Button,
  Stack,
  Text,
  Textarea,
  Switch,
  Group,
  LoadingOverlay,
  Checkbox,
  ScrollArea,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconSnowflake } from '@tabler/icons-react';
import { freezeMembership } from '@/actions/freeze';
import { showSuccess, showError } from '@/utils/notifications';
import type { Member, MemberWithClasses } from '@/types';

interface FreezeMemberDrawerProps {
  opened: boolean;
  onClose: () => void;
  member: Member | MemberWithClasses | null;
  onSuccess?: () => void;
  initialSelectedEnrollmentId?: number | null;
}

export function FreezeMemberDrawer({
  opened,
  onClose,
  member,
  onSuccess,
  initialSelectedEnrollmentId,
}: FreezeMemberDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [isIndefinite, setIsIndefinite] = useState(false);

  // We need to know available classes to freeze
  // Cast member to MemberWithClasses if possible
  const memberWithClasses = member as MemberWithClasses | null;
  const activeClasses =
    memberWithClasses?.member_classes?.filter((mc) => mc.active) || [];

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const form = useForm({
    initialValues: {
      start_date: new Date(),
      end_date: null as Date | null,
      reason: '',
    },
    validate: {
      start_date: (value) => (value ? null : 'Başlangıç tarihi gerekli'),
      end_date: (value) =>
        !isIndefinite && !value
          ? 'Bitiş tarihi gerekli (veya süresiz seçeneğini işaretleyin)'
          : null,
    },
  });

  // Reset form when drawer opens/closes or member changes
  useEffect(() => {
    if (opened) {
      form.reset();
      setLoading(false);
      setIsIndefinite(false);

      // Handle initial selection
      if (initialSelectedEnrollmentId) {
        setSelectedClasses([String(initialSelectedEnrollmentId)]);
      } else if (activeClasses.length > 0) {
        // Default: select all active classes
        setSelectedClasses(activeClasses.map((c) => String(c.id)));
      } else {
        setSelectedClasses([]);
      }
    }
  }, [opened, member, initialSelectedEnrollmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (values: typeof form.values) => {
    if (!member) return;

    // If we have active classes but none selected, show error
    if (activeClasses.length > 0 && selectedClasses.length === 0) {
      showError('Lütfen en az bir ders seçin veya işlemi iptal edin.');
      return;
    }

    setLoading(true);
    try {
      const formData = {
        member_id: member.id,
        start_date: values.start_date.toISOString().split('T')[0],
        end_date: isIndefinite
          ? undefined
          : values.end_date?.toISOString().split('T')[0],
        reason: values.reason,
        is_indefinite: isIndefinite,
        selectedEnrollmentIds: selectedClasses.map(Number),
      };

      const res = await freezeMembership(formData);

      if (res.error) {
        showError(res.error);
      } else {
        showSuccess('Üyelik donduruldu');
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      showError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Üyeliği Dondur" centered>
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Text size="sm" c="dimmed">
            Seçilen Üye:{' '}
            <Text span fw={700}>
              {member?.first_name} {member?.last_name}
            </Text>
          </Text>

          {activeClasses.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Dondurulacak Dersler
              </Text>
              <Checkbox.Group
                value={selectedClasses}
                onChange={setSelectedClasses}
              >
                <Stack gap="xs">
                  {activeClasses.map((mc) => (
                    <Checkbox
                      key={mc.id}
                      value={String(mc.id)}
                      label={`${mc.classes?.name || 'Ders'} (${mc.payment_interval ? mc.payment_interval + ' Ay' : 'Aylık'})`}
                    />
                  ))}
                </Stack>
              </Checkbox.Group>
            </Stack>
          )}

          <Switch
            label="Süresiz Dondur (Dönüş tarihi belli değil)"
            checked={isIndefinite}
            onChange={(event) => setIsIndefinite(event.currentTarget.checked)}
          />

          <DateInput
            label="Başlangıç Tarihi"
            placeholder="Tarih seçin"
            value={form.values.start_date}
            onChange={(date) => form.setFieldValue('start_date', date as any)}
            error={form.errors.start_date}
            required
          />

          {!isIndefinite && (
            <DateInput
              label="Bitiş Tarihi"
              placeholder="Tarih seçin"
              value={form.values.end_date}
              onChange={(date) => form.setFieldValue('end_date', date as any)}
              error={form.errors.end_date}
              required
              minDate={form.values.start_date || undefined}
            />
          )}

          <Textarea
            label="Sebep (Opsiyonel)"
            placeholder="Örn: Sağlık sorunu, tatil..."
            {...form.getInputProps('reason')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button
              type="submit"
              color="cyan"
              loading={loading}
              disabled={
                activeClasses.length > 0 && selectedClasses.length === 0
              }
              leftSection={<IconSnowflake size={16} />}
            >
              Dondur
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

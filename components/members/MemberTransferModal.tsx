'use client';

import {
  Modal,
  Select,
  Radio,
  Group,
  Button,
  Stack,
  Text,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconInfoCircle } from '@tabler/icons-react';
import { ClassWithInstructor, MemberClassWithDetails } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface MemberTransferModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (values: {
    newClassId: string;
    priceStrategy: 'KEEP_OLD' | 'USE_NEW';
  }) => Promise<void>;
  enrollment: MemberClassWithDetails;
  classes: ClassWithInstructor[];
  loading?: boolean;
}

export function MemberTransferModal({
  opened,
  onClose,
  onConfirm,
  enrollment,
  classes,
  loading = false,
}: MemberTransferModalProps) {
  const form = useForm({
    initialValues: {
      newClassId: '',
      priceStrategy: 'KEEP_OLD' as 'KEEP_OLD' | 'USE_NEW',
    },
    validate: {
      newClassId: (value) => (!value ? 'Yeni sınıf seçiniz' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    await onConfirm(values);
    form.reset();
  };

  // Filter out current class
  const availableClasses = classes
    .filter((c) => c.id !== enrollment.class_id && !c.archived)
    .map((c) => ({
      value: String(c.id),
      label: `${c.name} (${formatCurrency(c.price_monthly)})`,
    }));

  return (
    <Modal opened={opened} onClose={onClose} title="Sınıf Transferi" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {enrollment && (
            <Stack
              gap="xs"
              p="sm"
              bg="var(--mantine-color-default-hover)"
              style={{ borderRadius: 'var(--mantine-radius-sm)' }}
            >
              <Text size="sm" fw={600} c="dimmed">
                Mevcut Kayıt
              </Text>
              <Group justify="space-between">
                <Text size="sm">{enrollment.classes?.name}</Text>
                <Text size="sm" fw={700}>
                  {formatCurrency(
                    enrollment.custom_price ??
                      enrollment.classes?.price_monthly ??
                      0
                  )}
                </Text>
              </Group>
            </Stack>
          )}

          <Select
            label="Yeni Sınıf"
            placeholder="Sınıf seçiniz"
            data={availableClasses}
            {...form.getInputProps('newClassId')}
            searchable
            nothingFoundMessage="Sınıf bulunamadı"
          />

          <Radio.Group
            label="Fiyat Politikası"
            description="Transfer sonrası geçerli olacak fiyat"
            {...form.getInputProps('priceStrategy')}
          >
            <Stack mt="xs" gap="xs">
              <Radio
                value="KEEP_OLD"
                label="Eski Fiyattan Devam Et (Koruma)"
                description="Mevcut ücret veya özel fiyat korunur."
              />
              <Radio
                value="USE_NEW"
                label="Yeni Sınıf Fiyatına Geç"
                description="Seçilen sınıfın güncel liste fiyatı uygulanır."
              />
            </Stack>
          </Radio.Group>

          <Alert
            icon={<IconInfoCircle size={16} />}
            color="blue"
            variant="light"
          >
            Transfer işlemi sonrası eski sınıf kaydı pasif hale gelecek ve ödeme
            takvimi güncellenecektir. Sonraki ödeme tarihi korunur.
          </Alert>

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" loading={loading}>
              Transfer Et
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

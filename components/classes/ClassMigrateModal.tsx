'use client';

import {
  Modal,
  Select,
  Group,
  Button,
  Stack,
  Text,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';
import { ClassWithInstructor } from '@/types';

interface ClassMigrateModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (targetClassId: number) => Promise<void>;
  sourceClass: ClassWithInstructor | null;
  classes: ClassWithInstructor[];
  loading?: boolean;
}

export function ClassMigrateModal({
  opened,
  onClose,
  onConfirm,
  sourceClass,
  classes,
  loading = false,
}: ClassMigrateModalProps) {
  const form = useForm({
    initialValues: {
      targetClassId: '',
    },
    validate: {
      targetClassId: (value) => (!value ? 'Hedef sınıf seçiniz' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    await onConfirm(Number(values.targetClassId));
    form.reset();
  };

  // Filter out source class
  const availableClasses = classes
    .filter((c) => c.id !== sourceClass?.id && !c.archived)
    .map((c) => ({
      value: String(c.id),
      label: `${c.name} (${c.day_of_week} ${c.start_time})`,
    }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Sınıfı Arşivle ve Taşı"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="orange"
            title="Dikkat"
          >
            Bu işlem <strong>{sourceClass?.name}</strong> sınıfını arşivleyecek
            ve tüm aktif üyelerini yeni sınıfa taşıyacaktır.
          </Alert>

          <Select
            label="Hangi Sınıfa Taşınsın?"
            placeholder="Hedef sınıf seçiniz"
            data={availableClasses}
            {...form.getInputProps('targetClassId')}
          />

          <Alert
            icon={<IconInfoCircle size={16} />}
            color="blue"
            variant="light"
          >
            <ul>
              <li>Üyelerin bir sonraki ödeme tarihleri korunur.</li>
              <li>
                Eski sınıfın fiyatı "Özel Fiyat" olarak tanımlanır (Zamdan
                etkilenmezler).
              </li>
              <li>Eski sınıf arşivlenir ve yeni üye alımına kapanır.</li>
            </ul>
          </Alert>

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" color="red" loading={loading}>
              Sınıfı Taşı ve Arşivle
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

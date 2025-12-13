import { Modal, Stack, NumberInput, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { MemberClassWithDetails } from '@/types';

interface EditEnrollmentModalProps {
  opened: boolean;
  onClose: () => void;
  enrollment: MemberClassWithDetails | null;
  onConfirm: (values: {
    price: number;
    payment_interval: number;
    custom_price?: number;
  }) => Promise<void>;
  loading?: boolean;
}

export function EditEnrollmentModal({
  opened,
  onClose,
  enrollment,
  onConfirm,
  loading = false,
}: EditEnrollmentModalProps) {
  const form = useForm({
    initialValues: {
      price: 0,
      payment_interval: 1,
    },
    validate: {
      price: (val) => (val < 0 ? 'Fiyat 0 dan küçük olamaz' : null),
      payment_interval: (val) => (val < 1 ? 'En az 1 ay olmalı' : null),
    },
  });

  useEffect(() => {
    if (opened && enrollment) {
      form.setValues({
        price:
          enrollment.custom_price ?? enrollment.classes?.price_monthly ?? 0,
        payment_interval: enrollment.payment_interval || 1,
      });
    }
  }, [opened, enrollment]);

  const handleSubmit = async (values: typeof form.values) => {
    // If price changed from list price, set custom_price.
    // However, simplicity: just update custom_price always if user edits here?
    // Or logic?
    // Let's pass 'custom_price' as the value.
    await onConfirm({
      price: values.price, // Logic in backend might handle this
      custom_price: values.price,
      payment_interval: values.payment_interval,
    });
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Ders Planı Düzenle"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <NumberInput
            label="Aylık Ücret (Özel Fiyat)"
            description="Bu üye için özel fiyat belirleyebilirsiniz. Boş bırakılırsa (veya 0) normal liste fiyatı geçerli olabilir ama burada direkt tutar giriyoruz."
            leftSection="₺"
            thousandSeparator=","
            decimalSeparator="."
            min={0}
            {...form.getInputProps('price')}
          />

          <NumberInput
            label="Ödeme Aralığı (Taahhüt)"
            description="Ödemelerin kaç aylık periyotlarla takip edileceği (Genelde 1)"
            min={1}
            max={12}
            {...form.getInputProps('payment_interval')}
          />

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
    </Modal>
  );
}

import {
  Modal,
  Stack,
  Text,
  Radio,
  NumberInput,
  Group,
  Button,
  Card,
  Tabs,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { MemberClassWithDetails } from '@/types';
import dayjs from 'dayjs';

interface TerminationModalProps {
  opened: boolean;
  onClose: () => void;
  enrollment: MemberClassWithDetails | null;
  onConfirm: (values: TerminationFormValues) => Promise<void>;
  loading?: boolean;
}

import { TerminationFormValues } from '@/types';

export function TerminationModal({
  opened,
  onClose,
  enrollment,
  onConfirm,
  loading,
}: TerminationModalProps) {
  const form = useForm<TerminationFormValues>({
    initialValues: {
      terminationDate: new Date(),
      financialAction: 'settled',
      refundAmount: 0,
      debtAmount: 0,
    },
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${enrollment?.classes?.name || 'Ders'} - Dersi Sonlandır`}
      centered
    >
      <form onSubmit={form.onSubmit(onConfirm)}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Bu işlem sonrası ders pasif duruma geçecek ve üyelik sonlanacaktır.
          </Text>

          <DateInput
            label="Bitiş Tarihi"
            placeholder="Tarih seçin"
            {...form.getInputProps('terminationDate')}
            required
          />

          <Radio.Group
            label="Finansal Durum"
            description="Lütfen kalan bakiye veya borç durumunu belirtin"
            {...form.getInputProps('financialAction')}
          >
            <Stack mt="xs">
              <Radio
                value="settled"
                label="Hesaplaşma Tamam (Ekstra işlem yok)"
              />
              <Radio
                value="refund"
                label="Para İadesi Yapılacak (Kalan gün iadesi)"
              />
              {form.values.financialAction === 'refund' && (
                <NumberInput
                  placeholder="İade Tutarı"
                  leftSection="₺"
                  min={0}
                  thousandSeparator="."
                  decimalSeparator=","
                  {...form.getInputProps('refundAmount')}
                />
              )}
              <Radio
                value="clear_debt"
                label="Borç Silinecek (Gelecek/Ödenmemiş faturaları iptal et)"
              />
              <Radio
                value="debt"
                label="Borçlu Ayrıldı (Borç tutarını kaydet)"
              />
              {form.values.financialAction === 'debt' && (
                <NumberInput
                  placeholder="Borç Tutarı"
                  leftSection="₺"
                  min={0}
                  thousandSeparator="."
                  decimalSeparator=","
                  {...form.getInputProps('debtAmount')}
                />
              )}
            </Stack>
          </Radio.Group>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button color="red" type="submit" loading={loading}>
              Dersi Sonlandır
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  Divider,
  Paper,
  Checkbox,
  ScrollArea,
  useMantineColorScheme,
  NumberInput,
  Alert,
} from '@mantine/core';
import { IconCash, IconInfoCircle } from '@tabler/icons-react';
import { processPayout, getInstructorLedgerDetails } from '@/actions/finance';
import { showSuccess, showError } from '@/utils/notifications';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import dayjs from 'dayjs';
import type { Instructor } from '@/types';

interface InstructorPaymentModalProps {
  opened: boolean;
  onClose: () => void;
  instructor: Instructor | null;
  totalPending: number;
  entryCount: number;
  onSuccess: () => void;
}

export function InstructorPaymentModal({
  opened,
  onClose,
  instructor,
  totalPending,
  entryCount,
  onSuccess,
}: InstructorPaymentModalProps) {
  const { colorScheme } = useMantineColorScheme();
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState<number | string>(0);
  const [isCustomAmountModified, setIsCustomAmountModified] = useState(false);

  // Fetch pending entries for this instructor
  useEffect(() => {
    if (opened && instructor) {
      fetchPendingEntries();
    }
  }, [opened, instructor]);

  const fetchPendingEntries = async () => {
    if (!instructor) return;

    setFetchLoading(true);
    try {
      const response = await getInstructorLedgerDetails(
        instructor.id,
        'pending'
      );

      if (response.data) {
        setLedgerEntries(response.data);
        // Auto-select all by default
        setSelectedIds(new Set(response.data.map((e: any) => e.id)));
      } else if (response.error) {
        showError(response.error);
      }
    } catch (error) {
      showError('Komisyon kayıtları yüklenirken hata oluştu');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleToggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedTotal = ledgerEntries
    .filter((e) => selectedIds.has(e.id))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Auto-update custom amount when selection changes (if user hasn't manually edited it)
  useEffect(() => {
    if (!isCustomAmountModified) {
      setCustomAmount(selectedTotal);
    }
  }, [selectedTotal, isCustomAmountModified]);

  const handleCustomAmountChange = (value: number | string) => {
    setCustomAmount(value);
    setIsCustomAmountModified(true);
  };

  const handleConfirm = async () => {
    if (!instructor) return;

    if (selectedIds.size === 0) {
      showError('Lütfen en az bir ay seçin');
      return;
    }

    const finalAmount = Number(customAmount);
    if (!finalAmount || finalAmount <= 0) {
      showError('Lütfen geçerli bir tutar girin');
      return;
    }

    setLoading(true);
    try {
      const result = await processPayout(
        instructor.id,
        finalAmount,
        Array.from(selectedIds)
      );

      if (result.error) {
        showError(result.error);
      } else {
        showSuccess('Ödeme başarılı');
        onSuccess();
        onClose();
        // Reset state
        setSelectedIds(new Set());
        setLedgerEntries([]);
        setCustomAmount(0);
        setIsCustomAmountModified(false);
      }
    } catch (error) {
      showError('Ödeme sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(ledgerEntries.map((e) => e.id)));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  if (!instructor) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Eğitmen Ödemesi"
      size="lg"
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">
              Eğitmen
            </Text>
            <Text fw={700}>
              {instructor.first_name} {instructor.last_name}
            </Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">
              Toplam Bekleyen
            </Text>
            <Text fw={700} c="blue">
              {formatCurrency(totalPending)}
            </Text>
          </div>
        </Group>

        <Divider />

        <Group justify="space-between">
          <Text fw={500}>Ödeme Yapılacak Aylar</Text>
          <Group gap="xs">
            <Button
              size="xs"
              variant="light"
              onClick={handleSelectAll}
              disabled={fetchLoading || loading}
            >
              Tümünü Seç
            </Button>
            <Button
              size="xs"
              variant="light"
              color="gray"
              onClick={handleClearAll}
              disabled={fetchLoading || loading}
            >
              Temizle
            </Button>
          </Group>
        </Group>

        <ScrollArea h={300}>
          {fetchLoading ? (
            <Text ta="center" c="dimmed" py="xl">
              Yükleniyor...
            </Text>
          ) : ledgerEntries.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">
              Bekleyen komisyon kaydı bulunamadı.
            </Text>
          ) : (
            <Stack gap="xs">
              {ledgerEntries.map((entry) => {
                const payment = entry.payments as any;
                // Use period_start if available, otherwise use due_date as the month
                const periodDate = payment?.period_start || entry.due_date;
                const periodLabel = dayjs(periodDate).format('MMMM YYYY');
                const isSelected = selectedIds.has(entry.id);

                return (
                  <Paper
                    key={entry.id}
                    withBorder
                    p="sm"
                    bg={isSelected ? (colorScheme === 'dark' ? 'dark.6' : 'blue.0') : undefined}
                    style={{
                      cursor: 'pointer',
                      borderColor: isSelected ? 'var(--mantine-color-blue-6)' : undefined,
                    }}
                    onClick={() => !loading && handleToggle(entry.id)}
                  >
                    <Group justify="space-between">
                      <Group>
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggle(entry.id);
                          }}
                          disabled={loading}
                        />
                        <div>
                          <Text fw={500}>{periodLabel}</Text>
                          <Text size="xs" c="dimmed">
                            Vade: {formatDate(entry.due_date)}
                          </Text>
                        </div>
                      </Group>
                      <Text fw={700} c="blue">
                        {formatCurrency(entry.amount)}
                      </Text>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </ScrollArea>

        <Divider />

        <Stack gap="sm">
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">
                Seçilen Ay Sayısı
              </Text>
              <Text fw={700}>{selectedIds.size} ay</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Hesaplanan Tutar
              </Text>
              <Text fw={700} c="blue" size="lg">
                {formatCurrency(selectedTotal)}
              </Text>
            </div>
          </Group>

          <NumberInput
            label="Ödenecek Tutar"
            description="Farklı bir anlaşma varsa tutarı değiştirebilirsiniz"
            value={customAmount}
            onChange={handleCustomAmountChange}
            min={0}
            decimalScale={2}
            fixedDecimalScale
            thousandSeparator=","
            decimalSeparator="."
            prefix="₺"
            size="md"
            disabled={loading || fetchLoading}
            styles={{
              input: {
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'var(--mantine-color-green-6)',
              },
            }}
          />

          {Number(customAmount) !== selectedTotal && Number(customAmount) > 0 && (
            <Alert icon={<IconInfoCircle size={16} />} color="orange" variant="light">
              <Text size="sm">
                Ödenecek tutar ({formatCurrency(Number(customAmount))}) hesaplanan tutardan ({formatCurrency(selectedTotal)}) farklı.
                Bu farklılık özel anlaşma nedeniyle mi?
              </Text>
            </Alert>
          )}
        </Stack>

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button
            color="green"
            onClick={handleConfirm}
            loading={loading}
            disabled={selectedIds.size === 0 || fetchLoading}
            leftSection={<IconCash size={16} />}
          >
            Ödeme Yap
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

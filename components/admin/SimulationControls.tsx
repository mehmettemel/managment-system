'use client';

import { useState } from 'react';
import {
  Card,
  Group,
  Button,
  Text,
  Alert,
  ThemeIcon,
  Stack,
  Badge,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconClock,
  IconAlertCircle,
  IconRotateClockwise,
} from '@tabler/icons-react';
import { setSimulationDate, clearSimulationDate } from '@/actions/simulation';
import { syncMemberStatuses } from '@/actions/freeze';
import { showSuccess, showError } from '@/utils/notifications';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

interface SimulationStatus {
  isSimulating: boolean;
  effectiveDate: string;
}

interface SimulationControlsProps {
  initialStatus: SimulationStatus;
}

export function SimulationControls({ initialStatus }: SimulationControlsProps) {
  const [value, setValue] = useState<Date | null>(
    initialStatus.isSimulating ? new Date(initialStatus.effectiveDate) : null
  );
  const [isSimulating, setIsSimulating] = useState(initialStatus.isSimulating);
  const [effectiveDate, setEffectiveDate] = useState(
    initialStatus.effectiveDate
  );
  const [loading, setLoading] = useState(false);

  const handleSetDate = async () => {
    if (!value) return;
    setLoading(true);

    // Convert to YYYY-MM-DD local time to avoid timezone shifts
    const formattedDate = dayjs(value).format('YYYY-MM-DD');

    const result = await setSimulationDate(formattedDate);

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Simülasyon tarihi ayarlandı: ' + formattedDate);
      setIsSimulating(true);
      setEffectiveDate(formattedDate);

      // Auto Sync
      await handleSync();
    }
    setLoading(false);
  };

  const handleSync = async () => {
    setLoading(true);
    const syncRes = await syncMemberStatuses();
    if (syncRes.error) {
      showError('Senkronizasyon hatası: ' + syncRes.error);
    } else {
      if (syncRes.data && syncRes.data.updated > 0) {
        showSuccess(`${syncRes.data.updated} üyenin durumu güncellendi.`);
      }
    }
    setLoading(false);
  };

  const handleReset = async () => {
    setLoading(true);
    const result = await clearSimulationDate();

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Simülasyon durduruldu. Gerçek zamana dönüldü.');
      setIsSimulating(false);
      setEffectiveDate(dayjs().format('YYYY-MM-DD'));
      setValue(null);
    }
    setLoading(false);
  };

  return (
    <Card withBorder padding="xl" radius="md">
      <Stack gap="lg">
        {isSimulating ? (
          <Alert
            variant="light"
            color="orange"
            title="Simülasyon Modu Aktif"
            icon={<IconClock />}
          >
            Sistem şu an <b>{dayjs(effectiveDate).format('DD MMMM YYYY')}</b>{' '}
            tarihini "Bugün" olarak kabul ediyor.
          </Alert>
        ) : (
          <Alert
            variant="light"
            color="blue"
            title="Gerçek Zaman Modu"
            icon={<IconRotateClockwise />}
          >
            Sistem gerçek zamanlı çalışıyor. Bugün:{' '}
            <b>{dayjs().format('DD MMMM YYYY')}</b>
          </Alert>
        )}

        <Group align="flex-end">
          <DatePickerInput
            label="Sanal Tarih Seçin"
            placeholder="Tarih seçiniz"
            value={value}
            onChange={setValue as any}
            minDate={new Date()} // Optional: Restrict to future? Usually good for testing.
            style={{ flex: 1 }}
          />
          <Button
            onClick={handleSetDate}
            loading={loading}
            disabled={!value}
            color="orange"
          >
            Tarihi Ayarla
          </Button>
          {isSimulating && (
            <>
              <Button
                variant="light"
                color="blue"
                onClick={handleSync}
                loading={loading}
                leftSection={<IconRotateClockwise size={16} />}
              >
                Durumları Eşitle
              </Button>
              <Button
                variant="outline"
                color="gray"
                onClick={handleReset}
                loading={loading}
              >
                Simülasyonu Bitir
              </Button>
            </>
          )}
        </Group>

        <Group gap="xs">
          <Badge color={isSimulating ? 'orange' : 'gray'}>
            Server Date: {effectiveDate}
          </Badge>
          <Text size="xs" c="dimmed">
            Not: Bu ayar sadece sizin tarayıcınız için geçerlidir (Cookie
            tabanlı).
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}

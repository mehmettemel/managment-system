'use client';

import { Card, Text, Group, Button, Badge, Alert, Stack } from '@mantine/core';
import {
  IconSnowflake,
  IconCalendar,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Member, FrozenLog } from '@/types';
import { formatDate } from '@/utils/date-helpers';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/tr';
import { cancelFutureFreeze } from '@/actions/freeze';
import { showSuccess, showError } from '@/utils/notifications';
import { useState } from 'react';

dayjs.extend(isSameOrBefore);
dayjs.locale('tr');

interface FreezeStatusCardProps {
  member: Member;
  logs: FrozenLog[]; // All logs (active/future included)
  effectiveDate: string;
  onUnfreezeClick: () => void;
}

export function FreezeStatusCard({
  member,
  logs,
  effectiveDate,
  onUnfreezeClick,
}: FreezeStatusCardProps) {
  const [loading, setLoading] = useState(false);

  // Filter logs relative to effectiveDate
  // Active freeze: status is 'frozen' OR (start <= today && (end == null || end > today))
  // Future freeze: start > today

  // Find Active Log
  const activeLog = logs.find((log) => {
    // Logic must align with backend "active" determination
    // Simple check: If member.status is frozen, the latest log starting <= today is likely the active one.
    // Or if start_date <= today and (end_date null or > today)
    const start = dayjs(log.start_date);
    const end = log.end_date ? dayjs(log.end_date) : null;
    const today = dayjs(effectiveDate);

    return start.isSameOrBefore(today) && (!end || end.isAfter(today));
  });

  // Find Future Logs
  const futureLogs = logs.filter((log) => {
    return dayjs(log.start_date).isAfter(dayjs(effectiveDate));
  });

  const handleCancelFuture = async (logId: number) => {
    if (
      !confirm(
        'Planlanmış dondurma işlemini iptal etmek istediğinize emin misiniz?'
      )
    )
      return;
    setLoading(true);
    const result = await cancelFutureFreeze(logId);
    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Dondurma planı iptal edildi.');
      // Ideally trigger refresh here, but component might remount or parent handles it?
      // We need a way to refresh parent data.
      window.location.reload(); // Hard refresh for safety or pass callback
    }
    setLoading(false);
  };

  if (member.status !== 'frozen' && futureLogs.length === 0) return null;

  return (
    <Stack gap="md">
      {/* Active Freeze Banner */}
      {member.status === 'frozen' && (
        <Alert
          variant="light"
          color="blue"
          title="Üyelik Dondurulmuş"
          icon={<IconSnowflake />}
        >
          <Stack gap="xs">
            <Text size="sm">
              Bu üyelik{' '}
              <b>
                {activeLog
                  ? formatDate(activeLog.start_date)
                  : 'bilinmeyen tarihte'}
              </b>{' '}
              donduruldu.
            </Text>
            {activeLog?.end_date && (
              <Text size="sm">
                Otomatik açılış tarihi: <b>{formatDate(activeLog.end_date)}</b>
              </Text>
            )}
            {activeLog?.reason && (
              <Text size="sm" c="dimmed">
                Sebep: {activeLog.reason}
              </Text>
            )}
            <Button
              size="xs"
              variant="white"
              color="blue"
              onClick={onUnfreezeClick}
              mt="xs"
              style={{ width: 'fit-content' }}
            >
              Üyeliği Şimdi Aktifleştir
            </Button>
          </Stack>
        </Alert>
      )}

      {/* Future Freeze Warnings */}
      {futureLogs.map((log) => (
        <Alert
          key={log.id}
          variant="light"
          color="orange"
          title="Planlanmış Dondurma İşlemi"
          icon={<IconCalendar />}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="sm">
                Bu üyelik <b>{formatDate(log.start_date)}</b> tarihinde otomatik
                olarak dondurulacak.
              </Text>
              {log.end_date && (
                <Text size="sm">Bitiş: {formatDate(log.end_date)}</Text>
              )}
            </div>
            <Button
              size="xs"
              color="orange"
              variant="subtle"
              loading={loading}
              onClick={() => handleCancelFuture(log.id)}
            >
              İptal Et
            </Button>
          </Group>
        </Alert>
      ))}
    </Stack>
  );
}

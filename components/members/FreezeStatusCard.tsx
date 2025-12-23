'use client';

import { Card, Text, Group, Button, Badge, Alert, Stack } from '@mantine/core';
import {
  IconSnowflake,
  IconCalendar,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Member, FrozenLog, MemberClassWithDetails } from '@/types';
import { formatDate } from '@/utils/date-helpers';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/tr';
import { cancelFutureFreeze, unfreezeLog } from '@/actions/freeze';
import { showSuccess, showError } from '@/utils/notifications';
import { useState } from 'react';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale('tr');

interface FreezeStatusCardProps {
  member: Member;
  logs: FrozenLog[]; // All logs (active/future included)
  enrollments: MemberClassWithDetails[]; // Active enrollments
  effectiveDate: string;
  onUnfreezeClick: () => void;
}

export function FreezeStatusCard({
  member,
  logs,
  enrollments,
  effectiveDate,
  onUnfreezeClick,
}: FreezeStatusCardProps) {
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});

  // Group logs by enrollment and filter by time
  const today = dayjs(effectiveDate);

  // Active frozen enrollments
  const activeFrozenEnrollments = enrollments
    .map((enrollment) => {
      const activeLog = logs.find((log) => {
        if (log.member_class_id !== enrollment.id) return false;

        const startDate = dayjs(log.start_date);
        const endDate = log.end_date ? dayjs(log.end_date) : null;

        const afterStart = today.isSameOrAfter(startDate, 'day');
        const beforeEnd = endDate ? today.isSameOrBefore(endDate, 'day') : true;

        return afterStart && beforeEnd;
      });
      return { enrollment, log: activeLog };
    })
    .filter((item) => item.log);

  // Future frozen enrollments
  const futureFrozenEnrollments = enrollments
    .map((enrollment) => {
      const futureLogs = logs.filter(
        (log) =>
          log.member_class_id === enrollment.id &&
          dayjs(log.start_date).isAfter(today)
      );
      return { enrollment, logs: futureLogs };
    })
    .filter((item) => item.logs.length > 0);

  const handleUnfreeze = async (logId: number) => {
    setLoading({ ...loading, [logId]: true });
    const result = await unfreezeLog(logId);
    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Ders dondurması kaldırıldı');
      window.location.reload();
    }
    setLoading({ ...loading, [logId]: false });
  };

  const handleCancelFuture = async (logId: number) => {
    if (
      !confirm(
        'Planlanmış dondurma işlemini iptal etmek istediğinize emin misiniz?'
      )
    )
      return;
    setLoading({ ...loading, [logId]: true });
    const result = await cancelFutureFreeze(logId);
    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Dondurma planı iptal edildi');
      window.location.reload();
    }
    setLoading({ ...loading, [logId]: false });
  };

  if (
    activeFrozenEnrollments.length === 0 &&
    futureFrozenEnrollments.length === 0
  )
    return null;

  return (
    <Stack gap="md">
      {/* Active Frozen Classes */}
      {activeFrozenEnrollments.map(({ enrollment, log }) => (
        <Alert
          key={`active-${enrollment.id}`}
          variant="light"
          color="blue"
          title={`${enrollment.classes?.name} - Ders Donduruldu`}
          icon={<IconSnowflake />}
        >
          <Stack gap="xs">
            <Text size="sm">
              Bu ders <b>{log ? formatDate(log.start_date) : '-'}</b> tarihinde
              donduruldu.
            </Text>
            {log?.end_date ? (
              <Text size="sm">
                Otomatik açılış tarihi: <b>{formatDate(log.end_date)}</b>
              </Text>
            ) : (
              <Text size="sm" c="dimmed">
                Süresiz dondurma (manuel açılış gerekli)
              </Text>
            )}
            {log?.reason && (
              <Text size="sm" c="dimmed">
                Sebep: {log.reason}
              </Text>
            )}
            <Button
              size="xs"
              variant="white"
              color="blue"
              onClick={() => log && handleUnfreeze(log.id)}
              loading={log ? loading[log.id] : false}
              mt="xs"
              style={{ width: 'fit-content' }}
            >
              Dersi Şimdi Aktifleştir
            </Button>
          </Stack>
        </Alert>
      ))}

      {/* Future Freeze Warnings */}
      {futureFrozenEnrollments.map(({ enrollment, logs: futureLogs }) =>
        futureLogs.map((log) => (
          <Alert
            key={`future-${log.id}`}
            variant="light"
            color="orange"
            title={`${enrollment.classes?.name} - Planlanmış Dondurma`}
            icon={<IconCalendar />}
          >
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="sm">
                  Bu ders <b>{formatDate(log.start_date)}</b> tarihinde otomatik
                  olarak dondurulacak.
                </Text>
                {log.end_date && (
                  <Text size="sm">Bitiş: {formatDate(log.end_date)}</Text>
                )}
                {log.reason && (
                  <Text size="sm" c="dimmed">
                    Sebep: {log.reason}
                  </Text>
                )}
              </div>
              <Button
                size="xs"
                color="orange"
                variant="subtle"
                loading={loading[log.id]}
                onClick={() => handleCancelFuture(log.id)}
              >
                İptal Et
              </Button>
            </Group>
          </Alert>
        ))
      )}
    </Stack>
  );
}

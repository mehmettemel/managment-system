'use client';

import { useEffect, useState } from 'react';
import { Group, Text, ThemeIcon } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

export function LiveClock() {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = dayjs();
      setCurrentTime(now.format('HH:mm:ss'));
      setCurrentDate(now.format('DD MMMM YYYY, dddd'));
    };

    // Initial update
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Group gap="xs" visibleFrom="sm">
      <ThemeIcon variant="light" size="md" radius="md">
        <IconClock size={16} />
      </ThemeIcon>
      <div>
        <Text size="sm" fw={600}>
          {currentTime}
        </Text>
        <Text size="xs" c="dimmed">
          {currentDate}
        </Text>
      </div>
    </Group>
  );
}

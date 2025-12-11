'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Title,
  Text,
  Card,
  Group,
  Stack,
  Loader,
  Center,
  ActionIcon,
  Badge,
  Container,
  SimpleGrid,
  Tabs,
  Button,
} from '@mantine/core';
import { IconArrowLeft, IconPhone, IconCalendar } from '@tabler/icons-react';
import { getMemberById } from '@/actions/members';
import { getPaymentSchedule } from '@/actions/payments';
import { formatPhone } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PaymentScheduleTable } from '@/components/members/PaymentScheduleTable';
import type {
  Member,
  MemberClassWithDetails,
  PaymentScheduleItem,
} from '@/types';

interface MemberDetailViewProps {
  memberId: number;
}

export function MemberDetailView({ memberId }: MemberDetailViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<
    (Member & { member_classes: MemberClassWithDetails[] }) | null
  >(null);
  const [schedules, setSchedules] = useState<
    Record<number, PaymentScheduleItem[]>
  >({});

  const fetchData = async () => {
    setLoading(true);
    const memberRes = await getMemberById(memberId);

    if (memberRes.data) {
      setMember(memberRes.data);

      // Fetch schedules for all active classes
      const activeClasses =
        memberRes.data.member_classes?.filter((mc) => mc.active) || [];
      const schedMap: Record<number, PaymentScheduleItem[]> = {};

      await Promise.all(
        activeClasses.map(async (mc) => {
          const res = await getPaymentSchedule(memberId, mc.class_id);
          if (res.data) {
            schedMap[mc.class_id] = res.data;
          }
        })
      );
      setSchedules(schedMap);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    // Refresh only schedules lightly if possible, but full refetch simplest
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [memberId]);

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!member) {
    return <Text>Üye bulunamadı</Text>;
  }

  const activeClasses = member.member_classes?.filter((mc) => mc.active) || [];

  return (
    <Container size="lg" p="xs">
      <Stack gap="lg">
        {/* Header */}
        <Stack gap="xs">
          <Group align="center" gap="md">
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => router.push('/members')}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Title order={2}>
              {member.first_name} {member.last_name}
            </Title>
          </Group>
          <Group wrap="wrap" gap="sm" ml={48}>
            <StatusBadge status={member.status as any} />
            {member.phone && (
              <Group gap={4}>
                <IconPhone size={14} style={{ opacity: 0.7 }} />
                <Text size="sm" c="dimmed">
                  {formatPhone(member.phone)}
                </Text>
              </Group>
            )}
            <Group gap={4}>
              <IconCalendar size={14} style={{ opacity: 0.7 }} />
              <Text size="sm" c="dimmed">
                Kayıt: {formatDate(member.join_date)}
              </Text>
            </Group>
          </Group>
        </Stack>

        {/* Class Payment Schedules */}
        {activeClasses.length === 0 ? (
          <Text c="dimmed">Kayıtlı aktif ders bulunmuyor.</Text>
        ) : (
          <Tabs
            defaultValue={String(activeClasses[0].class_id)}
            variant="outline"
          >
            <Tabs.List>
              {activeClasses.map((mc) => (
                <Tabs.Tab
                  key={mc.class_id}
                  value={String(mc.class_id)}
                  leftSection={
                    <Badge variant="dot" size="xs">
                      {mc.classes?.day_of_week}
                    </Badge>
                  }
                >
                  <Text fw={500}>{mc.classes?.name}</Text>
                </Tabs.Tab>
              ))}
            </Tabs.List>

            {activeClasses.map((mc) => (
              <Tabs.Panel key={mc.class_id} value={String(mc.class_id)} pt="md">
                <Card withBorder radius="sm">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Text fw={600} size="lg">
                          {mc.classes?.name} Ödeme Planı
                        </Text>
                        <Badge variant="light">
                          {mc.classes?.day_of_week}{' '}
                          {mc.classes?.start_time?.slice(0, 5)}
                        </Badge>
                      </Group>
                      {/* Add specific class stats or buttons here later if needed */}
                    </Group>

                    <PaymentScheduleTable
                      schedule={schedules[mc.class_id] || []}
                      memberId={memberId}
                      classId={mc.class_id}
                      onUpdate={handleRefresh}
                    />
                  </Stack>
                </Card>
              </Tabs.Panel>
            ))}
          </Tabs>
        )}
      </Stack>
    </Container>
  );
}

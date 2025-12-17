'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Button,
  SimpleGrid,
  ThemeIcon,
  Alert,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconPhone,
  IconCalendar,
  IconHistory,
  IconPlus,
  IconRotateClockwise,
  IconChevronRight,
  IconCreditCard,
  IconAlertCircle,
} from '@tabler/icons-react';
import {
  getMemberById,
  addMemberToClasses,
  getMemberLogs,
} from '@/actions/members';
import { getClasses } from '@/actions/classes';
import { unfreezeMembership } from '@/actions/freeze';
import { formatPhone } from '@/utils/formatters';
import { formatDate } from '@/utils/date-helpers';
import {
  MemberWithClasses,
  Class,
  MemberLog,
  MemberClassWithDetails,
} from '@/types';
import { MemberHistoryTable } from './MemberHistoryTable';
import { FreezeStatusCard } from './FreezeStatusCard';
import { showSuccess, showError } from '@/utils/notifications';
import { AddEnrollmentModal } from './AddEnrollmentModal';
import dayjs from 'dayjs';

interface MemberDetailViewProps {
  memberId: number;
  effectiveDate: string;
}

export function MemberDetailView({
  memberId,
  effectiveDate,
}: MemberDetailViewProps) {
  const router = useRouter();

  const [member, setMember] = useState<MemberWithClasses | null>(null);
  const [activeEnrollments, setActiveEnrollments] = useState<
    MemberClassWithDetails[]
  >([]);
  const [memberLogs, setMemberLogs] = useState<MemberLog[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  // Add class modal
  const [addClassModal, setAddClassModal] = useState<{
    open: boolean;
    availableClasses: Class[];
  }>({ open: false, availableClasses: [] });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [memberRes, classesRes, logsRes] = await Promise.all([
        getMemberById(memberId),
        getClasses(),
        getMemberLogs(memberId),
      ]);

      if (memberRes.data) {
        setMember(memberRes.data);
        // Filter for active enrollments
        const enrollments = (memberRes.data.member_classes.filter(
          (mc: any) => mc.active
        ) || []) as any;
        setActiveEnrollments(enrollments);
      }

      if (classesRes.data) {
        setAllClasses(classesRes.data);
      }

      if (logsRes.data) {
        setMemberLogs(logsRes.data);
      }
    } catch (error) {
      console.error(error);
      showError('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddClassClick = () => {
    // Filter out already enrolled classes
    const enrolledClassIds = new Set(activeEnrollments.map((e) => e.class_id));
    const available = allClasses.filter((c) => !enrolledClassIds.has(c.id));

    if (available.length === 0) {
      showError('Tüm derslere kayıtlısınız');
      return;
    }

    setAddClassModal({ open: true, availableClasses: available });
  };

  const onAddClassConfirm = async (
    registrations: {
      class_id: number;
      price: number;
      duration: number;
    }[]
  ) => {
    setActionLoading(true);
    const result = await addMemberToClasses(memberId, registrations);

    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Ders kayıtları eklendi');
      setAddClassModal({ open: false, availableClasses: [] });
      fetchData(); // Refresh data
    }
    setActionLoading(false);
  };

  const handleUnfreezeAll = async () => {
    if (!member) return;
    setActionLoading(true);
    const result = await unfreezeMembership(member.id);
    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Üyelik aktifleştirildi');
      fetchData();
    }
    setActionLoading(false);
  };

  const navigateToEnrollment = (enrollment: MemberClassWithDetails) => {
    router.push(`/classes/${enrollment.class_id}/enrollments/${enrollment.id}`);
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!member) {
    return (
      <Center h={400}>
        <Text>Üye bulunamadı.</Text>
      </Center>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group align="flex-start" justify="space-between">
          <Group>
            <ActionIcon
              variant="light"
              color="gray"
              size="lg"
              onClick={() => router.push('/members')}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <div>
              <Group gap="xs">
                <Title order={2}>
                  {member.first_name} {member.last_name}
                </Title>
                <Badge
                  color={
                    member.status === 'active'
                      ? 'green'
                      : member.status === 'frozen'
                        ? 'blue'
                        : 'gray'
                  }
                >
                  {member.status === 'active'
                    ? 'Aktif'
                    : member.status === 'frozen'
                      ? 'Dondurulmuş'
                      : 'Arşivlenmiş'}
                </Badge>
              </Group>
              <Group gap="lg" mt="xs">
                {member.phone && (
                  <Group gap={4}>
                    <IconPhone size={16} style={{ opacity: 0.7 }} />
                    <Text size="sm">{formatPhone(member.phone)}</Text>
                  </Group>
                )}
                <Group gap={4}>
                  <IconCalendar size={16} style={{ opacity: 0.7 }} />
                  <Text size="sm">Kayıt: {formatDate(member.join_date)}</Text>
                </Group>
              </Group>
            </div>
          </Group>
          <Button
            leftSection={<IconPlus size={16} />}
            variant="light"
            onClick={handleAddClassClick}
          >
            Ders Ekle
          </Button>
        </Group>

        {/* Freeze Status Card */}
        {member.frozen_logs && (
          <FreezeStatusCard
            member={member}
            logs={member.frozen_logs || []}
            effectiveDate={effectiveDate}
            onUnfreezeClick={handleUnfreezeAll}
          />
        )}

        <Card withBorder radius="md">
          <Tabs defaultValue="classes">
            <Tabs.List>
              <Tabs.Tab
                value="classes"
                leftSection={<IconCreditCard size={16} />}
              >
                Kayıtlı Dersler
              </Tabs.Tab>
              <Tabs.Tab
                value="history"
                leftSection={<IconRotateClockwise size={16} />}
              >
                İşlem Geçmişi
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="classes" pt="md">
              {activeEnrollments.length === 0 ? (
                <Stack align="center" gap="md" py="xl">
                  <Text c="dimmed" ta="center" size="lg" fw={500}>
                    Henüz ders kaydı bulunmuyor
                  </Text>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleAddClassClick}
                  >
                    İlk Dersi Ekle
                  </Button>
                </Stack>
              ) : (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  {activeEnrollments.map((enrollment) => {
                    const activeLog = member.frozen_logs?.find(
                      (log) =>
                        log.member_class_id === enrollment.id && !log.end_date
                    );

                    return (
                      <Card
                        key={enrollment.id}
                        withBorder
                        padding="lg"
                        radius="md"
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        onClick={() => navigateToEnrollment(enrollment)}
                        className="hover:border-blue-400 hover:shadow-md"
                      >
                        <Group justify="space-between" align="start">
                          <Group>
                            <ThemeIcon
                              size={40}
                              radius="md"
                              variant="light"
                              color="blue"
                            >
                              <IconCreditCard size={20} />
                            </ThemeIcon>
                            <div>
                              <Text fw={600} size="lg">
                                {enrollment.classes?.name}
                              </Text>
                              <Text size="sm" c="dimmed">
                                {formatDate(enrollment.created_at)} tarihinden
                                beri
                              </Text>
                            </div>
                          </Group>
                          {activeLog ? (
                            <Badge color="cyan">Donduruldu</Badge>
                          ) : (
                            <Badge color="green">Aktif</Badge>
                          )}
                        </Group>

                        <Group mt="lg" justify="space-between" align="flex-end">
                          <Stack gap={0}>
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                              ÖDEME DURUMU
                            </Text>
                            <Text size="sm">
                              Detayları görmek için tıklayın
                            </Text>
                          </Stack>

                          <Button
                            variant="light"
                            rightSection={<IconChevronRight size={16} />}
                            size="xs"
                          >
                            Detaya Git
                          </Button>
                        </Group>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="history" pt="md">
              <MemberHistoryTable logs={memberLogs} />
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>

      <AddEnrollmentModal
        opened={addClassModal.open}
        onClose={() => setAddClassModal({ open: false, availableClasses: [] })}
        availableClasses={addClassModal.availableClasses}
        onConfirm={onAddClassConfirm}
      />
    </Container>
  );
}

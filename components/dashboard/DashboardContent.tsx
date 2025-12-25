'use client';

import { StatsCard } from '@/components/shared/StatsCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { MemberStatsChart } from '@/components/dashboard/MemberStatsChart';
import { PaymentStatusChart } from '@/components/dashboard/PaymentStatusChart';
import { NewMembersChart } from '@/components/dashboard/NewMembersChart';
import StaggerContainer, {
  itemVariants,
} from '@/components/shared/StaggerContainer';
import { SimpleGrid, Title, Stack, Text, Alert } from '@mantine/core';
import {
  IconUsers,
  IconCreditCard,
  IconAlertCircle,
  IconUserCheck,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface DashboardContentProps {
  totalMembers: number;
  activeMembers: number;
  overdueCount: number;
  monthlyRevenue: number;
}

// Wrapper to apply motion variants to children
function MotionDiv({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

export function DashboardContent({
  totalMembers,
  activeMembers,
  overdueCount,
  monthlyRevenue,
}: DashboardContentProps) {
  return (
    <StaggerContainer>
      <Stack gap="lg">
        <MotionDiv>
          <Title order={2}>Anasayfa</Title>
          <Text c="dimmed">Hoş geldiniz, işte bugünkü durum özeti.</Text>
        </MotionDiv>

        {overdueCount > 0 && (
          <MotionDiv>
            <Alert
              variant="light"
              color="red"
              title="Gecikmiş Ödemeler"
              icon={<IconAlertCircle />}
            >
              Ödemesi geciken {overdueCount} üye var. Lütfen kontrol edin.
            </Alert>
          </MotionDiv>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <MotionDiv>
            <StatsCard
              title="Toplam Üye"
              value={totalMembers}
              icon={<IconUsers size={24} />}
              color="blue"
            />
          </MotionDiv>
          <MotionDiv>
            <StatsCard
              title="Aktif Üye"
              value={activeMembers}
              icon={<IconUserCheck size={24} />}
              color="green"
              trend={{
                value: Math.round((activeMembers / (totalMembers || 1)) * 100),
                label: 'Aktiflik Oranı',
              }}
            />
          </MotionDiv>
          <MotionDiv>
            <StatsCard
              title="Aylık Gelir"
              value={`${monthlyRevenue.toLocaleString('tr-TR')} ₺`}
              icon={<IconCreditCard size={24} />}
              color="orange"
              trend={{ value: 100, label: 'Bu Ay' }}
            />
          </MotionDiv>
          <MotionDiv>
            <StatsCard
              title="Gecikmiş Ödeme"
              value={overdueCount}
              icon={<IconAlertCircle size={24} />}
              color="red"
            />
          </MotionDiv>
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <MotionDiv>
            <RevenueChart />
          </MotionDiv>
          <MotionDiv>
            <MemberStatsChart />
          </MotionDiv>
          <MotionDiv>
            <PaymentStatusChart />
          </MotionDiv>
          <MotionDiv>
            <NewMembersChart />
          </MotionDiv>
        </SimpleGrid>
      </Stack>
    </StaggerContainer>
  );
}

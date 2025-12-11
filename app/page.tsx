import { AppShellLayout } from '@/components/layout/AppShell'
import { StatsCard } from '@/components/shared/StatsCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { MemberStatsChart } from '@/components/dashboard/MemberStatsChart'
import { getMembers, getOverdueMembers } from '@/actions/members'
import { getRevenueByDateRange } from '@/actions/payments'
import { SimpleGrid, Title, Stack, Text, Alert, Button } from '@mantine/core'
import {
  IconUsers,
  IconCreditCard,
  IconAlertCircle,
  IconUserCheck,
  IconInfoCircle,
} from '@tabler/icons-react'
import dayjs from 'dayjs'

export default async function Home() {
  const today = dayjs()
  const startOfMonth = today.startOf('month').format('YYYY-MM-DD')
  const endOfMonth = today.endOf('month').format('YYYY-MM-DD')

  // Parallel data fetching
  const [allMembers, activeMembers, overdueMembers, revenue] = await Promise.all([
    getMembers('all'),
    getMembers('active'),
    getOverdueMembers(),
    getRevenueByDateRange(startOfMonth, endOfMonth),
  ])

  // Extract data safely
  const totalMembersCount = allMembers.data?.length || 0
  const activeMembersCount = activeMembers.data?.length || 0
  const overdueCount = overdueMembers.data?.length || 0
  const monthlyRevenue = revenue.data?.total || 0

  return (
    <AppShellLayout>
      <Stack gap="lg">
        <div>
          <Title order={2}>Dashboard</Title>
          <Text c="dimmed">Hoş geldiniz, işte bugünkü durum özeti.</Text>
        </div>

        {overdueCount > 0 && (
          <Alert
            variant="light"
            color="red"
            title="Gecikmiş Ödemeler"
            icon={<IconAlertCircle />}
          >
            Ödemesi geciken {overdueCount} üye var. Lütfen kontrol edin.
          </Alert>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <StatsCard
            title="Toplam Üye"
            value={totalMembersCount}
            icon={<IconUsers size={24} />}
            color="blue"
          />
          <StatsCard
            title="Aktif Üye"
            value={activeMembersCount}
            icon={<IconUserCheck size={24} />}
            color="green"
            trend={{
              value: Math.round((activeMembersCount / (totalMembersCount || 1)) * 100),
              label: 'Aktiflik Oranı',
            }}
          />
          <StatsCard
            title="Aylık Gelir"
            value={`${monthlyRevenue.toLocaleString('tr-TR')} ₺`}
            icon={<IconCreditCard size={24} />}
            color="orange"
            trend={{ value: 100, label: 'Bu Ay' }}
          />
          <StatsCard
            title="Gecikmiş Ödeme"
            value={overdueCount}
            icon={<IconAlertCircle size={24} />}
            color="red"
          />
        </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <RevenueChart />
        <MemberStatsChart />
      </SimpleGrid>

        {totalMembersCount === 0 && (
          <form action={async () => {
            'use server'
            const { seedDatabase } = await import('@/actions/seed')
            await seedDatabase()
          }}>
             <Button type="submit" variant="light" color="grape" fullWidth mt="md">
              Demo Verisi Yükle (Seed Data)
            </Button>
          </form>
        )}

      </Stack>
    </AppShellLayout>
  )
}


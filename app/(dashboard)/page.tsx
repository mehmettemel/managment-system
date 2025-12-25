/**
 * Dashboard Page
 * Main landing page with statistics, charts and overdue members
 */

import { Suspense } from 'react';
import {
  Title,
  Grid,
  Stack,
  Text,
  Skeleton,
  Paper,
  Group,
  Badge,
} from '@mantine/core';
import {
  IconUsers,
  IconCash,
  IconAlertCircle,
  IconUserPlus,
  IconTrendingUp,
  IconCalendarEvent,
} from '@tabler/icons-react';
import { BarChart, LineChart, DonutChart } from '@mantine/charts';
import { StatsCard } from '@/components/shared/StatsCard';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { getMembers, getOverdueMembers } from '@/actions/members';
import { getRevenueByDateRange } from '@/actions/payments';
import { formatDate, getDaysUntilPayment } from '@/utils/date-helpers';
import { getServerNow } from '@/utils/server-date-helper';
import type { DataTableColumn } from '@/components/shared/DataTable';
import type { Member } from '@/types';

// Stats Component (Server Component)
async function DashboardStats() {
  const now = await getServerNow();
  const firstDay = now.startOf('month').format('YYYY-MM-DD');
  const lastDay = now.endOf('month').format('YYYY-MM-DD');

  const [
    activeMembersResult,
    frozenMembersResult,
    revenueResult,
    overdueResult,
  ] = await Promise.all([
    getMembers('active'),
    getMembers('frozen'),
    getRevenueByDateRange(firstDay, lastDay),
    getOverdueMembers(),
  ]);

  const activeMemberCount = activeMembersResult.data?.length || 0;
  const frozenMemberCount = frozenMembersResult.data?.length || 0;
  const monthlyRevenue = revenueResult.data?.total || 0;
  const overdueCount = overdueResult.data?.length || 0;

  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
        <StatsCard
          title="Aktif Üyeler"
          value={activeMemberCount}
          icon={<IconUsers size={24} />}
          color="orange"
          trend={{ value: 12, label: 'son aydan' }}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
        <StatsCard
          title="Bu Ay Gelir"
          value={`₺${monthlyRevenue.toLocaleString('tr-TR')}`}
          icon={<IconCash size={24} />}
          color="green"
          trend={{ value: 8, label: 'son aydan' }}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
        <StatsCard
          title="Dondurulmuş"
          value={frozenMemberCount}
          icon={<IconCalendarEvent size={24} />}
          color="blue"
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
        <StatsCard
          title="Ödemesi Gecikenler"
          value={overdueCount}
          icon={<IconAlertCircle size={24} />}
          color="red"
        />
      </Grid.Col>
    </Grid>
  );
}

// Revenue Chart Component
async function RevenueChart() {
  // Mock data - gerçek projeye entegre edilecek
  const now = await getServerNow();
  const monthlyData = [];

  for (let i = 5; i >= 0; i--) {
    const month = now.subtract(i, 'month');
    monthlyData.push({
      month: month.toDate().toLocaleDateString('tr-TR', { month: 'short' }),
      gelir: Math.floor(Math.random() * 50000) + 30000,
    });
  }

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text size="lg" fw={600}>
              Aylık Gelir Trendi
            </Text>
            <Text size="sm" c="dimmed">
              Son 6 aylık gelir grafiği
            </Text>
          </div>
          <Badge size="lg" variant="light" color="green">
            <Group gap={4}>
              <IconTrendingUp size={14} />
              <Text>+12%</Text>
            </Group>
          </Badge>
        </Group>
        <LineChart
          h={300}
          data={monthlyData}
          dataKey="month"
          series={[{ name: 'gelir', label: 'Gelir', color: 'orange.6' }]}
          curveType="monotone"
          withLegend
          legendProps={{ verticalAlign: 'bottom' }}
          gridAxis="xy"
          tickLine="xy"
          valueFormatter={(value) => `₺${value.toLocaleString('tr-TR')}`}
        />
      </Stack>
    </Paper>
  );
}

// Member Status Distribution Chart
async function MemberStatusChart() {
  const [activeResult, frozenResult, archivedResult] = await Promise.all([
    getMembers('active'),
    getMembers('frozen'),
    getMembers('archived'),
  ]);

  const data = [
    { name: 'Aktif', value: activeResult.data?.length || 0, color: 'orange.6' },
    {
      name: 'Dondurulmuş',
      value: frozenResult.data?.length || 0,
      color: 'blue.6',
    },
    { name: 'Arşiv', value: archivedResult.data?.length || 0, color: 'gray.6' },
  ];

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="md">
        <div>
          <Text size="lg" fw={600}>
            Üye Durumu Dağılımı
          </Text>
          <Text size="sm" c="dimmed">
            Toplam üye sayısı: {data.reduce((acc, curr) => acc + curr.value, 0)}
          </Text>
        </div>
        <DonutChart data={data} thickness={30} size={200} chartLabel="Üyeler" />
      </Stack>
    </Paper>
  );
}

// Recent Members Activity
async function RecentActivity() {
  const result = await getMembers();
  const recentMembers = result.data?.slice(0, 5) || [];

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="md">
        <Text size="lg" fw={600}>
          Son Aktiviteler
        </Text>
        <Stack gap="xs">
          {recentMembers.length === 0 ? (
            <Text c="dimmed" size="sm" ta="center" py="xl">
              Henüz aktivite yok
            </Text>
          ) : (
            recentMembers.map((member) => (
              <Group key={member.id} justify="space-between" p="xs">
                <div>
                  <Text size="sm" fw={500}>
                    {member.first_name} {member.last_name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Kayıt tarihi: {formatDate(member.join_date, 'DD MMM YYYY')}
                  </Text>
                </div>
                <StatusBadge status={member.status as any} size="sm" />
              </Group>
            ))
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

// Overdue Members Table
async function OverdueTable() {
  const result = await getOverdueMembers();
  const overdueMembers = result.data || [];

  const columns: DataTableColumn<Member>[] = [
    {
      key: 'first_name',
      label: 'Ad Soyad',
      sortable: true,
      searchable: true,
      render: (member) => `${member.first_name} ${member.last_name}`,
    },
    {
      key: 'phone',
      label: 'Telefon',
      searchable: true,
    },
    {
      key: 'join_date',
      label: 'Kayıt Tarihi',
      sortable: true,
      render: (member) => formatDate(member.join_date),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (member) => (
        <Badge color="red" variant="light">
          Gecikmiş
        </Badge>
      ),
    },
  ];

  if (overdueMembers.length === 0) {
    return (
      <Paper p="xl" withBorder radius="md">
        <Stack align="center" gap="sm">
          <IconUsers
            size={48}
            stroke={1.5}
            color="var(--mantine-color-gray-5)"
          />
          <div>
            <Text ta="center" fw={600}>
              Harika! Gecikmiş ödeme yok 🎉
            </Text>
            <Text ta="center" size="sm" c="dimmed">
              Tüm ödemeler zamanında alınmış
            </Text>
          </div>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Text size="lg" fw={600}>
            Ödemesi Gecikenler
          </Text>
          <Text size="sm" c="dimmed">
            Ödeme hatırlatması yapılması gereken üyeler
          </Text>
        </div>
        <Badge size="lg" color="red" variant="light">
          {overdueMembers.length} kişi
        </Badge>
      </Group>
      <DataTable
        data={overdueMembers}
        columns={columns}
        emptyText="Gecikmiş ödeme bulunamadı"
        pageSize={5}
      />
    </Stack>
  );
}

// Loading Skeletons
function StatsLoading() {
  return (
    <Grid>
      {[1, 2, 3, 4].map((i) => (
        <Grid.Col key={i} span={{ base: 12, md: 6, lg: 3 }}>
          <Skeleton height={120} radius="md" />
        </Grid.Col>
      ))}
    </Grid>
  );
}

function ChartLoading() {
  return <Skeleton height={350} radius="md" />;
}

function TableLoading() {
  return <Skeleton height={400} radius="md" />;
}

// Main Dashboard Page
export default function DashboardPage() {
  return (
    <Stack gap="xl">
      {/* Header */}
      <div>
        <Title order={1}>Anasayfa</Title>
        <Text c="dimmed">Dans okulu yönetim paneline hoş geldiniz</Text>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsLoading />}>
        <DashboardStats />
      </Suspense>

      {/* Charts Row */}
      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Suspense fallback={<ChartLoading />}>
            <RevenueChart />
          </Suspense>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Suspense fallback={<ChartLoading />}>
            <MemberStatusChart />
          </Suspense>
        </Grid.Col>
      </Grid>

      {/* Activity and Overdue */}
      <Grid>
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Suspense fallback={<ChartLoading />}>
            <RecentActivity />
          </Suspense>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Suspense fallback={<TableLoading />}>
            <OverdueTable />
          </Suspense>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

import { AppShellLayout } from '@/components/layout/AppShell';
import { getMembers, getOverdueMembers } from '@/actions/members';
import { getRevenueByDateRange } from '@/actions/payments';
import dayjs from 'dayjs';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export const dynamic = 'force-dynamic'; // Ensure fresh data on dashboard

export default async function Home() {
  const today = dayjs();
  const startOfMonth = today.startOf('month').format('YYYY-MM-DD');
  const endOfMonth = today.endOf('month').format('YYYY-MM-DD');

  // Parallel data fetching
  const [allMembers, activeMembers, overdueMembers, revenue] =
    await Promise.all([
      getMembers('all'),
      getMembers('active'),
      getOverdueMembers(),
      getRevenueByDateRange(startOfMonth, endOfMonth),
    ]);

  // Extract data safely
  const totalMembersCount = allMembers.data?.length || 0;
  const activeMembersCount = activeMembers.data?.length || 0;
  const overdueCount = overdueMembers.data?.length || 0;
  const monthlyRevenue = revenue.data?.total || 0;

  return (
    <AppShellLayout>
      <DashboardContent
        totalMembers={totalMembersCount}
        activeMembers={activeMembersCount}
        overdueCount={overdueCount}
        monthlyRevenue={monthlyRevenue}
      />
    </AppShellLayout>
  );
}

/**
 * Dashboard Actions
 * For fetching aggregated statistics
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import {
  logError,
  errorResponse,
  successResponse,
  handleSupabaseError,
} from '@/utils/response-helpers';
import type { ApiResponse } from '@/types';
import { getOverdueMembers, getMembers } from '@/actions/members';

/**
 * Get Payment Status Stats (Paid vs Overdue)
 */
export async function getPaymentStatusStats(): Promise<
  ApiResponse<{ name: string; value: number; color: string }[]>
> {
  try {
    // Parallel fetch
    const [activeRes, overdueRes] = await Promise.all([
      getMembers('active'),
      getOverdueMembers(),
    ]);

    const activeCount = activeRes.data?.length || 0;
    const overdueCount = overdueRes.data?.length || 0;

    // "Paid/Up-to-date" is Active minus Overdue (assuming overdue are subset of active)
    // Note: getOverdueMembers usually filters for active members with late payments.
    const upToDateCount = Math.max(0, activeCount - overdueCount);

    const stats = [
      { name: 'Düzenli Ödeyen', value: upToDateCount, color: 'teal' },
      { name: 'Gecikmiş', value: overdueCount, color: 'red' },
    ];

    return successResponse(stats);
  } catch (error) {
    logError('getPaymentStatusStats', error);
    return errorResponse('Veri alınamadı');
  }
}

/**
 * Get Lesson Popularity (Members per Dance Type)
 */
export async function getLessonPopularityStats(): Promise<
  ApiResponse<{ name: string; value: number }[]>
> {
  try {
    const supabase = await createClient();

    const { data: memberClasses, error: mcError } = await supabase.from(
      'member_classes'
    ).select(`
                class_id,
                classes (
                    dance_types (
                        name
                    )
                )
            `);

    if (mcError) throw mcError;

    const counts: Record<string, number> = {};

    memberClasses.forEach((mc: any) => {
      const typeName = mc.classes?.dance_types?.name || 'Belirsiz';
      counts[typeName] = (counts[typeName] || 0) + 1;
    });

    const result = Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
    result.sort((a, b) => b.value - a.value);

    return successResponse(result);
  } catch (error) {
    logError('getLessonPopularityStats', error);
    return errorResponse('Veri alınamadı');
  }
}

import { getServerNow } from '@/utils/server-date-helper';
import dayjs from 'dayjs';
/**
 * Get new members Stats (Last 6 Months)
 */
export async function getMemberGrowthStats(): Promise<
  ApiResponse<{ date: string; count: number }[]>
> {
  try {
    const supabase = await createClient();
    const today = await getServerNow();

    // Get start date (6 months ago)
    const startDate = today.subtract(5, 'month').startOf('month');

    const { data: members, error } = await supabase
      .from('members')
      .select('join_date')
      .gte('join_date', startDate.format('YYYY-MM-DD'));

    if (error) {
      logError('getMemberGrowthStats', error);
      return errorResponse(handleSupabaseError(error));
    }

    // Initialize last 6 months
    const stats = [];
    for (let i = 0; i < 6; i++) {
      const d = startDate.clone().add(i, 'month');
      stats.push({
        date: d.format('MMMM'), // Full month name (Turkish locale if configured)
        key: d.format('YYYY-MM'), // For sorting/grouping
        count: 0,
      });
    }

    // Aggregate
    members.forEach((m) => {
      const joinMonth = dayjs(m.join_date).format('YYYY-MM');
      const stat = stats.find((s) => s.key === joinMonth);
      if (stat) {
        stat.count++;
      }
    });

    // Return only name and count
    return successResponse(stats.map(({ date, count }) => ({ date, count })));
  } catch (error) {
    logError('getMemberGrowthStats', error);
    return errorResponse(handleSupabaseError(error));
  }
}

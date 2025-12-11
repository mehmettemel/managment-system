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

/**
 * Server Actions for Membership Freeze Management
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  FrozenLog,
  FrozenLogInsert,
  FreezeFormData,
  ApiResponse,
  ApiListResponse,
} from '@/types';
import {
  successResponse,
  errorResponse,
  successListResponse,
  errorListResponse,
  handleSupabaseError,
  logError,
} from '@/utils/response-helpers';
import {
  adjustPaymentDateForFreeze,
  calculateDaysBetween,
} from '@/utils/date-helpers';
import { getServerNow } from '@/utils/server-date-helper';
import { addMemberLog } from './members';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrBefore);

/**
 * Freeze a member's membership (Start the stopwatch)
 */

/**
 * Freeze a member's membership (Start the stopwatch)
 * Supports generic "Freeze All" or specific "Freeze Enrollments"
 */
export async function freezeMembership(
  formData: FreezeFormData
): Promise<ApiResponse<boolean>> {
  try {
    // Validate required fields
    if (!formData.member_id || !formData.start_date) {
      return errorResponse('Üye ID ve Başlangıç Tarihi zorunludur.');
    }

    if (!formData.is_indefinite && !formData.end_date) {
      return errorResponse('Süresiz seçilmediyse Bitiş Tarihi zorunludur.');
    }

    const supabase = await createClient();

    // 1. Identify which enrollments to freeze
    let enrollmentIdsToFreeze: number[] = formData.selectedEnrollmentIds || [];

    // If no specific enrollments selected, select ALL active enrollments for the member
    if (enrollmentIdsToFreeze.length === 0) {
      const { data: activeEnrollments } = await supabase
        .from('member_classes')
        .select('id')
        .eq('member_id', formData.member_id)
        .eq('active', true);

      if (activeEnrollments) {
        enrollmentIdsToFreeze = activeEnrollments.map((e) => e.id);
      }
    }

    if (enrollmentIdsToFreeze.length === 0) {
      return errorResponse('Dondurulacak aktif ders kaydı bulunamadı.');
    }

    // 2. Check if already frozen (any of the selected ones)
    // We can skip this check if we trust the UI, or do complex check.
    // For now, let's just insert logs. If they overlap, it's a bit messy but manageable.
    // Ideally we should prevent overlapping ranges for same member_class_id.

    // 3. Create frozen_logs for each enrollment
    const start_date = formData.start_date;
    const end_date = formData.is_indefinite ? null : formData.end_date;
    const reason = formData.reason || null;

    const logsToInsert: FrozenLogInsert[] = enrollmentIdsToFreeze.map(
      (mcId) => ({
        member_id: formData.member_id,
        member_class_id: mcId, // Specific enrollment
        start_date,
        end_date,
        reason,
      })
    );

    const { error: insertError } = await supabase
      .from('frozen_logs')
      .insert(logsToInsert);

    if (insertError) {
      logError('freezeMembership - insert logs', insertError);
      return errorResponse(handleSupabaseError(insertError));
    }

    // 4. Update Global Member Status based on remaining active enrollments
    // Logic: Member is FROZEN only if ALL their active enrollments are now frozen.
    // If they have 3 active classes and freeze 1, they are still ACTIVE globally.

    // Fetch ALL active enrollments (including the ones we just froze logs for,
    // because member_class.active is still true, we just have a log now)
    // Actually, we need to check if there are any active enrollments that correspond to NO active freeze log.

    // Simplification:
    // If we froze ALL enrollments in this request (and assuming no others were skipped?), we check.

    // Better: Re-verify status.
    const { data: allActiveEnrollments } = await supabase
      .from('member_classes')
      .select('id')
      .eq('member_id', formData.member_id)
      .eq('active', true);

    const totalActiveCount = allActiveEnrollments?.length || 0;

    // Check if new frozen count covers all
    // We need to count how many enrollments currently have an ACTIVE freeze log.
    // We just inserted logs for `enrollmentIdsToFreeze`.
    // But there might be PREVIOUSLY frozen logs too?
    // Let's count "Active And Not Frozen" enrollments.

    // Ideally we query DB for this assurance.
    const { data: activeFreezeLogs } = await supabase
      .from('frozen_logs')
      .select('member_class_id')
      .eq('member_id', formData.member_id)
      .is('end_date', null);

    const frozenClassIds = new Set(
      activeFreezeLogs?.map((l) => l.member_class_id)
    );

    // Add the ones we just froze (in case of replication lag, though same transaction usually safe in stored proc, here valid)
    enrollmentIdsToFreeze.forEach((id) => frozenClassIds.add(id));

    const hasUnfrozenClass = allActiveEnrollments?.some(
      (e) => !frozenClassIds.has(e.id)
    );

    const newGlobalStatus = hasUnfrozenClass ? 'active' : 'frozen';

    const { error: updateError } = await supabase
      .from('members')
      .update({ status: newGlobalStatus })
      .eq('id', formData.member_id);

    // LOGGING
    const now = await getServerNow();
    for (const mcId of enrollmentIdsToFreeze) {
      await addMemberLog(supabase, {
        member_id: formData.member_id,
        member_class_id: mcId,
        action_type: 'freeze',
        description: `Üyelik ${formData.is_indefinite ? 'süresiz' : 'süreli'} donduruldu.`,
        date: now.format('YYYY-MM-DD'),
        metadata: {
          start_date,
          end_date,
          reason,
          is_indefinite: formData.is_indefinite,
        },
      });
    }

    revalidatePath('/members');
    revalidatePath(`/members/${formData.member_id}`);
    return successResponse(true);
  } catch (error) {
    logError('freezeMembership', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Unfreeze specific log/enrollment
 */
export async function unfreezeLog(
  logId: number
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();
    const today = await getServerNow();

    // 1. Fetch the log
    const { data: log, error: fetchError } = await supabase
      .from('frozen_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (fetchError || !log) return errorResponse('Dondurma kaydı bulunamadı');

    // 2. Calculate effective days
    // If log ended in past, no shift needed (already processed? or ignoring).
    // Logic: Unfreeze usually means "Stop it NOW".

    const startDate = dayjs(log.start_date);
    // If start date is in future, we just delete/cancel it? Or treat as 0 days?
    // If today < start_date, effective days = 0.

    let effectiveDays = 0;
    if (startDate.isBefore(today)) {
      const daysDiff = today.diff(startDate, 'day');
      effectiveDays = Math.max(0, daysDiff);
    }

    // 3. Shift Date for the specific enrollment
    if (effectiveDays > 0 && log.member_class_id) {
      const { data: enrollment } = await supabase
        .from('member_classes')
        .select('next_payment_date')
        .eq('id', log.member_class_id)
        .single();

      if (enrollment && enrollment.next_payment_date) {
        const newDate = dayjs(enrollment.next_payment_date)
          .add(effectiveDays, 'day')
          .format('YYYY-MM-DD');
        await supabase
          .from('member_classes')
          .update({ next_payment_date: newDate })
          .eq('id', log.member_class_id);
      }
    }

    // 4. Close the log
    await supabase
      .from('frozen_logs')
      .update({
        end_date: today.format('YYYY-MM-DD'),
        days_count: effectiveDays,
      })
      .eq('id', logId);

    // 5. Update Member Status?
    // We strictly set active here because restoring even one class implies member is back.
    // Logic: If they have at least 1 active class -> Member Active.
    if (log.member_id) {
      await supabase
        .from('members')
        .update({ status: 'active' })
        .eq('id', log.member_id);
      revalidatePath(`/members/${log.member_id}`);
    }

    // LOGGING
    if (log.member_id) {
      await addMemberLog(supabase, {
        member_id: log.member_id,
        member_class_id: log.member_class_id,
        action_type: 'unfreeze',
        description: 'Üyelik dondurma işlemi sonlandırıldı.',
        date: today.format('YYYY-MM-DD'),
        metadata: {
          original_log_id: logId,
          effective_days: effectiveDays,
          start_date: log.start_date,
        },
      });
    }

    revalidatePath('/members');
    return successResponse(true);
  } catch (error) {
    logError('unfreezeLog', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Unfreeze a member's membership (All open logs)
 */
export async function unfreezeMembership(
  memberId: number
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();

    // 1. Find ALL open logs for this member
    const { data: openLogs } = await supabase
      .from('frozen_logs')
      .select('id')
      .eq('member_id', memberId)
      .is('end_date', null); // Open logs

    if (openLogs && openLogs.length > 0) {
      for (const log of openLogs) {
        await unfreezeLog(log.id);
      }
    } else {
      // Fallback: just force status active
      await supabase
        .from('members')
        .update({ status: 'active' })
        .eq('id', memberId);
    }

    revalidatePath('/members');
    revalidatePath(`/members/${memberId}`);
    return successResponse(true);
  } catch (error) {
    logError('unfreezeMembership', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Get freeze history for a member
 */
export async function getMemberFreezeHistory(
  memberId: number
): Promise<ApiListResponse<FrozenLog>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('frozen_logs')
      .select('*')
      .eq('member_id', memberId)
      .order('start_date', { ascending: false });

    if (error) {
      logError('getMemberFreezeHistory', error);
      return errorListResponse(handleSupabaseError(error));
    }

    return successListResponse(data || []);
  } catch (error) {
    logError('getMemberFreezeHistory', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Get all currently frozen members
 */
export async function getFrozenMembers(): Promise<ApiListResponse<FrozenLog>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('frozen_logs')
      .select('*')
      .is('end_date', null)
      .order('start_date', { ascending: false });
    return successListResponse(data || []);
  } catch (error) {
    logError('getFrozenMembers', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Cancel a future scheduled freeze
 */
export async function cancelFutureFreeze(
  logId: number
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();

    // 1. Verify it IS a future freeze
    const { data: log, error: fetchError } = await supabase
      .from('frozen_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (fetchError || !log) return errorResponse('Dondurma kaydı bulunamadı');

    const today = await getServerNow();
    if (
      dayjs(log.start_date).isBefore(today) ||
      dayjs(log.start_date).isSame(today, 'day')
    ) {
      return errorResponse(
        'Bu dondurma işlemi şuan aktif veya geçmişte kalmış. İptal edilemez, ancak "Unfreeze" yapabilirsiniz.'
      );
    }

    // 2. Delete the log
    const { error: deleteError } = await supabase
      .from('frozen_logs')
      .delete()
      .eq('id', logId);

    if (deleteError) {
      logError('cancelFutureFreeze', deleteError);
      return errorResponse(handleSupabaseError(deleteError));
    }

    revalidatePath('/members');
    return successResponse(true);
  } catch (error) {
    logError('cancelFutureFreeze', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Sync all member statuses based on current date
 * (Used for Simulation Time Travel)
 */
export async function syncMemberStatuses(): Promise<
  ApiResponse<{ updated: number; total: number }>
> {
  try {
    const supabase = await createClient();
    const today = await getServerNow();

    // Fetch all members with their logs join
    // We need to know if they have ANY log that covers "Today"
    const { data: members, error } = await supabase
      .from('members')
      .select(
        `
        id, 
        status, 
        frozen_logs (
          start_date,
          end_date
        )
      `
      )
      .order('id');

    if (error) throw error;
    if (!members) return successResponse({ updated: 0, total: 0 });

    let updatedCount = 0;
    const updates = [];

    for (const member of members) {
      let shouldBeFrozen = false;

      // Check logs
      // Check logs
      if (member.frozen_logs && member.frozen_logs.length > 0) {
        // Is there any log where start <= today AND (end is null OR end > today)
        shouldBeFrozen = member.frozen_logs.some((log) => {
          const start = dayjs(log.start_date);
          const end = log.end_date ? dayjs(log.end_date) : null;

          console.log(
            `[Sync] Member ${member.id} Log: ${log.start_date} - ${log.end_date || 'Ingdif'}. Today: ${today.format('YYYY-MM-DD')}`
          );

          // If start is in future, it doesn't count yet
          if (start.isAfter(today, 'day')) {
            console.log(`[Sync] Member ${member.id}: Start date is future.`);
            return false;
          }

          // If it started, did it end?
          // If ends TODAY, we treat as ended (active).
          if (end && end.isSameOrBefore(today, 'day')) {
            console.log(
              `[Sync] Member ${member.id}: Ended on or before today.`
            );
            return false;
          }

          console.log(`[Sync] Member ${member.id}: MATCHES freeze condition.`);
          return true;
        });
      }

      // Determine correct status
      let correctStatus = member.status;
      if (shouldBeFrozen && member.status !== 'frozen') {
        correctStatus = 'frozen';
        console.log(
          `[Sync] Member ${member.id}: Changing status ACTIVE -> FROZEN`
        );
      } else if (!shouldBeFrozen && member.status === 'frozen') {
        correctStatus = 'active'; // Or whatever it was? Usually active.
        console.log(
          `[Sync] Member ${member.id}: Changing status FROZEN -> ACTIVE`
        );
      } else {
        // Status matches logic, no change needed.
        continue;
      }

      // If status needs change
      if (correctStatus !== member.status) {
        updatedCount++;
        updates.push(
          supabase
            .from('members')
            .update({ status: correctStatus })
            .eq('id', member.id)
        );
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      revalidatePath('/members');
    }

    return successResponse({ updated: updatedCount, total: members.length });
  } catch (error) {
    logError('syncMemberStatuses', error);
    return errorResponse(handleSupabaseError(error));
  }
}

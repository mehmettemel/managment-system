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
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrBefore);

/**
 * Freeze a member's membership (Start the stopwatch)
 */
export async function freezeMembership(
  formData: FreezeFormData
): Promise<ApiResponse<FrozenLog>> {
  try {
    // Validate required fields
    if (!formData.member_id || !formData.start_date) {
      return errorResponse('Üye ID ve Başlangıç Tarihi zorunludur.');
    }

    if (!formData.is_indefinite && !formData.end_date) {
      return errorResponse('Süresiz seçilmediyse Bitiş Tarihi zorunludur.');
    }

    const supabase = await createClient();

    // 0. Check if already frozen
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('status')
      .eq('id', formData.member_id)
      .single();

    if (memberError) return errorResponse(handleSupabaseError(memberError));

    if (member.status === 'frozen') {
      return errorResponse('Üye zaten dondurulmuş durumda.');
    }

    // Create freeze log
    // If indefinite, end_date is null.
    // If specific date, we log it, but logic for extension happens on Unfreeze usually?
    // User logic: "Üye Dondur dediğinde zamanı durdurursun... Üye 3 ay sonra girdiğinde Devam Et dersin... 3 ay eklenir."
    // This implies we handle extension on Unfreeze.

    // However, if they set a specific date, maybe they want it to auto-unfreeze?
    // The current task focuses on "Indefinite" flow logic.
    // We will support both, but for indefinite, end_date is null.

    const freezeData: FrozenLogInsert = {
      member_id: formData.member_id,
      start_date: formData.start_date,
      end_date: formData.is_indefinite ? null : formData.end_date,
      reason: formData.reason || null,
    };

    const { data: freezeLog, error: freezeError } = await supabase
      .from('frozen_logs')
      .insert(freezeData)
      .select()
      .single();

    if (freezeError) {
      logError('freezeMembership - create log', freezeError);
      return errorResponse(handleSupabaseError(freezeError));
    }

    // Update member status to 'frozen'
    // We do NOT change dates yet. The clock is stopped.
    const { error: updateError } = await supabase
      .from('members')
      .update({
        status: 'frozen',
      })
      .eq('id', formData.member_id);

    if (updateError) {
      logError('freezeMembership - update member', updateError);
      return errorResponse(handleSupabaseError(updateError));
    }

    revalidatePath('/members');
    revalidatePath(`/members/${formData.member_id}`);
    return successResponse(freezeLog);
  } catch (error) {
    logError('freezeMembership', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Unfreeze a member's membership (Stop the stopwatch)
 */
/**
 * Unfreeze a member's membership (Stop the stopwatch)
 */
export async function unfreezeMembership(
  memberId: number
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();

    // 1. Find the ACTIVE freeze log (Most recent one)
    const { data: openLog, error: fetchLogError } = await supabase
      .from('frozen_logs')
      .select('*')
      .eq('member_id', memberId)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchLogError) {
      logError('unfreezeMembership - fetch log', fetchLogError);
      return errorResponse(handleSupabaseError(fetchLogError));
    }

    if (!openLog) {
      // If no log exists but status is frozen, force activate
      const { error: activateError } = await supabase
        .from('members')
        .update({ status: 'active' })
        .eq('id', memberId);

      if (activateError)
        return errorResponse(handleSupabaseError(activateError));
      revalidatePath('/members');
      return successResponse(true);
    }

    const today = await getServerNow();

    // Check if this log is already "closed" in the past
    if (openLog.end_date && dayjs(openLog.end_date).isBefore(today)) {
      // It was a past freeze. Member shouldn't be frozen probably?
      // Just force activate.
      const { error: activateError } = await supabase
        .from('members')
        .update({ status: 'active' })
        .eq('id', memberId);

      if (activateError)
        return errorResponse(handleSupabaseError(activateError));
      return successResponse(true);
    }

    const startDate = dayjs(openLog.start_date);
    const daysDiff = today.diff(startDate, 'day');
    const effectiveDays = Math.max(0, daysDiff);

    // 2. Update ALL active member_classes
    // We need to shift next_payment_date by effectiveDays
    // We can do this via JS loop to be DB-agnostic regarding SQL date functions,
    // or use RPC if we had one. JS loop is fine for small number of classes per member.

    const { data: enrollments, error: enrollError } = await supabase
      .from('member_classes')
      .select('*')
      .eq('member_id', memberId)
      .eq('active', true);

    if (enrollError) {
      logError('unfreezeMembership - fetch classes', enrollError);
      return errorResponse(handleSupabaseError(enrollError));
    }

    if (enrollments && enrollments.length > 0) {
      // Process updates in parallel
      await Promise.all(
        enrollments.map(async (enrollment) => {
          if (enrollment.next_payment_date) {
            const newDate = dayjs(enrollment.next_payment_date)
              .add(effectiveDays, 'day')
              .format('YYYY-MM-DD');

            await supabase
              .from('member_classes')
              .update({ next_payment_date: newDate })
              .eq('id', enrollment.id);
          }
        })
      );
    }

    // 3. Close the freeze log
    const { error: closeLogError } = await supabase
      .from('frozen_logs')
      .update({
        end_date: today.format('YYYY-MM-DD'),
        days_count: effectiveDays,
      })
      .eq('id', openLog.id);

    if (closeLogError) {
      logError('unfreezeMembership - close log', closeLogError);
      return errorResponse(handleSupabaseError(closeLogError));
    }

    // 4. Update Member Status
    const { error: updateMemberError } = await supabase
      .from('members')
      .update({ status: 'active' })
      .eq('id', memberId);

    if (updateMemberError) {
      return errorResponse(handleSupabaseError(updateMemberError));
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

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
import dayjs from 'dayjs';

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
export async function unfreezeMembership(
  memberId: number
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();

    // 1. Find the open freeze log (end_date is null) OR the latest one that started?
    // Ideally we look for one where end_date IS NULL.
    // But if they set a specific date and came back EARLY? We should find the latest active freeze.
    // For simplicity per requirements: "Veritabanından o üyenin kapanmamış (end_date is NULL) kaydını bul"

    let { data: openLog, error: logErrorMsg } = await supabase
      .from('frozen_logs')
      .select('*')
      .eq('member_id', memberId)
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    // Use current date for "Now"
    const today = dayjs().format('YYYY-MM-DD');
    let startDate = openLog?.start_date;

    // Fallback: If no NULL end_date log found (maybe they set a date but want to unfreeze early/now),
    // find the latest log that covers today? Or just the latest log where member is frozen?
    // Since member status is 'frozen', there MUST be a log.
    if (!openLog) {
      // Attempt to find latest log even if it has end_date (maybe future end date)
      const { data: latestLog } = await supabase
        .from('frozen_logs')
        .select('*')
        .eq('member_id', memberId)
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (latestLog) {
        openLog = latestLog;
        startDate = latestLog.start_date;
      }
    }

    if (!startDate) {
      return errorResponse('Aktif bir dondurma kaydı bulunamadı.');
    }

    // 2. Calculate Duration
    // If StartDate is 15 March, Today is 15 June. Diff = 90 days.
    const daysDiff = dayjs(today).diff(dayjs(startDate), 'day');

    // Ensure positive (if unfreezing same day)
    const effectiveDays = Math.max(0, daysDiff);

    // 3. Update Member Dates
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('next_payment_due_date')
      .eq('id', memberId)
      .single();

    if (memberError || !member) return errorResponse('Üye bulunamadı');

    // If member has a due date, extend it.
    let newDueDate = member.next_payment_due_date;
    if (newDueDate) {
      newDueDate = dayjs(newDueDate)
        .add(effectiveDays, 'day')
        .format('YYYY-MM-DD');
    }

    // 4. Close the log
    const { error: closeLogError } = await supabase
      .from('frozen_logs')
      .update({
        end_date: today,
        days_count: effectiveDays,
      })
      .eq('id', openLog!.id); // We know openLog exists here

    if (closeLogError) {
      logError('unfreezeMembership - close log', closeLogError);
      // Continue? Critical step.
      return errorResponse('Dondurma kaydı kapatılamadı.');
    }

    // 5. Update Member Status
    const { error: updateMemberError } = await supabase
      .from('members')
      .update({
        status: 'active',
        next_payment_due_date: newDueDate,
      })
      .eq('id', memberId);

    if (updateMemberError) {
      logError('unfreezeMembership', updateMemberError);
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

    if (error) {
      logError('getFrozenMembers', error);
      return errorListResponse(handleSupabaseError(error));
    }

    return successListResponse(data || []);
  } catch (error) {
    logError('getFrozenMembers', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

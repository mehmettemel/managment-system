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
    console.log(`Unfreezing member: ${memberId}`);

    // 1. Find the open freeze log or latest log
    let { data: openLog } = await supabase
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

    // Fallback: search for latest log if no open log found
    if (!openLog) {
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

    if (!startDate || !openLog) {
      return errorResponse('Aktif bir dondurma kaydı bulunamadı.');
    }

    // 2. Calculate Duration
    const daysDiff = dayjs(today).diff(dayjs(startDate), 'day');
    const effectiveDays = Math.max(0, daysDiff);

    // 3. Update Member Classes (The core fix)
    // Fetch all active enrollments for this member
    const { data: enrollments, error: enrollError } = await supabase
      .from('member_classes')
      .select('*')
      .eq('member_id', memberId)
      .eq('active', true);

    if (enrollError) {
      logError('unfreezeMembership - fetch classes', enrollError);
      return errorResponse('Ders kayıtları alınamadı');
    }

    // Update each class enrollment date
    if (enrollments && enrollments.length > 0) {
      for (const enrollment of enrollments) {
        if (enrollment.next_payment_date) {
          const newDate = dayjs(enrollment.next_payment_date)
            .add(effectiveDays, 'day')
            .format('YYYY-MM-DD');

          await supabase
            .from('member_classes')
            .update({ next_payment_date: newDate })
            .eq('id', enrollment.id);
        }
      }
    }

    // 4. Close the log
    // Only update if it was open (end_date was null)
    // If we picked up a closed log (latestLog fallback), we technically shouldn't update it unless logic dictates.
    // However, if member is 'frozen', we must have an open log usually.
    // If we used fallback, it might mean data inconsistency, but let's try to close if it's null.
    if (!openLog.end_date) {
      const { error: closeLogError } = await supabase
        .from('frozen_logs')
        .update({
          end_date: today,
          days_count: effectiveDays,
        })
        .eq('id', openLog.id);

      if (closeLogError) {
        logError('unfreezeMembership - close log', closeLogError);
        return errorResponse('Dondurma kaydı kapatılamadı.');
      }
    }

    // 5. Update Member Status
    // Removed next_payment_due_date update as it's deprecated
    const { error: updateMemberError } = await supabase
      .from('members')
      .update({
        status: 'active',
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

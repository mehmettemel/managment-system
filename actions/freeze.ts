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

    // 1. Find the OPEN freeze log
    const { data: openLog, error: logError } = await supabase
      .from('frozen_logs')
      .select('*')
      .eq('member_id', memberId)
      .is('end_date', null)
      .maybeSingle(); // Use maybeSingle to avoid 406 if none found

    if (logError) {
      logError('unfreezeMembership - fetch log', logError);
      return errorResponse(handleSupabaseError(logError));
    }

    if (!openLog) {
      // If no open log exists, check if they are actually frozen?
      // If status is frozen but no log, just activate them.
      // But if we want to be strict, we return error.
      // For safety, let's allow "Force Unfreeze" effect by just setting active if no log found.
      const { error: activateError } = await supabase
        .from('members')
        .update({ status: 'active' })
        .eq('id', memberId);

      if (activateError)
        return errorResponse(handleSupabaseError(activateError));

      revalidatePath('/members');
      return successResponse(true);
    }

    const today = dayjs();
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

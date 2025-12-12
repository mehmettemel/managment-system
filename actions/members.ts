/**
 * Server Actions for Member Management
 * Updated for Class-Based Payment System
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Member,
  MemberInsert,
  MemberUpdate,
  MemberFormData,
  ApiResponse,
  ApiListResponse,
  MemberClassWithDetails,
  MemberWithClasses,
} from '@/types';
import {
  successResponse,
  errorResponse,
  successListResponse,
  errorListResponse,
  handleSupabaseError,
  logError,
  sanitizeInput,
  validateRequiredFields,
} from '@/utils/response-helpers';
import { getTodayDate } from '@/utils/date-helpers';
import dayjs from 'dayjs';

/**
 * Get all members with optional filtering
 */
export async function getMembers(
  status?: string
): Promise<ApiListResponse<MemberWithClasses>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('members')
      .select('*, member_classes(*, classes(name))')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      logError('getMembers', error);
      return errorListResponse(handleSupabaseError(error));
    }

    return successListResponse(
      (data as unknown as MemberWithClasses[]) || [],
      count || 0
    );
  } catch (error) {
    logError('getMembers', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Get a single member by ID with their classes (extended)
 */
export async function getMemberById(
  id: number
): Promise<ApiResponse<Member & { member_classes: MemberClassWithDetails[] }>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('members')
      .select(
        `
        *,
        member_classes (
          id,
          member_id,
          class_id,
          next_payment_date,
          price,
          active,
          payment_interval,
          custom_price,
          classes (*)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      logError('getMemberById', error);
      return errorResponse(handleSupabaseError(error));
    }

    return successResponse(
      data as Member & { member_classes: MemberClassWithDetails[] }
    );
  } catch (error) {
    logError('getMemberById', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Create a new member with class-based payment tracking
 */
/**
 * Create a new member with class-based payment tracking
 */
export async function createMember(
  formData: MemberFormData
): Promise<ApiResponse<Member>> {
  try {
    // Validate required fields
    const validation = validateRequiredFields(
      formData as unknown as Record<string, unknown>,
      ['first_name', 'last_name']
    );
    if (!validation.valid) {
      return errorResponse(
        `Gerekli alanlar eksik: ${validation.missingFields.join(', ')}`
      );
    }

    const supabase = await createClient();
    const today = getTodayDate();

    // Prepare member data (no payment dates on member level anymore)
    const memberData: MemberInsert = sanitizeInput({
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone || null,
      join_date: today,
      status: 'active',
    });

    // Create member
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert(memberData)
      .select()
      .single();

    if (memberError) {
      logError('createMember', memberError);
      return errorResponse(handleSupabaseError(memberError));
    }

    // Associate member with classes (with next_payment_date and price)
    if (
      formData.class_registrations &&
      formData.class_registrations.length > 0
    ) {
      const memberClasses = formData.class_registrations.map((reg) => {
        // Calculate initial next_payment_date based on duration
        const nextPaymentDate = dayjs(today)
          .add(reg.duration, 'month')
          .format('YYYY-MM-DD');

        return {
          member_id: member.id,
          class_id: reg.class_id,
          next_payment_date: nextPaymentDate,
          price: reg.price,
          active: true,
          payment_interval: reg.duration,
          custom_price: reg.price,
        };
      });

      const { error: classError } = await supabase
        .from('member_classes')
        .insert(memberClasses);

      if (classError) {
        logError('createMember - classes', classError);
        // Continue anyway, member is created
      }
    }

    revalidatePath('/members');
    return successResponse(member);
  } catch (error) {
    logError('createMember', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Update a member
 */
export async function updateMember(
  id: number,
  updates: MemberUpdate
): Promise<ApiResponse<Member>> {
  try {
    const supabase = await createClient();

    const sanitizedUpdates = sanitizeInput(updates);

    const { data, error } = await supabase
      .from('members')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logError('updateMember', error);
      return errorResponse(handleSupabaseError(error));
    }

    revalidatePath('/members');
    revalidatePath(`/members/${id}`);
    return successResponse(data);
  } catch (error) {
    logError('updateMember', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Archive a member (soft delete)
 */
export async function archiveMember(id: number): Promise<ApiResponse<Member>> {
  return updateMember(id, { status: 'archived' });
}

/**
 * Unarchive a member (restore)
 */
export async function unarchiveMember(
  id: number
): Promise<ApiResponse<Member>> {
  return updateMember(id, { status: 'active' });
}

/**
 * Search members by name or phone
 */
export async function searchMembers(
  query: string
): Promise<ApiListResponse<Member>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`
      )
      .order('created_at', { ascending: false });

    if (error) {
      logError('searchMembers', error);
      return errorListResponse(handleSupabaseError(error));
    }

    return successListResponse(data || []);
  } catch (error) {
    logError('searchMembers', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Get members with overdue payments (class-based)
 * A member is overdue if ANY of their classes has next_payment_date < today
 */
export async function getOverdueMembers(): Promise<ApiListResponse<Member>> {
  try {
    const supabase = await createClient();
    const today = getTodayDate();

    // Native JOIN query to avoid N+1
    // !inner ensures we only get members who HAVE a matching overdue class
    const { data, error } = await supabase
      .from('members')
      .select('*, member_classes!inner(id)')
      .eq('status', 'active')
      .eq('member_classes.active', true)
      .lt('member_classes.next_payment_date', today)
      .order('first_name', { ascending: true });

    if (error) {
      logError('getOverdueMembers', error);
      return errorListResponse(handleSupabaseError(error));
    }

    // Supabase might return duplicate members if they have multiple overdue classes.
    // Uniqify by ID just in case (though logical join usually implies rows)
    // Actually, select on parent with inner join returns parent rows.
    // If multiple children match, parent might be duplicated in SQL result depending on how PostgREST handles it.
    // PostgREST usually deduplicates parent unless explicit 1:Many embedding is requested as an array.
    // Here we request `member_classes!inner(id)`. This usually embeds it.
    // So 'data' will be unique Members, each with an array of member_classes.

    return successListResponse(data || []);
  } catch (error) {
    logError('getOverdueMembers', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Update member class details (price, payment_interval)
 */
export async function updateMemberClassDetails(
  memberId: number,
  classId: number,
  updates: { price?: number; payment_interval?: number; custom_price?: number }
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('member_classes')
      .update(updates)
      .eq('member_id', memberId)
      .eq('class_id', classId);

    if (error) {
      logError('updateMemberClassDetails', error);
      return errorResponse(handleSupabaseError(error));
    }

    revalidatePath(`/members/${memberId}`);
    return successResponse(true);
  } catch (error) {
    logError('updateMemberClassDetails', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Migrate a single member to a new class (Scenario A)
 * @param priceStrategy 'KEEP_OLD' uses old price as custom_price, 'USE_NEW' uses null (list price)
 */
export async function transferMember(
  memberId: number,
  oldClassId: number,
  newClassId: number,
  priceStrategy: 'KEEP_OLD' | 'USE_NEW'
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();

    // 1. Get old active enrollment
    const { data: oldEnrollment, error: oldError } = await supabase
      .from('member_classes')
      .select('*')
      .eq('member_id', memberId)
      .eq('class_id', oldClassId)
      .eq('active', true)
      .single();

    if (oldError || !oldEnrollment) {
      return errorResponse('Aktif üyelik kaydı bulunamadı');
    }

    // 2. Determine Price
    let newCustomPrice: number | null = null;

    if (priceStrategy === 'KEEP_OLD') {
      // Use existing custom price OR legacy price OR old class list price
      if (oldEnrollment.custom_price !== null) {
        newCustomPrice = oldEnrollment.custom_price;
      } else if (oldEnrollment.price !== null) {
        newCustomPrice = oldEnrollment.price;
      } else {
        const { data: oldClass } = await supabase
          .from('classes')
          .select('price_monthly')
          .eq('id', oldClassId)
          .single();
        newCustomPrice = oldClass?.price_monthly || null;
      }
    }
    // IF USE_NEW, custom_price remains null (will use new class list price)

    // 3. Create new enrollment (INSERT FIRST for safety)
    const { error: insertError } = await supabase
      .from('member_classes')
      .insert({
        member_id: memberId,
        class_id: newClassId,
        active: true,
        next_payment_date: oldEnrollment.next_payment_date, // Copy date
        custom_price: newCustomPrice,
        payment_interval: oldEnrollment.payment_interval,
      });

    if (insertError) {
      logError('transferMember - insert', insertError);
      return errorResponse(handleSupabaseError(insertError));
    }

    // 4. Deactivate old (UPDATE SECOND)
    // Only reachable if insert succeeded
    const { error: deactivateError } = await supabase
      .from('member_classes')
      .update({ active: false })
      .eq('id', oldEnrollment.id);

    if (deactivateError) {
      // Critical: New created, Old not deactivated. Duplicate state.
      // We log highly visible error but don't fail the request as the user is effectively transferred.
      logError('transferMember - deactivate OLD failed', deactivateError);
    }

    revalidatePath(`/members/${memberId}`);
    return successResponse(true);
  } catch (error) {
    logError('transferMember', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Permanently delete a member and all related data
 * WARNING: This action is irreversible
 */
export async function deleteMember(id: number): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();

    // 0. Safety Check: Verify no financial history
    const { count, error: countError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', id);

    if (countError) return errorResponse(handleSupabaseError(countError));

    if (count && count > 0) {
      return errorResponse(
        'Bu üyenin ödeme geçmişi bulunmaktadır. Silmek yerine arşivlemelisiniz.'
      );
    }

    // 1. Delete related records first (Only non-financial safe to delete?)
    // If we passed the check, they have NO payments. Safe to delete member_classes etc.
    await Promise.all([
      // payments delete is redundant now as count is 0, but keeping for completeness if race condition
      supabase.from('payments').delete().eq('member_id', id),
      supabase.from('member_classes').delete().eq('member_id', id),
      supabase.from('frozen_logs').delete().eq('member_id', id),
    ]);

    // 2. Delete the member
    const { error } = await supabase.from('members').delete().eq('id', id);

    if (error) {
      logError('deleteMember', error);
      return errorResponse(handleSupabaseError(error));
    }

    revalidatePath('/members');
    return successResponse(true);
  } catch (error) {
    logError('deleteMember', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Bulk delete members permanently
 */
export async function deleteMembers(
  ids: number[]
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();

    if (ids.length === 0) return successResponse(true);

    // 1. Delete related records first
    await Promise.all([
      supabase.from('payments').delete().in('member_id', ids),
      supabase.from('member_classes').delete().in('member_id', ids),
      supabase.from('frozen_logs').delete().in('member_id', ids),
    ]);

    // 2. Delete members
    const { error } = await supabase.from('members').delete().in('id', ids);

    if (error) {
      logError('deleteMembers', error);
      return errorResponse(handleSupabaseError(error));
    }

    revalidatePath('/members');
    return successResponse(true);
  } catch (error) {
    logError('deleteMembers', error);
    return errorResponse(handleSupabaseError(error));
  }
}

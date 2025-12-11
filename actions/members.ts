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
      .select('*')
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
      monthly_fee: 0, // No global monthly fee anymore
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

    // Get member IDs with overdue class payments
    const { data: overdueClasses, error: mcError } = await supabase
      .from('member_classes')
      .select('member_id')
      .eq('active', true)
      .lt('next_payment_date', today);

    if (mcError) {
      logError('getOverdueMembers - member_classes', mcError);
      return errorListResponse(handleSupabaseError(mcError));
    }

    const overdueIds = [
      ...new Set(overdueClasses?.map((mc) => mc.member_id) || []),
    ];

    if (overdueIds.length === 0) {
      return successListResponse([]);
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'active')
      .in('id', overdueIds)
      .order('first_name', { ascending: true });

    if (error) {
      logError('getOverdueMembers', error);
      return errorListResponse(handleSupabaseError(error));
    }

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
  updates: { price?: number; payment_interval?: number }
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

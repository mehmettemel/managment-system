/**
 * Server Actions for Member Management
 * These functions run on the server and can be called from Client Components
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  Member,
  MemberInsert,
  MemberUpdate,
  MemberWithClasses,
  MemberFormData,
  ApiResponse,
  ApiListResponse,
} from '@/types'
import {
  successResponse,
  errorResponse,
  successListResponse,
  errorListResponse,
  handleSupabaseError,
  logError,
  sanitizeInput,
  validateRequiredFields,
} from '@/utils/response-helpers'
import { calculateNextPaymentDate, getTodayDate } from '@/utils/date-helpers'

/**
 * Get all members with optional filtering
 */
export async function getMembers(
  status?: string
): Promise<ApiListResponse<Member>> {
  try {
    const supabase = await createClient()

    let query = supabase.from('members').select('*').order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      logError('getMembers', error)
      return errorListResponse(handleSupabaseError(error))
    }

    return successListResponse(data || [], count || 0)
  } catch (error) {
    logError('getMembers', error)
    return errorListResponse(handleSupabaseError(error))
  }
}

/**
 * Get a single member by ID with their classes
 */
export async function getMemberById(
  id: number
): Promise<ApiResponse<MemberWithClasses>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('members')
      .select(
        `
        *,
        member_classes (
          *,
          classes (*)
        )
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      logError('getMemberById', error)
      return errorResponse(handleSupabaseError(error))
    }

    return successResponse(data as MemberWithClasses)
  } catch (error) {
    logError('getMemberById', error)
    return errorResponse(handleSupabaseError(error))
  }
}

/**
 * Create a new member
 */
export async function createMember(
  formData: MemberFormData
): Promise<ApiResponse<Member>> {
  try {
    // Validate required fields
    const validation = validateRequiredFields(formData as unknown as Record<string, unknown>, ['first_name', 'last_name'])
    if (!validation.valid) {
      return errorResponse(`Gerekli alanlar eksik: ${validation.missingFields.join(', ')}`)
    }

    const supabase = await createClient()
    const today = getTodayDate()

    // Prepare member data
    const memberData: MemberInsert = sanitizeInput({
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone || null,
      join_date: today,
      status: 'active',
      monthly_fee: formData.monthly_fee || 0,
    })

    // If initial payment is provided, set payment dates
    if (formData.initial_payment) {
      memberData.last_payment_date = today
      // Calculate next due date based on duration
      const duration = formData.initial_duration_months || 1
      const nextDate = new Date(today)
      nextDate.setMonth(nextDate.getMonth() + duration)
      memberData.next_payment_due_date = nextDate.toISOString().split('T')[0]
    }

    // Create member
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert(memberData)
      .select()
      .single()

    if (memberError) {
      logError('createMember', memberError)
      return errorResponse(handleSupabaseError(memberError))
    }

    // Associate member with classes
    if (formData.class_ids.length > 0) {
      const memberClasses = formData.class_ids.map((classId) => ({
        member_id: member.id,
        class_id: classId,
      }))

      const { error: classError } = await supabase
        .from('member_classes')
        .insert(memberClasses)

      if (classError) {
        logError('createMember - classes', classError)
        // Continue anyway, member is created
      }
    }

    // Create initial payment if provided
    if (formData.initial_payment) {
      const { error: paymentError } = await supabase.from('payments').insert({
        member_id: member.id,
        amount: formData.initial_payment.amount,
        payment_method: formData.initial_payment.payment_method || 'Nakit',
        payment_date: today,
        period_start: today,
        period_end: calculateNextPaymentDate(today),
        description: formData.initial_payment.description || 'İlk ödeme',
      })

      if (paymentError) {
        logError('createMember - payment', paymentError)
        // Continue anyway, member is created
      }
    }

    revalidatePath('/members')
    return successResponse(member)
  } catch (error) {
    logError('createMember', error)
    return errorResponse(handleSupabaseError(error))
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
    const supabase = await createClient()

    const sanitizedUpdates = sanitizeInput(updates)

    const { data, error } = await supabase
      .from('members')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('updateMember', error)
      return errorResponse(handleSupabaseError(error))
    }

    revalidatePath('/members')
    revalidatePath(`/members/${id}`)
    return successResponse(data)
  } catch (error) {
    logError('updateMember', error)
    return errorResponse(handleSupabaseError(error))
  }
}

/**
 * Archive a member (soft delete)
 */
export async function archiveMember(id: number): Promise<ApiResponse<Member>> {
  return updateMember(id, { status: 'archived' })
}

/**
 * Search members by name or phone
 */
export async function searchMembers(
  query: string
): Promise<ApiListResponse<Member>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`
      )
      .order('created_at', { ascending: false })

    if (error) {
      logError('searchMembers', error)
      return errorListResponse(handleSupabaseError(error))
    }

    return successListResponse(data || [])
  } catch (error) {
    logError('searchMembers', error)
    return errorListResponse(handleSupabaseError(error))
  }
}

/**
 * Get members with overdue payments
 */
export async function getOverdueMembers(): Promise<ApiListResponse<Member>> {
  try {
    const supabase = await createClient()
    const today = getTodayDate()

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'active')
      .lt('next_payment_due_date', today)
      .order('next_payment_due_date', { ascending: true })

    if (error) {
      logError('getOverdueMembers', error)
      return errorListResponse(handleSupabaseError(error))
    }

    return successListResponse(data || [])
  } catch (error) {
    logError('getOverdueMembers', error)
    return errorListResponse(handleSupabaseError(error))
  }
}

/**
 * Server Actions for Membership Freeze Management
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  FrozenLog,
  FrozenLogInsert,
  FreezeFormData,
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
  validateRequiredFields,
} from '@/utils/response-helpers'
import {
  adjustPaymentDateForFreeze,
  calculateDaysBetween,
} from '@/utils/date-helpers'

/**
 * Freeze a member's membership
 */
export async function freezeMembership(
  formData: FreezeFormData
): Promise<ApiResponse<FrozenLog>> {
  try {
    // Validate required fields
    const validation = validateRequiredFields(formData as unknown as Record<string, unknown>, [
      'member_id',
      'start_date',
      'end_date',
    ])
    if (!validation.valid) {
      return errorResponse(`Gerekli alanlar eksik: ${validation.missingFields.join(', ')}`)
    }

    const supabase = await createClient()

    // Calculate freeze duration
    const freezeDays = calculateDaysBetween(
      formData.start_date,
      formData.end_date
    )

    if (freezeDays <= 0) {
      return errorResponse('Bitiş tarihi başlangıç tarihinden sonra olmalıdır.')
    }

    // Get member's current payment due date
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('next_payment_due_date')
      .eq('id', formData.member_id)
      .single()

    if (memberError) {
      logError('freezeMembership - get member', memberError)
      return errorResponse(handleSupabaseError(memberError))
    }

    // Create freeze log
    const freezeData: FrozenLogInsert = {
      member_id: formData.member_id,
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason || null,
    }

    const { data: freezeLog, error: freezeError } = await supabase
      .from('frozen_logs')
      .insert(freezeData)
      .select()
      .single()

    if (freezeError) {
      logError('freezeMembership - create log', freezeError)
      return errorResponse(handleSupabaseError(freezeError))
    }

    // Update member status and adjust payment date
    const newPaymentDate = adjustPaymentDateForFreeze(
      member.next_payment_due_date,
      freezeDays
    )

    const { error: updateError } = await supabase
      .from('members')
      .update({
        status: 'frozen',
        next_payment_due_date: newPaymentDate,
      })
      .eq('id', formData.member_id)

    if (updateError) {
      logError('freezeMembership - update member', updateError)
      return errorResponse(handleSupabaseError(updateError))
    }

    revalidatePath('/members')
    revalidatePath(`/members/${formData.member_id}`)
    return successResponse(freezeLog)
  } catch (error) {
    logError('freezeMembership', error)
    return errorResponse(handleSupabaseError(error))
  }
}

/**
 * Unfreeze a member's membership
 */
export async function unfreezeMembership(
  memberId: number
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient()

    // Update member status to active
    const { error: updateError } = await supabase
      .from('members')
      .update({ status: 'active' })
      .eq('id', memberId)

    if (updateError) {
      logError('unfreezeMembership', updateError)
      return errorResponse(handleSupabaseError(updateError))
    }

    revalidatePath('/members')
    revalidatePath(`/members/${memberId}`)
    return successResponse(true)
  } catch (error) {
    logError('unfreezeMembership', error)
    return errorResponse(handleSupabaseError(error))
  }
}

/**
 * Get freeze history for a member
 */
export async function getMemberFreezeHistory(
  memberId: number
): Promise<ApiListResponse<FrozenLog>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('frozen_logs')
      .select('*')
      .eq('member_id', memberId)
      .order('start_date', { ascending: false })

    if (error) {
      logError('getMemberFreezeHistory', error)
      return errorListResponse(handleSupabaseError(error))
    }

    return successListResponse(data || [])
  } catch (error) {
    logError('getMemberFreezeHistory', error)
    return errorListResponse(handleSupabaseError(error))
  }
}

/**
 * Get all currently frozen members
 */
export async function getFrozenMembers(): Promise<ApiListResponse<FrozenLog>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('frozen_logs')
      .select('*')
      .is('end_date', null)
      .order('start_date', { ascending: false })

    if (error) {
      logError('getFrozenMembers', error)
      return errorListResponse(handleSupabaseError(error))
    }

    return successListResponse(data || [])
  } catch (error) {
    logError('getFrozenMembers', error)
    return errorListResponse(handleSupabaseError(error))
  }
}

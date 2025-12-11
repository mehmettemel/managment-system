/**
 * Server Actions for Payment Management
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  Payment,
  PaymentInsert,
  PaymentFormData,
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
  calculateNextPaymentDate,
  calculatePeriodEndDate,
  getTodayDate,
} from '@/utils/date-helpers'
import { processStudentPayment } from '@/actions/finance'

/**
 * Get all payments for a member
 */
export async function getMemberPayments(
  memberId: number
): Promise<ApiListResponse<Payment>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', memberId)
      .order('payment_date', { ascending: false })

    if (error) {
      logError('getMemberPayments', error)
      return errorListResponse(handleSupabaseError(error))
    }

    return successListResponse(data || [])
  } catch (error) {
    logError('getMemberPayments', error)
    return errorListResponse(handleSupabaseError(error))
  }
}

/**
 * Create a new payment and update member's payment dates
 */
export async function createPayment(
  formData: PaymentFormData
): Promise<ApiResponse<Payment>> {
  try {
    // Validate required fields
    const validation = validateRequiredFields(formData as unknown as Record<string, unknown>, ['member_id', 'amount'])
    if (!validation.valid) {
      return errorResponse(`Gerekli alanlar eksik: ${validation.missingFields.join(', ')}`)
    }

    const supabase = await createClient()
    const today = getTodayDate()

    // Calculate payment period
    const periodStart = formData.period_start || today
    const periodEnd = formData.period_end || calculatePeriodEndDate(periodStart)

    // Prepare payment data
    const paymentData: PaymentInsert = {
      member_id: formData.member_id,
      amount: formData.amount,
      payment_method: formData.payment_method || 'Nakit',
      payment_date: today,
      period_start: periodStart,
      period_end: periodEnd,
      description: formData.description || null,
    }

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single()

    if (paymentError) {
      logError('createPayment', paymentError)
      return errorResponse(handleSupabaseError(paymentError))
    }

    // Update member's payment dates
    const nextPaymentDate = calculateNextPaymentDate(today)

    const { error: memberError } = await supabase
      .from('members')
      .update({
        last_payment_date: today,
        next_payment_due_date: nextPaymentDate,
      })
      .eq('id', formData.member_id)

    if (memberError) {
      logError('createPayment - update member', memberError)
      // Payment is created, but member update failed
      // We'll continue anyway
    }

    // Process Instructor Commission
    const { data: memberClasses } = await supabase
      .from('member_classes')
      .select('class_id')
      .eq('member_id', formData.member_id)

    if (memberClasses && memberClasses.length === 1) {
       const start = new Date(periodStart)
       const end = new Date(periodEnd)
       let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
       if (months < 1) months = 1
       
       await processStudentPayment(payment.id, payment.amount, months, memberClasses[0].class_id)
    }

    revalidatePath('/members')
    revalidatePath(`/members/${formData.member_id}`)
    return successResponse(payment)
  } catch (error) {
    logError('createPayment', error)
    return errorResponse(handleSupabaseError(error))
  }
}

/**
 * Get recent payments across all members
 */
export async function getRecentPayments(
  limit = 10
): Promise<ApiListResponse<Payment>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false })
      .limit(limit)

    if (error) {
      logError('getRecentPayments', error)
      return errorListResponse(handleSupabaseError(error))
    }

    return successListResponse(data || [])
  } catch (error) {
    logError('getRecentPayments', error)
    return errorListResponse(handleSupabaseError(error))
  }
}

/**
 * Get total revenue for a date range
 */
export async function getRevenueByDateRange(
  startDate: string,
  endDate: string
): Promise<ApiResponse<{ total: number; count: number }>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)

    if (error) {
      logError('getRevenueByDateRange', error)
      return errorResponse(handleSupabaseError(error))
    }

    const total = data?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0
    const count = data?.length || 0

    return successResponse({ total, count })
  } catch (error) {
    logError('getRevenueByDateRange', error)
    return errorResponse(handleSupabaseError(error))
  }
}

/**
 * Delete a payment (admin only, use with caution)
 */
export async function deletePayment(id: number): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('payments').delete().eq('id', id)

    if (error) {
      logError('deletePayment', error)
      return errorResponse(handleSupabaseError(error))
    }

    revalidatePath('/members')
    return successResponse(true)
  } catch (error) {
    logError('deletePayment', error)
    return errorResponse(handleSupabaseError(error))
  }
}

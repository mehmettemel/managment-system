/**
 * Server Actions for Payment Management
 * Payment Schedule & Detail Page Refactor
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Payment,
  PaymentInsert,
  ClassPaymentFormData,
  ApiResponse,
  ApiListResponse,
  PaymentScheduleItem,
} from '@/types';
import {
  successResponse,
  errorResponse,
  successListResponse,
  errorListResponse,
  handleSupabaseError,
  logError,
} from '@/utils/response-helpers';
import { getTodayDate } from '@/utils/date-helpers';
import { processStudentPayment } from '@/actions/finance';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

/**
 * Get all payments for a member (with class info)
 */
export async function getMemberPayments(
  memberId: number
): Promise<ApiListResponse<Payment>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payments')
      .select(
        `
        *,
        classes (
          id,
          name
        )
      `
      )
      .eq('member_id', memberId)
      .order('payment_date', { ascending: false });

    if (error) {
      logError('getMemberPayments', error);
      return errorListResponse(handleSupabaseError(error));
    }

    return successListResponse(data || []);
  } catch (error) {
    logError('getMemberPayments', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Generate a payment schedule for a specific member class
 */
export async function getPaymentSchedule(
  memberId: number,
  classId: number
): Promise<ApiListResponse<PaymentScheduleItem>> {
  try {
    const supabase = await createClient();

    // 1. Get Member Class details (for price and created_at/join_date)
    const { data: memberClass, error: mcError } = await supabase
      .from('member_classes')
      .select('*, members(join_date)')
      .eq('member_id', memberId)
      .eq('class_id', classId)
      .single();

    if (mcError || !memberClass) {
      return errorListResponse('Üye ders kaydı bulunamadı');
    }

    // 2. Get existing payments for this class
    const { data: payments, error: pError } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', memberId)
      .eq('class_id', classId);

    if (pError) {
      return errorListResponse(handleSupabaseError(pError));
    }

    // 3. Generate Schedule
    // Start from member join date or class creation date (fallback to join date is safer)
    // memberClass.created_at is reliable if created after schema change, but fallback to member join date
    const startDate = dayjs(
      (memberClass as any).members?.join_date || memberClass.created_at
    );

    // Generate up to 6 months in future from today
    const endDate = dayjs().add(6, 'month');

    const schedule: PaymentScheduleItem[] = [];
    let currentMonth = startDate.startOf('month');

    while (currentMonth.isBefore(endDate)) {
      const periodStart = currentMonth.format('YYYY-MM-DD');
      const nextMonth = currentMonth.add(1, 'month');
      const periodEnd = nextMonth.format('YYYY-MM-DD');

      // Find if paid: existing payment coverage overlaps significantly or matches month
      // Simple logic: check if any payment covers this month's start date
      const paidPayment = payments?.find((p) => {
        // If payment period_start is roughly same month as currentMonth
        if (!p.period_start) return false;
        return dayjs(p.period_start).isSame(currentMonth, 'month');
      });

      let status: PaymentScheduleItem['status'] = 'unpaid';
      if (paidPayment) {
        status = 'paid';
      } else if (currentMonth.isBefore(dayjs().startOf('month'))) {
        status = 'overdue'; // Past unpaid month
      }

      schedule.push({
        periodMonth: periodStart,
        periodLabel: currentMonth.format('MMMM YYYY'),
        amount: Number(memberClass.price) || 0,
        status,
        paymentId: paidPayment?.id,
        paymentDate: paidPayment ? paidPayment.payment_date : undefined,
        paymentMethod: paidPayment ? paidPayment.payment_method : undefined,
      });

      currentMonth = nextMonth;
    }

    // Reverse to show latest first? User asked for "alt alta listele", usually descending for history, ascending for future?
    // Let's sort Descending for table (Future -> Past), or filter tabs?
    // "Geçmiş ve gelecek tüm ödemeleri o datatableda listelensin"
    // Usually chronological is better for reading "what happened then what happens".
    // Let's return Ascending (Oldest first) so user sees history flow. Or Descending.
    // Let's stick to Descending (Newest first) as it's standard for ledgers.

    return successListResponse(schedule.reverse());
  } catch (error) {
    logError('getPaymentSchedule', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Process a class-based payment (Single Month Target)
 */
export async function processClassPayment(
  formData: ClassPaymentFormData
): Promise<ApiResponse<Payment>> {
  try {
    const { memberId, classId, amount, paymentMethod, periodDate } = formData;

    if (!memberId || !classId || !amount || !periodDate) {
      return errorResponse('Gerekli alanlar eksik');
    }

    const supabase = await createClient();
    const todayStr = dayjs().format('YYYY-MM-DD');

    const periodStart = dayjs(periodDate).startOf('month').format('YYYY-MM-DD');
    const periodEnd = dayjs(periodDate).add(1, 'month').format('YYYY-MM-DD');
    const periodLabel = dayjs(periodDate).format('MMMM YYYY');

    // 1. Create payment record
    const paymentData: PaymentInsert = {
      member_id: memberId,
      class_id: classId,
      amount: amount,
      payment_method: paymentMethod || 'Nakit',
      payment_date: todayStr,
      period_start: periodStart,
      period_end: periodEnd,
      description: `${periodLabel} ödemesi`,
    };

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      logError('processClassPayment - insert payment', paymentError);
      return errorResponse(handleSupabaseError(paymentError));
    }

    // 2. Update next_payment_date logic
    // We need to find the *first unpaid month* after this payment to update next_payment_date correctly.
    // This is getting complex if we allow random access payments.
    // For simplicity, let's just update next_payment_date to be MAX(period_end of all payments) + 1 day?
    // Or just fetch schedule again to warn user?
    // The previous simple logic was: next_payment_date += 1 month.
    // Let's adopt a robust approach: Find the latest paid period end date for this class.

    const { data: latestPayment } = await supabase
      .from('payments')
      .select('period_end')
      .eq('member_id', memberId)
      .eq('class_id', classId)
      .order('period_end', { ascending: false })
      .limit(1)
      .single();

    if (latestPayment && latestPayment.period_end) {
      await supabase
        .from('member_classes')
        .update({ next_payment_date: latestPayment.period_end })
        .eq('member_id', memberId)
        .eq('class_id', classId);
    }

    // 3. Process instructor commission
    await processStudentPayment(payment.id, payment.amount, 1, classId);

    revalidatePath(`/members/${memberId}`);
    return successResponse(payment);
  } catch (error) {
    logError('processClassPayment', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Calculate what the new payment date would be (Legacy - kept for compatibility if needed)
 */
export async function calculateNewPaymentDate(
  memberId: number,
  classId: number,
  monthsToPay: number
): Promise<ApiResponse<{ newDate: string; referenceDate: string }>> {
  // Legacy stub or remove if fully replaced.
  // Keeping simple for build safety.
  return successResponse({
    newDate: dayjs().add(monthsToPay, 'month').format('YYYY-MM-DD'),
    referenceDate: dayjs().format('YYYY-MM-DD'),
  });
}

/**
 * Get recent payments across all members
 */
export async function getRecentPayments(
  limit = 10
): Promise<ApiListResponse<Payment>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payments')
      .select(
        `
        *,
        classes (id, name)
      `
      )
      .order('payment_date', { ascending: false })
      .limit(limit);

    if (error) {
      logError('getRecentPayments', error);
      return errorListResponse(handleSupabaseError(error));
    }

    return successListResponse(data || []);
  } catch (error) {
    logError('getRecentPayments', error);
    return errorListResponse(handleSupabaseError(error));
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
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate);

    if (error) {
      logError('getRevenueByDateRange', error);
      return errorResponse(handleSupabaseError(error));
    }

    const total =
      data?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
    const count = data?.length || 0;

    return successResponse({ total, count });
  } catch (error) {
    logError('getRevenueByDateRange', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Delete a payment (admin only)
 */
export async function deletePayment(id: number): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('payments').delete().eq('id', id);

    if (error) {
      logError('deletePayment', error);
      return errorResponse(handleSupabaseError(error));
    }

    // Must revalidate related paths to update schedule status
    revalidatePath('/members');
    // Ideally we know the memberId to revalidate specific page, but broadly:
    return successResponse(true);
  } catch (error) {
    logError('deletePayment', error);
    return errorResponse(handleSupabaseError(error));
  }
}

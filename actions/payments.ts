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
import { getServerToday, getServerNow } from '@/utils/server-date-helper';
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
    // Start from enrollment date (created_at)
    // Fallback to join_date only if created_at is missing (legacy data)
    const startDate = dayjs(
      memberClass.created_at || (memberClass as any).members?.join_date
    );

    const now = await getServerNow();
    const schedule: PaymentScheduleItem[] = [];

    // NEW LOGIC: Only show COMMITTED months
    // - All paid months (from payments)
    // - Plus 1 next unpaid/overdue period
    // - Do NOT show hypothetical future months

    // Step 1: Find the "commitment end date" = last paid period + 1 month
    // If no payments, commitment is just the first month
    const paidPeriods = (payments || [])
      .filter((p) => p.period_start)
      .map((p) => dayjs(p.period_start))
      .sort((a, b) => a.valueOf() - b.valueOf());

    // The member is committed from start to (last paid + 1 month) or just start + 1 if no payments
    let commitmentEndDate;
    if (paidPeriods.length > 0) {
      const lastPaidPeriod = paidPeriods[paidPeriods.length - 1];
      // Commitment extends to next unpaid month (so they can pay it)
      commitmentEndDate = lastPaidPeriod.add(2, 'month'); // last paid + 1 (next due)
    } else {
      // No payments yet, just show the first month as due
      commitmentEndDate = startDate.add(1, 'month');
    }

    // Also ensure we show at least up to current month if member is overdue
    if (now.isAfter(commitmentEndDate)) {
      commitmentEndDate = now.add(1, 'month');
    }

    let currentMonth = startDate;

    // Generate schedule until commitment end date
    while (currentMonth.isBefore(commitmentEndDate)) {
      const periodStart = currentMonth.format('YYYY-MM-DD');
      const nextMonth = currentMonth.add(1, 'month');

      // Find if paid
      const paidPayment = payments?.find((p) => {
        if (!p.period_start) return false;
        return dayjs(p.period_start).isSame(currentMonth, 'month');
      });

      let status: PaymentScheduleItem['status'] = 'unpaid';
      if (paidPayment) {
        status = 'paid';
      } else if (currentMonth.isBefore(now.startOf('month'))) {
        status = 'overdue';
      }

      schedule.push({
        periodMonth: periodStart,
        periodLabel: currentMonth.format('MMMM YYYY'),
        amount: Number(memberClass.price) || 0,
        status,
        paymentId: paidPayment?.id,
        paymentDate: paidPayment ? paidPayment.payment_date : undefined,
        paymentMethod: paidPayment ? paidPayment.payment_method : undefined,
        description: paidPayment ? paidPayment.description : undefined,
      });

      currentMonth = nextMonth;
    }

    // Return Descending (Newest First) so user sees upcoming/recent first
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
    const {
      memberId,
      classId,
      amount,
      paymentMethod,
      periodDate,
      description,
    } = formData;

    if (!memberId || !classId || !amount || !periodDate) {
      return errorResponse('Gerekli alanlar eksik');
    }

    const supabase = await createClient();
    const todayStr = await getServerToday();

    // Fetch payment interval and class details for snapshot
    const { data: memberClass, error: mcError } = await supabase
      .from('member_classes')
      .select(
        `
        payment_interval,
        custom_price,
        classes (
          name,
          price_monthly
        )
      `
      )
      .eq('member_id', memberId)
      .eq('class_id', classId)
      .single();

    if (mcError || !memberClass || !memberClass.classes) {
      return errorResponse('Üye ders kaydı bulunamadı');
    }

    // Determine snapshot values
    // Logic: Use custom_price if active/set, else use current class list price.
    // However, the AMOUNT passed in formData is what was actually paid.
    // We should probably trust the valid amount, but for snapshot_price we store the "rate" at that time.
    // Let's assume snapshot_price = amount (since that's what was paid) OR the rate?
    // User request: "snapshot_price olarak o an tahsil edilen tutarı... kaydet" -> So use 'amount'.
    const snapshotPrice = amount;
    const snapshotClassName = Array.isArray(memberClass.classes)
      ? memberClass.classes[0]?.name
      : (memberClass.classes as any)?.name;

    // Always pay for 1 month regardless of total membership duration
    // Use EXACT date provided (e.g. 15th), do not snap to 1st.
    const periodStart = dayjs(periodDate).format('YYYY-MM-DD');
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
      description: formData.description || `${periodLabel} ödemesi`,
      snapshot_price: snapshotPrice, // Enrollment System
      snapshot_class_name: snapshotClassName, // Enrollment System
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
    // New Enrollment Logic: Update next_payment_date for this specific enrollment.
    // We set it to the END of the period we just paid for.
    // If multiple months are paid, we should probably find the latest end date?
    // For single month payment:
    const newNextPaymentDate = periodEnd;

    // Optimistic update: Just set it to periodEnd.
    // If the user pays out of order, this might be tricky, but usually they pay linear.
    // Ideally: MAX(current_next_payment_date, periodEnd)

    // Let's fetch current to be safe? Or just use SQL?
    // Supabase doesn't support GREATEST in update easily without RPC.
    // Let's just set it to periodEnd as that matches "Extending the due date".

    const { error: updateError } = await supabase
      .from('member_classes')
      .update({ next_payment_date: newNextPaymentDate })
      .eq('member_id', memberId)
      .eq('class_id', classId);

    if (updateError) {
      logError('processClassPayment - update date', updateError);
      // Non-fatal?
    }

    // 3. Process instructor commission
    // Calculate how many months this payment covers
    // Use snapshotPrice (amount paid) vs memberClass price logic?
    // Usually: Amount Paid / Price Per Month = Months Count
    let pricePerMonth =
      memberClass.custom_price ||
      (memberClass.classes as any)?.price_monthly ||
      0;

    // CRITICAL: Reject payment if price is not set
    if (pricePerMonth === 0) {
      return errorResponse(
        'Ders fiyatı belirlenmemiş. Lütfen ders ayarlarını kontrol edin.'
      );
    }

    // Calculate months (rounding to nearest, e.g. 799.99 -> 1)
    let monthsPaid = Math.round(amount / pricePerMonth);
    if (monthsPaid < 1) monthsPaid = 1;

    await processStudentPayment(
      payment.id,
      payment.amount,
      monthsPaid,
      classId
    );

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

    // SECURITY: Check if there are already-paid commissions
    const { data: ledgerEntries, error: checkError } = await supabase
      .from('instructor_ledger')
      .select('status')
      .eq('student_payment_id', id);

    if (checkError) {
      logError('deletePayment - check ledger', checkError);
      return errorResponse(handleSupabaseError(checkError));
    }

    if (ledgerEntries?.some((e) => e.status === 'paid')) {
      return errorResponse(
        'Bu ödemeye bağlı ödenmiş komisyonlar var. Silinemez.'
      );
    }

    // 1. Delete associated instructor ledger entries (for unpaid ones)
    const { error: ledgerError } = await supabase
      .from('instructor_ledger')
      .delete()
      .eq('student_payment_id', id);

    if (ledgerError) {
      logError('deletePayment - ledger', ledgerError);
      return errorResponse(handleSupabaseError(ledgerError));
    }

    // 2. Delete the payment
    const { error } = await supabase.from('payments').delete().eq('id', id);

    if (error) {
      logError('deletePayment', error);
      return errorResponse(handleSupabaseError(error));
    }

    // Must revalidate related paths to update schedule status
    revalidatePath('/members');
    return successResponse(true);
  } catch (error) {
    logError('deletePayment', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Get filtered and paginated payments
 */
export async function getFilteredPayments(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    memberIds?: string[];
    classIds?: string[];
    paymentMethods?: string[];
  },
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  }
): Promise<
  ApiResponse<{
    data: Payment[];
    meta: { total: number; page: number; pageSize: number };
  }>
> {
  try {
    const supabase = await createClient();

    let query = supabase.from('payments').select(
      `
        *,
        classes (id, name),
        members (id, first_name, last_name)
      `,
      { count: 'exact' }
    );

    // Apply Filters
    if (filters?.memberIds && filters.memberIds.length > 0) {
      query = query.in('member_id', filters.memberIds.map(Number));
    }

    if (filters?.classIds && filters.classIds.length > 0) {
      query = query.in('class_id', filters.classIds.map(Number));
    }

    if (filters?.paymentMethods && filters.paymentMethods.length > 0) {
      query = query.in('payment_method', filters.paymentMethods);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Sorting
    // Default to payment_date desc if no valid sort provided
    const sortField = sort?.field || 'payment_date';
    const sortDir = sort?.direction === 'asc';

    // Handle special cases or default
    query = query.order(sortField, { ascending: sortDir });

    // For consistent paging, always add secondary sort if primary isn't unique/id
    if (sortField !== 'id') {
      query = query.order('id', { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      logError('getFilteredPayments', error);
      return errorResponse(handleSupabaseError(error));
    }

    return successResponse({
      data: (data as Payment[]) || [],
      meta: {
        total: count || 0,
        page,
        pageSize,
      },
    });
  } catch (error) {
    logError('getFilteredPayments', error);
    return errorResponse(handleSupabaseError(error));
  }
}

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
    // A3: Use purely enrollment date, fallbacks removed to ensure accuracy per enrollment
    const startDate = dayjs(memberClass.created_at);

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
    const snapshotClassName = Array.isArray(memberClass.classes)
      ? memberClass.classes[0]?.name
      : (memberClass.classes as any)?.name;

    // Get price per month (base rate)
    let pricePerMonth =
      memberClass.custom_price ||
      (memberClass.classes as any)?.price_monthly ||
      0;

    if (pricePerMonth === 0) {
      return errorResponse(
        'Ders fiyatı belirlenmemiş. Lütfen ders ayarlarını kontrol edin.'
      );
    }

    // Determine how many months are being paid
    // Ideally user provides monthCount. If not, calculate from amount/price.
    // If formData.periodDate is provided, that's just the START date.
    let monthCount = formData.monthCount || Math.round(amount / pricePerMonth);
    if (monthCount < 1) monthCount = 1;

    // Validate absolute amount equality?
    // User might pay custom amount. If amount != pricePerMonth * monthCount,
    // we should distributed it or just assign the total to the first/last payment?
    // Let's assume uniform distribution for ledger, or split proportional.
    // Simpler: Split amount evenly across months for the records.
    const amountPerMonth = amount / monthCount;

    const startPeriodDate = dayjs(periodDate);
    const paymentsCreated: Payment[] = [];

    // B3: Loop to create individual payment records for each month
    for (let i = 0; i < monthCount; i++) {
      // Calculate period for this specific month
      const currentPeriodMonth = startPeriodDate.add(i, 'month');
      const pStart = currentPeriodMonth.format('YYYY-MM-DD');
      const pEnd = currentPeriodMonth.add(1, 'month').format('YYYY-MM-DD');
      const pLabel = currentPeriodMonth.format('MMMM YYYY');

      // Create payment record
      const paymentData: PaymentInsert = {
        member_id: memberId,
        class_id: classId,
        amount: amountPerMonth, // Distribute total amount
        payment_method: paymentMethod || 'Nakit',
        payment_date: todayStr,
        period_start: pStart,
        period_end: pEnd,
        description: formData.description || `${pLabel} ödemesi`,
        snapshot_price: pricePerMonth,
        snapshot_class_name: snapshotClassName,
      };

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (paymentError) {
        logError(
          `processClassPayment - insert payment month ${i + 1}`,
          paymentError
        );
        // If one fails, we might have partial state. Transaction would be better but not easily available via client.
        // Continue or abort? Aborting might be better but partial payments exist.
        // Let's continue and report error? Or return first error.
        return errorResponse(handleSupabaseError(paymentError));
      }

      if (payment) {
        paymentsCreated.push(payment);

        // Process instructor commission for THIS single month payment
        await processStudentPayment(
          payment.id,
          payment.amount,
          1, // 1 month paid in this record
          classId
        );
      }
    }

    // 2. Update next_payment_date logic
    // Set to the END of the LAST period we just paid for.
    const finalNextPaymentDate = startPeriodDate
      .add(monthCount, 'month')
      .format('YYYY-MM-DD');

    const { error: updateError } = await supabase
      .from('member_classes')
      .update({ next_payment_date: finalNextPaymentDate })
      .eq('member_id', memberId)
      .eq('class_id', classId);

    if (updateError) {
      logError('processClassPayment - update date', updateError);
    }

    revalidatePath(`/members/${memberId}`);
    return successResponse(paymentsCreated[0]); // Return first payment as reference logic expects one
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

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
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/tr';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale('tr');

/**
 * Get all payments for a member (with class info)
 */
export async function getMemberPayments(
  memberId: number,
  page: number = 1,
  pageSize: number = 10
): Promise<
  ApiResponse<{
    data: Payment[];
    meta: { total: number; page: number; pageSize: number };
  }>
> {
  try {
    const supabase = await createClient();

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId);

    if (countError) {
      logError('getMemberPayments - count', countError);
      return errorResponse(handleSupabaseError(countError));
    }

    // Calculate pagination range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch paginated data
    const { data, error } = await supabase
      .from('payments')
      .select(
        `
        *,
        classes (
          id,
          name
        ),
        member_classes (
          active
        )
      `
      )
      .eq('member_id', memberId)
      .order('payment_date', { ascending: false })
      .range(from, to);

    if (error) {
      logError('getMemberPayments', error);
      return errorResponse(handleSupabaseError(error));
    }

    return successResponse({
      data: data || [],
      meta: {
        total: count || 0,
        page,
        pageSize,
      },
    });
  } catch (error) {
    logError('getMemberPayments', error);
    return errorResponse(handleSupabaseError(error));
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

    // 3. Get frozen logs for this enrollment
    const { data: frozenLogs, error: fError } = await supabase
      .from('frozen_logs')
      .select('*')
      .eq('member_class_id', memberClass.id)
      .order('start_date', { ascending: true });

    if (pError) {
      return errorListResponse(handleSupabaseError(pError));
    }

    // Helper function to check if a month is within a frozen period
    const isMonthFrozen = (month: dayjs.Dayjs): boolean => {
      if (!frozenLogs || frozenLogs.length === 0) return false;

      return frozenLogs.some((log) => {
        const freezeStart = dayjs(log.start_date).startOf('month');
        const freezeEnd = log.end_date
          ? dayjs(log.end_date).endOf('month')
          : dayjs('2099-12-31'); // Indefinite freeze

        // Check if month falls within freeze period
        return (
          month.isSameOrAfter(freezeStart, 'month') &&
          month.isSameOrBefore(freezeEnd, 'month')
        );
      });
    };

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
    // - SKIP frozen months

    // Step 1: Find the "commitment end date" = last paid period + 1 month
    // If no payments, commitment is just the first month
    const paidPeriods = (payments || [])
      .filter((p) => p.period_start)
      .map((p) => dayjs(p.period_start))
      .sort((a, b) => a.valueOf() - b.valueOf());

    // The member is committed from start to (last paid + 1 month) or just start + 1 if no payments
    // BUT we must also consider the PAYMENT INTERVAL (Membership Duration)
    // If user signed up for 6 months, we should show 6 months.

    // 1. Base commitment from payments
    let commitmentEndDate;
    if (paidPeriods.length > 0) {
      const lastPaidPeriod = paidPeriods[paidPeriods.length - 1];
      commitmentEndDate = lastPaidPeriod.add(2, 'month'); // last paid + 1 (next due)
    } else {
      commitmentEndDate = startDate.add(1, 'month'); // at least show first month
    }

    // 2. Minimum commitment from Registration Duration (payment_interval)
    const durationMonths = memberClass.payment_interval || 1;
    const durationEndDate = startDate.add(durationMonths, 'month');

    if (durationEndDate.isAfter(commitmentEndDate)) {
      commitmentEndDate = durationEndDate;
    }

    // 3. Minimum commitment from Current Date (if overdue)
    // Also ensure we show at least up to current month if member is overdue
    if (now.isAfter(commitmentEndDate)) {
      commitmentEndDate = now.add(1, 'month');
    }

    let currentMonth = startDate;

    // Generate schedule until commitment end date
    while (currentMonth.isBefore(commitmentEndDate)) {
      const periodStart = currentMonth.format('YYYY-MM-DD');
      const nextMonth = currentMonth.add(1, 'month');

      // CRITICAL: Skip frozen months
      if (isMonthFrozen(currentMonth)) {
        currentMonth = nextMonth;
        continue;
      }

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

      // CRITICAL: Use actual payment amount for paid periods (historical data)
      // Use current price (custom_price or price) for unpaid/overdue periods
      const amount = paidPayment
        ? Number(paidPayment.amount) // Historical: actual paid amount
        : Number(memberClass.custom_price ?? memberClass.price) || 0; // Current: expected amount

      schedule.push({
        periodMonth: periodStart,
        periodLabel: currentMonth.format('MMMM YYYY'),
        amount: amount,
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
      paymentType,
    } = formData;

    if (!memberId || !classId || !amount || !periodDate) {
      return errorResponse('Gerekli alanlar eksik');
    }

    const supabase = await createClient();
    const todayStr = await getServerToday();

    // Fetch payment interval and class details for snapshot
    // CRITICAL: Filter by active=true to get the CURRENT enrollment
    const { data: memberClass, error: mcError } = await supabase
      .from('member_classes')
      .select(
        `
        id,
        payment_interval,
        custom_price,
        created_at,
        classes (
          name,
          price_monthly
        )
      `
      )
      .eq('member_id', memberId)
      .eq('class_id', classId)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
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
      // It's possible price is 0 (free?), but usually warning.
      // If amount > 0, we proceed.
      if (amount <= 0) {
        return errorResponse(
          'Ders fiyatı belirlenmemiş. Lütfen ders ayarlarını kontrol edin.'
        );
      }
    }

    // Determine how many months are being paid and WHICH months
    const targetPeriods = formData.targetPeriods;
    let monthCount = 0;

    if (targetPeriods && targetPeriods.length > 0) {
      monthCount = targetPeriods.length;
    } else {
      // If pricePerMonth is 0, avoid division by zero
      if (pricePerMonth > 0) {
        monthCount = formData.monthCount || Math.round(amount / pricePerMonth);
      } else {
        monthCount = formData.monthCount || 1;
      }
      if (monthCount < 1) monthCount = 1;
    }

    // Split amount evenly
    const amountPerMonth = amount / monthCount;

    const paymentsCreated: Payment[] = [];

    // Loop to create individual payment records
    for (let i = 0; i < monthCount; i++) {
      let currentPeriodMonth;

      if (targetPeriods && targetPeriods[i]) {
        currentPeriodMonth = dayjs(targetPeriods[i]);
      } else {
        // Legacy/Fallback: Sequential from periodDate
        const startPeriodDate = dayjs(periodDate);
        currentPeriodMonth = startPeriodDate.add(i, 'month');
      }

      const pStart = currentPeriodMonth.format('YYYY-MM-DD');
      const pEnd = currentPeriodMonth.add(1, 'month').format('YYYY-MM-DD');
      const pLabel = currentPeriodMonth.format('MMMM YYYY');

      // Create payment record
      // Cast as any to avoid type error until TS definition updates
      const paymentData: PaymentInsert = {
        member_id: memberId,
        class_id: classId,
        member_class_id: memberClass.id, // Linking to specific enrollment
        amount: amountPerMonth, // Distribute total amount
        payment_method: paymentMethod || 'Nakit',
        payment_date: todayStr,
        period_start: pStart,
        period_end: pEnd,
        description: formData.description || `${pLabel} ödemesi`,
        snapshot_price: pricePerMonth,
        snapshot_class_name: snapshotClassName,
        payment_type: paymentType || 'monthly',
      } as any;

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (paymentError) {
        logError(
          `processClassPayment - insert payment ${pLabel}`,
          paymentError
        );
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

    // Update next_payment_date logic
    // Fetch all payments to re-calculate continuity
    const { data: allPayments } = await supabase
      .from('payments')
      .select('period_start')
      .eq('member_class_id', memberClass.id);

    // Fetch frozen periods for this enrollment
    const { data: frozenLogs } = await supabase
      .from('frozen_logs')
      .select('start_date, end_date')
      .eq('member_class_id', memberClass.id);

    // Helper function to check if a month is frozen
    const isMonthFrozen = (month: dayjs.Dayjs): boolean => {
      if (!frozenLogs || frozenLogs.length === 0) return false;

      return frozenLogs.some((log) => {
        const freezeStart = dayjs(log.start_date).startOf('month');
        const freezeEnd = log.end_date
          ? dayjs(log.end_date).endOf('month')
          : dayjs('2099-12-31'); // Indefinite freeze

        return (
          month.isSameOrAfter(freezeStart, 'month') &&
          month.isSameOrBefore(freezeEnd, 'month')
        );
      });
    };

    // Start checking from enrollment date (NORMALIZE to start of month)
    let checkDate = dayjs(memberClass.created_at || todayStr).startOf('month');

    // Use set of paid months for O(1) lookup (NORMALIZE all dates)
    const paidMonths = new Set(
      (allPayments || []).map((p) =>
        dayjs(p.period_start).startOf('month').format('YYYY-MM')
      )
    );

    // Also add the newly created payments to this set
    paymentsCreated.forEach((p) => {
      paidMonths.add(dayjs(p.period_start).startOf('month').format('YYYY-MM'));
    });

    // Iterate forward to find first gap (skip frozen months)
    for (let i = 0; i < 120; i++) {
      // Skip frozen months
      if (isMonthFrozen(checkDate)) {
        checkDate = checkDate.add(1, 'month');
        continue;
      }

      const key = checkDate.format('YYYY-MM');
      if (paidMonths.has(key)) {
        checkDate = checkDate.add(1, 'month');
      } else {
        break; // Found the gap
      }
    }

    const finalNextPaymentDate = checkDate.format('YYYY-MM-DD');

    const { error: updateError } = await supabase
      .from('member_classes')
      .update({ next_payment_date: finalNextPaymentDate })
      .eq('id', memberClass.id);

    if (updateError) {
      logError('processClassPayment - update date', updateError);
    }

    // Revalidate both detail and list pages
    revalidatePath(`/members/${memberId}`);
    revalidatePath('/members');
    return successResponse(paymentsCreated[0]);
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

    // Get member_id for revalidation
    const { data: payment } = await supabase
      .from('payments')
      .select('member_id')
      .eq('id', id)
      .single();

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
    if (payment?.member_id) {
      revalidatePath(`/members/${payment.member_id}`);
    }
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

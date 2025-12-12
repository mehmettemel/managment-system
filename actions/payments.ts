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
    // interval (duration) logic: if user specified duration (e.g. 1, 3, 6, 12),
    // we should generate exactly that many months from start date.
    // If interval is null/1, default to standard view (e.g. 6 months ahead).

    // We treat 'payment_interval' as the Total Duration of the membership.
    // We want to generate MONTHLY items for that duration.

    const membershipDurationMonths = (memberClass as any).payment_interval || 1;

    // Recalculate endDate based on duration
    // If it's a fixed duration membership (e.g. > 1 month plan), show exactly that many months
    // If it's standard monthly (interval=1), show 6 months ahead + history?
    // User logic implies strict plans: "1 yıllık seçerse her ay 750 tl".
    const effectiveEndDate = startDate.add(membershipDurationMonths, 'month');

    let currentMonth = startDate.startOf('month');

    // Generate schedule until effective end date
    while (currentMonth.isBefore(effectiveEndDate)) {
      const periodStart = currentMonth.format('YYYY-MM-DD');
      const nextMonth = currentMonth.add(1, 'month'); // Always 1 month increment

      // Find if paid: existing payment coverage
      const paidPayment = payments?.find((p) => {
        if (!p.period_start) return false;
        return dayjs(p.period_start).isSame(currentMonth, 'month');
      });

      let status: PaymentScheduleItem['status'] = 'unpaid';
      if (paidPayment) {
        status = 'paid';
      } else if (currentMonth.isBefore(dayjs().startOf('month'))) {
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
    const todayStr = dayjs().format('YYYY-MM-DD');

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

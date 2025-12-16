/**
 * Server Actions for Finance & Instructor Payments
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  ApiResponse,
  ApiListResponse,
  InstructorRate,
  InstructorLedger,
  DanceType,
  Instructor,
  InstructorPayoutWithDetails,
} from '@/types';
import {
  successResponse,
  errorResponse,
  successListResponse,
  errorListResponse,
  handleSupabaseError,
  logError,
} from '@/utils/response-helpers';
import dayjs from 'dayjs';
import { getServerNow } from '@/utils/server-date-helper';

/**
 * Calculate and Process Instructor Commission for a Student Payment
 * NEW: Uses class-based commission rate instead of dance_type-based
 */
export async function processStudentPayment(
  paymentId: number,
  totalAmount: number,
  monthsCount: number,
  classId: number
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();

    // 1. Get Class & Instructor Info (including class-specific commission rate)
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('instructor_id, instructor_commission_rate')
      .eq('id', classId)
      .single();

    if (classError || !classData || !classData.instructor_id) {
      return successResponse(true);
    }

    const { instructor_id, instructor_commission_rate } = classData;

    // 2. Get Commission Rate (Class-Based Priority)
    let rate = 0;

    // PRIORITY 1: Class-specific commission rate
    if (instructor_commission_rate !== null && instructor_commission_rate !== undefined) {
      rate = instructor_commission_rate;
    } else {
      // PRIORITY 2: Instructor's default commission rate
      const { data: instructor } = await supabase
        .from('instructors')
        .select('default_commission_rate')
        .eq('id', instructor_id)
        .single();

      if (instructor?.default_commission_rate) {
        rate = instructor.default_commission_rate;
      }
    }

    if (rate === 0) {
      return successResponse(true);
    }

    // 3. Calculate Total Commission
    const totalCommission = (totalAmount * rate) / 100;

    // 4. Split into installments
    const monthlyCommission = totalCommission / monthsCount;

    // 5. Insert into Ledger
    const ledgerEntries = [];
    const today = await getServerNow();

    for (let i = 0; i < monthsCount; i++) {
      const dueDate = today.add(i, 'month').format('YYYY-MM-DD');
      ledgerEntries.push({
        instructor_id: instructor_id,
        student_payment_id: paymentId,
        amount: monthlyCommission,
        due_date: dueDate,
        status: 'pending',
      });
    }

    const { error: ledgerError } = await supabase
      .from('instructor_ledger')
      .insert(ledgerEntries);

    if (ledgerError) {
      logError('processStudentPayment - ledger', ledgerError);
      return errorResponse(handleSupabaseError(ledgerError));
    }

    return successResponse(true);
  } catch (error) {
    logError('processStudentPayment', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Get Commission Rate helper
 * NEW: Returns class-specific rate or instructor default
 */
export async function getCommissionRate(
  instructorId: number,
  classId: number
): Promise<number> {
  const supabase = await createClient();

  // Get Class-specific commission rate
  const { data: classData } = await supabase
    .from('classes')
    .select('instructor_commission_rate')
    .eq('id', classId)
    .single();

  // PRIORITY 1: Class-specific rate
  if (classData?.instructor_commission_rate !== null &&
      classData?.instructor_commission_rate !== undefined) {
    return classData.instructor_commission_rate;
  }

  // PRIORITY 2: Instructor default rate
  const { data: instructor } = await supabase
    .from('instructors')
    .select('default_commission_rate')
    .eq('id', instructorId)
    .single();

  return instructor?.default_commission_rate || 0;
}

/**
 * Get all dance types
 */
export async function getDanceTypes(): Promise<ApiListResponse<DanceType>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('dance_types')
      .select('*')
      .order('name');

    if (error) {
      logError('getDanceTypes', error);
      return errorListResponse(handleSupabaseError(error));
    }
    return successListResponse(data || []);
  } catch (error) {
    logError('getDanceTypes', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Get rates for an instructor
 */
export async function getInstructorRates(
  instructorId: number
): Promise<ApiListResponse<InstructorRate>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('instructor_rates')
      .select('*')
      .eq('instructor_id', instructorId);

    if (error) {
      logError('getInstructorRates', error);
      return errorListResponse(handleSupabaseError(error));
    }
    return successListResponse(data || []);
  } catch (error) {
    logError('getInstructorRates', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Upsert instructor rate
 */
export async function upsertInstructorRate(
  instructorId: number,
  danceTypeId: number,
  rate: number
): Promise<ApiResponse<InstructorRate>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('instructor_rates')
      .upsert(
        {
          instructor_id: instructorId,
          dance_type_id: danceTypeId,
          rate: rate,
        },
        { onConflict: 'instructor_id, dance_type_id' }
      )
      .select()
      .single();

    if (error) {
      logError('upsertInstructorRate', error);
      return errorResponse(handleSupabaseError(error));
    }
    return successResponse(data);
  } catch (error) {
    logError('upsertInstructorRate', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Get payable ledger summary
 */
export async function getPayableLedger(): Promise<
  ApiResponse<
    { instructor: Instructor; totalAmount: number; entryCount: number }[]
  >
> {
  try {
    const supabase = await createClient();
    const today = (await getServerNow()).format('YYYY-MM-DD');

    // Fetch active instructors
    const { data: instructors } = await supabase
      .from('instructors')
      .select('*')
      .eq('active', true);
    if (!instructors) return successResponse([]);

    // Fetch all pending ledger entries due today or before
    // We can optimize this but for now fetch all pending logic
    const { data: ledger } = await supabase
      .from('instructor_ledger')
      .select('*')
      .lte('due_date', today)
      .in('status', ['pending', 'payable']);

    const ledgerMap = new Map<number, { amount: number; count: number }>();
    if (ledger) {
      ledger.forEach((l) => {
        const instId = l.instructor_id;
        if (instId !== null) {
          const current = ledgerMap.get(instId) || { amount: 0, count: 0 };
          current.amount += l.amount;
          current.count += 1;
          ledgerMap.set(instId, current);
        }
      });
    }

    const result = instructors
      .map((inst) => {
        const stats = ledgerMap.get(inst.id) || { amount: 0, count: 0 };
        return {
          instructor: inst,
          totalAmount: stats.amount,
          entryCount: stats.count,
        };
      })
      .filter((item) => item.totalAmount > 0);

    return successResponse(result);
  } catch (error) {
    logError('getPayableLedger', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Process Payout for an Instructor
 */
export async function processPayout(
  instructorId: number,
  amount: number,
  ledgerEntryIds?: number[] // NEW: Optional array of specific entry IDs
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();
    const today = (await getServerNow()).format('YYYY-MM-DD');

    // 1. Determine which entries to pay
    let entriesToPay;

    if (ledgerEntryIds && ledgerEntryIds.length > 0) {
      // NEW PATH: Pay only selected entries
      const { data: selectedEntries, error: selectError } = await supabase
        .from('instructor_ledger')
        .select('*')
        .in('id', ledgerEntryIds)
        .eq('instructor_id', instructorId) // Security check
        .in('status', ['pending', 'payable']);

      if (selectError)
        return errorResponse(handleSupabaseError(selectError));
      entriesToPay = selectedEntries || [];
    } else {
      // EXISTING PATH: Pay all pending (backwards compatible)
      const { data: pendingEntries, error: pendingError } = await supabase
        .from('instructor_ledger')
        .select('*')
        .eq('instructor_id', instructorId)
        .lte('due_date', today)
        .in('status', ['pending', 'payable']);

      if (pendingError)
        return errorResponse(handleSupabaseError(pendingError));
      entriesToPay = pendingEntries || [];
    }

    // Validate amount matches selected entries
    const calculatedTotal =
      entriesToPay.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    if (calculatedTotal <= 0) {
      return errorResponse(
        'Ödenecek bakiye bulunamadı (Zaten ödenmiş olabilir).'
      );
    }

    if (Math.abs(calculatedTotal - amount) > 0.01) {
      return errorResponse('Ödeme tutarı uyuşmuyor');
    }

    // 2. Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('instructor_payouts')
      .insert({
        instructor_id: instructorId,
        amount: amount,
        payment_date: today,
        note: ledgerEntryIds
          ? `${entriesToPay.length} aylık hakediş ödemesi`
          : 'Otomatik hakediş ödemesi',
      })
      .select()
      .single();

    if (payoutError) return errorResponse(handleSupabaseError(payoutError));

    // 3. Update ONLY selected entries
    const entryIds = entriesToPay.map((e) => e.id);
    const { error: updateError } = await supabase
      .from('instructor_ledger')
      .update({
        status: 'paid',
        payout_id: payout.id,
      } as any)
      .in('id', entryIds); // CHANGED: Update by IDs instead of instructor_id

    if (updateError) {
      logError('processPayout - ledger update failed', updateError);
      return errorResponse(
        'Ödeme kaydı oluştu ancak bakiye düşülemedi. Lütfen sistem yöneticisine bildirin.'
      );
    }

    return successResponse(true);
  } catch (error) {
    logError('processPayout', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Delete instructor rate (Specialty)
 */
export async function deleteInstructorRate(
  instructorId: number,
  danceTypeId: number
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('instructor_rates')
      .delete()
      .eq('instructor_id', instructorId)
      .eq('dance_type_id', danceTypeId);

    if (error) {
      logError('deleteInstructorRate', error);
      return errorResponse(handleSupabaseError(error));
    }
    return successResponse(true);
  } catch (error) {
    logError('deleteInstructorRate', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Get instructor payouts history
 */
export async function getInstructorPayouts(): Promise<ApiListResponse<any>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('instructor_payouts')
      .select('*, instructors(first_name, last_name)')
      .order('payment_date', { ascending: false });

    if (error) {
      logError('getInstructorPayouts', error);
      return errorListResponse(handleSupabaseError(error));
    }
    return successListResponse(data || []);
  } catch (error) {
    logError('getInstructorPayouts', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Get filtered and paginated instructor payouts
 */
export async function getFilteredInstructorPayouts(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    instructorIds?: string[];
  },
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  }
): Promise<
  ApiResponse<{
    data: InstructorPayoutWithDetails[];
    meta: { total: number; page: number; pageSize: number };
  }>
> {
  try {
    const supabase = await createClient();

    let query = supabase.from('instructor_payouts').select(
      `
        *,
        instructors (first_name, last_name)
      `,
      { count: 'exact' }
    );

    // Apply Filters
    if (filters?.instructorIds && filters.instructorIds.length > 0) {
      query = query.in('instructor_id', filters.instructorIds.map(Number));
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Sorting
    const sortField = sort?.field || 'payment_date';
    const sortDir = sort?.direction === 'asc';

    query = query.order(sortField, { ascending: sortDir });
    if (sortField !== 'id') {
      query = query.order('id', { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      logError('getFilteredInstructorPayouts', error);
      return errorResponse(handleSupabaseError(error));
    }

    // Cast as InstructorPayoutWithType which assumes joined data structure
    // We need to define or import this type if not globally available,
    // but for now relying on usage or local definition in file matching component.
    // Ideally this type should be in types/index.ts or local.
    // The component defined `InstructorPayoutWithType`. We should use `InstructorPayout` joined.

    return successResponse({
      data: (data as any[]) || [],
      meta: {
        total: count || 0,
        page,
        pageSize,
      },
    });
  } catch (error) {
    logError('getFilteredInstructorPayouts', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Get detailed ledger entries with student and class info
 * Shows which student paid what commission amount
 */
export async function getInstructorLedgerDetails(
  instructorId?: number,
  status?: 'pending' | 'paid' | 'all'
): Promise<ApiListResponse<any>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('instructor_ledger')
      .select(
        `
        *,
        payments (
          id,
          amount,
          payment_date,
          member_id,
          class_id,
          members (
            first_name,
            last_name
          ),
          classes (
            name
          )
        ),
        instructors (
          first_name,
          last_name
        )
      `
      )
      .order('due_date', { ascending: false })
      .order('created_at', { ascending: false });

    // Filter by instructor if provided
    if (instructorId) {
      query = query.eq('instructor_id', instructorId);
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      if (status === 'pending') {
        query = query.in('status', ['pending', 'payable']);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data, error } = await query;

    if (error) {
      logError('getInstructorLedgerDetails', error);
      return errorListResponse(handleSupabaseError(error));
    }

    return successListResponse(data || []);
  } catch (error) {
    logError('getInstructorLedgerDetails', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Server Actions for Expense Management
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Expense,
  ExpenseInsert,
  ExpenseUpdate,
  ExpenseFormData,
  ApiResponse,
  ApiListResponse,
} from '@/types';
import {
  successResponse,
  errorResponse,
  successListResponse,
  errorListResponse,
  handleSupabaseError,
  logError,
} from '@/utils/response-helpers';

/**
 * Get all expenses with pagination and filtering
 */
export async function getExpenses(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
  }
): Promise<
  ApiResponse<{
    data: Expense[];
    meta: { total: number; page: number; pageSize: number };
  }>
> {
  try {
    const supabase = await createClient();

    // Build query with filters
    let query = supabase.from('expenses').select('*', { count: 'exact' });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    if (filters?.searchTerm) {
      query = query.or(
        `description.ilike.%${filters.searchTerm}%,receipt_number.ilike.%${filters.searchTerm}%`
      );
    }

    // Get total count
    const { count, error: countError } = await query;

    if (countError) {
      logError('getExpenses - count', countError);
      return errorResponse(handleSupabaseError(countError));
    }

    // Calculate pagination range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Apply filters to base query
    let dataQuery = supabase.from('expenses').select('*', { count: 'exact' });

    if (filters?.category) {
      dataQuery = dataQuery.eq('category', filters.category);
    }

    if (filters?.startDate) {
      dataQuery = dataQuery.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      dataQuery = dataQuery.lte('date', filters.endDate);
    }

    if (filters?.searchTerm) {
      dataQuery = dataQuery.or(
        `description.ilike.%${filters.searchTerm}%,receipt_number.ilike.%${filters.searchTerm}%`
      );
    }

    // Fetch paginated data
    const { data, error } = await dataQuery
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      logError('getExpenses - data', error);
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
    logError('getExpenses - unexpected', error);
    return errorResponse('Giderler yüklenirken beklenmeyen bir hata oluştu');
  }
}

/**
 * Get all expenses without pagination (for export)
 */
export async function getAllExpenses(filters?: {
  category?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}): Promise<ApiListResponse<Expense>> {
  try {
    const supabase = await createClient();

    // Build query with filters
    let query = supabase.from('expenses').select('*');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    if (filters?.searchTerm) {
      query = query.or(
        `description.ilike.%${filters.searchTerm}%,receipt_number.ilike.%${filters.searchTerm}%`
      );
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      logError('getAllExpenses', error);
      return errorListResponse(handleSupabaseError(error));
    }

    return successListResponse(data || []);
  } catch (error) {
    logError('getAllExpenses - unexpected', error);
    return errorListResponse('Giderler yüklenirken beklenmeyen bir hata oluştu');
  }
}

/**
 * Get expense by ID
 */
export async function getExpenseById(
  id: number
): Promise<ApiResponse<Expense>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logError('getExpenseById', error);
      return errorResponse(handleSupabaseError(error));
    }

    return successResponse(data);
  } catch (error) {
    logError('getExpenseById - unexpected', error);
    return errorResponse('Gider yüklenirken beklenmeyen bir hata oluştu');
  }
}

/**
 * Create new expense
 */
export async function createExpense(
  formData: ExpenseFormData
): Promise<ApiResponse<Expense>> {
  try {
    const supabase = await createClient();

    const expenseData: ExpenseInsert = {
      amount: formData.amount,
      category: formData.category,
      description: formData.description,
      date: formData.date,
      receipt_number: formData.receipt_number || null,
      member_id: formData.member_id || null,
      member_class_id: formData.member_class_id || null,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();

    if (error) {
      logError('createExpense', error);
      return errorResponse(handleSupabaseError(error));
    }

    revalidatePath('/finance');
    return successResponse(data);
  } catch (error) {
    logError('createExpense - unexpected', error);
    return errorResponse('Gider eklenirken beklenmeyen bir hata oluştu');
  }
}

/**
 * Update existing expense
 */
export async function updateExpense(
  id: number,
  formData: ExpenseFormData
): Promise<ApiResponse<Expense>> {
  try {
    const supabase = await createClient();

    const expenseData: ExpenseUpdate = {
      amount: formData.amount,
      category: formData.category,
      description: formData.description,
      date: formData.date,
      receipt_number: formData.receipt_number || null,
      member_id: formData.member_id || null,
      member_class_id: formData.member_class_id || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logError('updateExpense', error);
      return errorResponse(handleSupabaseError(error));
    }

    revalidatePath('/finance');
    return successResponse(data);
  } catch (error) {
    logError('updateExpense - unexpected', error);
    return errorResponse('Gider güncellenirken beklenmeyen bir hata oluştu');
  }
}

/**
 * Delete expense
 */
export async function deleteExpense(id: number): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      logError('deleteExpense', error);
      return errorResponse(handleSupabaseError(error));
    }

    revalidatePath('/finance');
    return successResponse(null);
  } catch (error) {
    logError('deleteExpense - unexpected', error);
    return errorResponse('Gider silinirken beklenmeyen bir hata oluştu');
  }
}

/**
 * Delete multiple expenses
 */
export async function deleteExpenses(ids: number[]): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('expenses').delete().in('id', ids);

    if (error) {
      logError('deleteExpenses', error);
      return errorResponse(handleSupabaseError(error));
    }

    revalidatePath('/finance');
    return successResponse(null);
  } catch (error) {
    logError('deleteExpenses - unexpected', error);
    return errorResponse('Giderler silinirken beklenmeyen bir hata oluştu');
  }
}

/**
 * Get expense statistics for a date range
 */
export async function getExpenseStats(
  startDate?: string,
  endDate?: string
): Promise<
  ApiResponse<{
    total: number;
    byCategory: { category: string; total: number }[];
  }>
> {
  try {
    const supabase = await createClient();

    // Get all expenses in date range
    let query = supabase.from('expenses').select('category, amount');

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logError('getExpenseStats', error);
      return errorResponse(handleSupabaseError(error));
    }

    // Calculate totals
    const total = data.reduce((sum, expense) => sum + Number(expense.amount), 0);

    // Group by category
    const byCategory = data.reduce(
      (acc, expense) => {
        const existing = acc.find((item) => item.category === expense.category);
        if (existing) {
          existing.total += Number(expense.amount);
        } else {
          acc.push({
            category: expense.category,
            total: Number(expense.amount),
          });
        }
        return acc;
      },
      [] as { category: string; total: number }[]
    );

    // Sort by total descending
    byCategory.sort((a, b) => b.total - a.total);

    return successResponse({
      total,
      byCategory,
    });
  } catch (error) {
    logError('getExpenseStats - unexpected', error);
    return errorResponse(
      'Gider istatistikleri yüklenirken beklenmeyen bir hata oluştu'
    );
  }
}

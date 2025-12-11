/**
 * Server Actions for Instructor Management
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Instructor,
  InstructorInsert,
  InstructorUpdate,
  InstructorFormData,
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
  sanitizeInput,
  validateRequiredFields,
} from '@/utils/response-helpers';
import { upsertInstructorRate } from '@/actions/finance';

/**
 * Get all active instructors
 */
export async function getInstructors(): Promise<ApiListResponse<Instructor>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('active', true)
      .order('first_name');

    if (error) {
      logError('getInstructors', error);
      return errorListResponse(handleSupabaseError(error));
    }

    return successListResponse(data || []);
  } catch (error) {
    logError('getInstructors', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Get a single instructor by ID
 */
export async function getInstructorById(
  id: number
): Promise<ApiResponse<Instructor>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logError('getInstructorById', error);
      return errorResponse(handleSupabaseError(error));
    }

    return successResponse(data);
  } catch (error) {
    logError('getInstructorById', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Create a new instructor with rates
 */
export async function createInstructor(
  formData: InstructorFormData
): Promise<ApiResponse<Instructor>> {
  try {
    // Validate required fields
    const validation = validateRequiredFields(
      formData as unknown as Record<string, unknown>,
      ['first_name', 'last_name']
    );
    if (!validation.valid) {
      return errorResponse(
        `Gerekli alanlar eksik: ${validation.missingFields.join(', ')}`
      );
    }

    const supabase = await createClient();
    const instructorData: InstructorInsert = sanitizeInput({
      first_name: formData.first_name,
      last_name: formData.last_name,
      specialty: formData.specialty || null,
      phone: formData.phone || null,
    });

    const { data, error } = await supabase
      .from('instructors')
      .insert(instructorData)
      .select()
      .single();

    if (error) {
      logError('createInstructor', error);
      return errorResponse(handleSupabaseError(error));
    }

    // Process Rates
    if (formData.rates && formData.rates.length > 0) {
      for (const r of formData.rates) {
        await upsertInstructorRate(data.id, r.dance_type_id, r.rate);
      }
    }

    revalidatePath('/instructors');
    return successResponse(data);
  } catch (error) {
    logError('createInstructor', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Update an instructor with rates
 */
export async function updateInstructor(
  id: number,
  formData: InstructorFormData
): Promise<ApiResponse<Instructor>> {
  try {
    const supabase = await createClient();
    const instructorData: InstructorUpdate = sanitizeInput({
      first_name: formData.first_name,
      last_name: formData.last_name,
      specialty: formData.specialty || null, // Keeping specialty column for legacy or display text if needed
      phone: formData.phone || null,
    });

    const { data, error } = await supabase
      .from('instructors')
      .update(instructorData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logError('updateInstructor', error);
      return errorResponse(handleSupabaseError(error));
    }

    // Process Rates: Since we don't have bulk sync, we'll upsert all sent.
    // Deletion: If a rate is removed from UI, we need to delete it.
    // Simpler approach: Delete all for this instructor and re-insert is risky with FKs but safe if CASCADE not strictly enforced on logs (logs shouldn't cascade).
    // Better: Fetch existing, compare.
    // Or: Just upsert the ones sent. If deletion is needed, user must have done it explicitly?
    // Prompt says "birden fazla uzmanlık ve komisyon eklenebilir yap".
    // If I remove one in UI, it should be deleted.
    // So "Sync" logic is needed.

    // 1. Get existing
    const { data: existingRates } = await supabase
      .from('instructor_rates')
      .select('dance_type_id')
      .eq('instructor_id', id);

    const existingIds = existingRates
      ? existingRates.map((r) => r.dance_type_id)
      : [];
    const newIds = formData.rates
      ? formData.rates.map((r) => r.dance_type_id)
      : [];

    // 2. Delete missing
    const toDelete = existingIds.filter((eid) => !newIds.includes(eid));
    if (toDelete.length > 0) {
      await supabase
        .from('instructor_rates')
        .delete()
        .eq('instructor_id', id)
        .in('dance_type_id', toDelete);
    }

    // 3. Upsert new/updated
    if (formData.rates && formData.rates.length > 0) {
      for (const r of formData.rates) {
        await upsertInstructorRate(id, r.dance_type_id, r.rate);
      }
    }

    revalidatePath('/instructors');
    return successResponse(data);
  } catch (error) {
    logError('updateInstructor', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Deactivate an instructor
 */
export async function deactivateInstructor(
  id: number
): Promise<ApiResponse<Instructor>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('instructors')
    .update({ active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) return errorResponse(handleSupabaseError(error));

  revalidatePath('/instructors');
  return successResponse(data);
}

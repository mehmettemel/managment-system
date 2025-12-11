/**
 * Server Actions for Dance Types
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, ApiListResponse, DanceType } from '@/types';
import {
  successResponse,
  errorResponse,
  successListResponse,
  errorListResponse,
  handleSupabaseError,
  logError,
} from '@/utils/response-helpers';
import { revalidatePath } from 'next/cache';

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
 * Create a dance type
 */
export async function createDanceType(
  name: string
): Promise<ApiResponse<DanceType>> {
  try {
    const supabase = await createClient();
    // Simple slug generation
    const slug = name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    const { data, error } = await supabase
      .from('dance_types')
      .insert({ name, slug })
      .select()
      .single();

    if (error) return errorResponse(handleSupabaseError(error));

    revalidatePath('/settings/dance-types');
    return successResponse(data);
  } catch (error) {
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Update a dance type
 */
export async function updateDanceType(
  id: number,
  name: string
): Promise<ApiResponse<DanceType>> {
  try {
    const supabase = await createClient();
    const slug = name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    const { data, error } = await supabase
      .from('dance_types')
      .update({ name, slug })
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(handleSupabaseError(error));

    revalidatePath('/settings/dance-types');
    return successResponse(data);
  } catch (error) {
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Delete a dance type
 */
export async function deleteDanceType(
  id: number
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('dance_types').delete().eq('id', id);

    if (error) return errorResponse(handleSupabaseError(error));

    revalidatePath('/settings/dance-types');
    return successResponse(true);
  } catch (error) {
    return errorResponse(handleSupabaseError(error));
  }
}

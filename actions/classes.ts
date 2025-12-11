/**
 * Server Actions for Class Management
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Class,
  ClassInsert,
  ClassUpdate,
  ClassWithInstructor,
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

/**
 * Get all active classes with instructor info
 */
export async function getClasses(): Promise<
  ApiListResponse<ClassWithInstructor>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('classes')
      .select(
        `
        *,
        instructors (*)
      `
      )
      .eq('active', true)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      logError('getClasses', error);
      return errorListResponse(handleSupabaseError(error));
    }

    return successListResponse((data as ClassWithInstructor[]) || []);
  } catch (error) {
    logError('getClasses', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Get a single class by ID
 */
export async function getClassById(
  id: number
): Promise<ApiResponse<ClassWithInstructor>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('classes')
      .select(
        `
        *,
        instructors (*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      logError('getClassById', error);
      return errorResponse(handleSupabaseError(error));
    }

    return successResponse(data as ClassWithInstructor);
  } catch (error) {
    logError('getClassById', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Create a new class
 */
export async function createClass(
  classData: ClassInsert
): Promise<ApiResponse<Class>> {
  try {
    // Validate required fields
    const validation = validateRequiredFields(
      classData as unknown as Record<string, unknown>,
      ['name']
    );
    if (!validation.valid) {
      return errorResponse(
        `Gerekli alanlar eksik: ${validation.missingFields.join(', ')}`
      );
    }

    const supabase = await createClient();
    const sanitizedData = sanitizeInput(classData);

    const { data, error } = await supabase
      .from('classes')
      .insert(sanitizedData)
      .select()
      .single();

    if (error) {
      logError('createClass', error);
      return errorResponse(handleSupabaseError(error));
    }

    revalidatePath('/classes');
    return successResponse(data);
  } catch (error) {
    logError('createClass', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Update a class
 */
export async function updateClass(
  id: number,
  updates: ClassUpdate
): Promise<ApiResponse<Class>> {
  try {
    const supabase = await createClient();
    const sanitizedUpdates = sanitizeInput(updates);

    const { data, error } = await supabase
      .from('classes')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logError('updateClass', error);
      return errorResponse(handleSupabaseError(error));
    }

    revalidatePath('/classes');
    return successResponse(data);
  } catch (error) {
    logError('updateClass', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Deactivate a class
 */
export async function deactivateClass(id: number): Promise<ApiResponse<Class>> {
  return updateClass(id, { active: false });
}

/**
 * Get classes for a specific instructor
 */
export async function getInstructorClasses(
  instructorId: number
): Promise<ApiListResponse<Class>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('active', true);

    if (error) {
      logError('getInstructorClasses', error);
      return errorListResponse(handleSupabaseError(error));
    }

    return successListResponse(data || []);
  } catch (error) {
    logError('getInstructorClasses', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Get members enrolled in a class
 */
export async function getClassMembers(
  classId: number
): Promise<ApiListResponse<any>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('member_classes')
      .select(
        `
        *,
        members (*)
      `
      )
      .eq('class_id', classId);

    if (error) {
      logError('getClassMembers', error);
      return errorListResponse(handleSupabaseError(error));
    }

    // Flatten result to return just members
    const members = data.map((item: any) => item.members).filter(Boolean);
    return successListResponse(members);
  } catch (error) {
    logError('getClassMembers', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

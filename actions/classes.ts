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
        members (*),
        frozen_logs (id, end_date)
      `
      )
      .eq('class_id', classId)
      .eq('active', true);

    if (error) {
      logError('getClassMembers', error);
      return errorListResponse(handleSupabaseError(error));
    }

    // Flatten result to return just members with enrollment_date and status
    const members = data
      .map((item: any) => {
        if (!item.members) return null;

        // Check if frozen
        const isFrozen = item.frozen_logs?.some((log: any) => !log.end_date);

        return {
          ...item.members,
          enrollment_date: item.created_at, // Add enrollment date from member_class
          // Override status for this context if frozen
          status: isFrozen ? 'frozen' : item.members.status,
          // Note: If member is 'active' globally but frozen in this class, we return 'frozen'.
          // If member is 'frozen' globally (all classes), we return 'frozen'.
        };
      })
      .filter(Boolean);

    return successListResponse(members);
  } catch (error) {
    logError('getClassMembers', error);
    return errorListResponse(handleSupabaseError(error));
  }
}

/**
 * Bulk migrate members from one class to another (Scenario B)
 * Moves all active members, preserves their old price as custom_price,
 * copies next_payment_date, and archives the old class.
 */
export async function bulkMigrateClass(
  oldClassId: number,
  newClassId: number
): Promise<ApiResponse<{ migratedCount: number }>> {
  try {
    const supabase = await createClient();

    // 1. Get old class details (to get price for protection)
    const { data: oldClass, error: classError } = await supabase
      .from('classes')
      .select('price_monthly')
      .eq('id', oldClassId)
      .single();

    if (classError || !oldClass) {
      return errorResponse('Eski sınıf bulunamadı');
    }

    // 2. Get all active enrollments in old class
    // We only migrate ACTIVE members.
    const { data: activeEnrollments, error: enrollError } = await supabase
      .from('member_classes')
      .select('*')
      .eq('class_id', oldClassId)
      .eq('active', true);

    if (enrollError) {
      return errorResponse(handleSupabaseError(enrollError));
    }

    if (!activeEnrollments || activeEnrollments.length === 0) {
      // Just archive the class if no members
      await supabase
        .from('classes')
        .update({ archived: true, active: false })
        .eq('id', oldClassId);
      revalidatePath('/classes');
      return successResponse({ migratedCount: 0 });
    }

    // 3. Prepare new enrollments
    // For each active member, create a new record in the new class
    // active = true
    // custom_price = oldClass.price_monthly (Price Protection)
    // next_payment_date = oldRecord.next_payment_date (Date protection)
    const newEnrollments = activeEnrollments.map((enrollment) => ({
      member_id: enrollment.member_id,
      class_id: newClassId,
      active: true,
      custom_price: enrollment.custom_price || oldClass.price_monthly, // Keep existing custom or use old list price
      next_payment_date: enrollment.next_payment_date,
      payment_interval: enrollment.payment_interval,
    }));

    // 4. Transaction-like execution
    // A. Insert new records FIRST
    const { error: insertError } = await supabase
      .from('member_classes')
      .insert(newEnrollments);

    if (insertError) {
      logError('bulkMigrateClass - insert', insertError);
      return errorResponse(handleSupabaseError(insertError));
    }

    // B. Deactivate old records SECOND
    const { error: deactivateError } = await supabase
      .from('member_classes')
      .update({ active: false })
      .eq('class_id', oldClassId);

    if (deactivateError) {
      // Warning: Duplicate active state risk.
      logError('bulkMigrateClass - deactivate members', deactivateError);
    }

    // C. Archive old class LAST
    const { error: archiveError } = await supabase
      .from('classes')
      .update({ archived: true, active: false })
      .eq('id', oldClassId);

    if (archiveError) {
      logError('bulkMigrateClass - archive class', archiveError);
    }

    revalidatePath('/classes');
    revalidatePath('/members');
    return successResponse({ migratedCount: newEnrollments.length });
  } catch (error) {
    logError('bulkMigrateClass', error);
    return errorResponse(handleSupabaseError(error));
  }
}

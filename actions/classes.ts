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
 * Get classes with optional status filter
 * @param status - 'active', 'archived', or 'all'
 */
export async function getClasses(
  status?: string
): Promise<ApiListResponse<ClassWithInstructor>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('classes')
      .select(
        `
        *,
        instructors (*)
      `
      )
      .order('day_of_week')
      .order('start_time');

    // Apply status filter
    if (status === 'archived') {
      query = query.eq('active', false);
    } else if (!status || status === 'active') {
      query = query.eq('active', true);
    }
    // 'all' - no filter

    const { data, error } = await query;

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
      .maybeSingle();

    if (error) {
      logError('getClassById', error);
      return errorResponse(handleSupabaseError(error));
    }

    if (!data) {
      return errorResponse('Ders bulunamadı');
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
  classData: any // Using any temporarily until database types are regenerated
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
 * @param updateExistingPrices - If true, updates price for all active enrollments in this class
 */
export async function updateClass(
  id: number,
  updates: any, // Using any temporarily until database types are regenerated
  updateExistingPrices: boolean = false
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

    // If price changed and updateExistingPrices is true, update all active enrollments
    if (updateExistingPrices && updates.price_monthly !== undefined) {
      const { error: updateError } = await supabase
        .from('member_classes')
        .update({
          price: updates.price_monthly,
          custom_price: updates.price_monthly,
        })
        .eq('class_id', id)
        .eq('active', true);

      if (updateError) {
        logError('updateClass - update enrollments', updateError);
        // Don't fail the whole operation, just log
      }
    }

    revalidatePath('/classes');
    revalidatePath('/members'); // Revalidate members too since prices might have changed
    return successResponse(data);
  } catch (error) {
    logError('updateClass', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Deactivate a class and all its enrollments
 */
export async function deactivateClass(id: number): Promise<ApiResponse<Class>> {
  try {
    const supabase = await createClient();

    // 1. Deactivate all member_classes for this class
    const { error: enrollmentError } = await supabase
      .from('member_classes')
      .update({ active: false })
      .eq('class_id', id);

    if (enrollmentError) {
      logError('deactivateClass - deactivate enrollments', enrollmentError);
      return errorResponse(
        'Ders kayıtları pasife alınamadı: ' +
          handleSupabaseError(enrollmentError)
      );
    }

    // 2. Deactivate the class itself
    const result = await updateClass(id, { active: false });

    revalidatePath('/classes');
    revalidatePath('/members');
    return result;
  } catch (error) {
    logError('deactivateClass', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Reactivate an archived class (does NOT reactivate member_classes)
 */
export async function unarchiveClass(id: number): Promise<ApiResponse<Class>> {
  try {
    const supabase = await createClient();

    // Only reactivate the class, NOT member_classes
    // User can manually re-enroll members if needed
    const result = await updateClass(id, { active: true });

    revalidatePath('/classes');
    revalidatePath('/members');
    return result;
  } catch (error) {
    logError('unarchiveClass', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Permanently delete a class (only if archived)
 */
export async function deleteClass(id: number): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();

    // 1. Check if class is archived
    const { data: classData, error: fetchError } = await supabase
      .from('classes')
      .select('active, name')
      .eq('id', id)
      .single();

    if (fetchError || !classData) {
      return errorResponse('Ders bulunamadı');
    }

    if (classData.active) {
      return errorResponse(
        'Sadece arşivlenmiş dersler kalıcı olarak silinebilir'
      );
    }

    // 2. Check if there are any enrollments (even inactive ones)
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('member_classes')
      .select('id')
      .eq('class_id', id)
      .limit(1);

    if (enrollmentError) {
      logError('deleteClass - check enrollments', enrollmentError);
      return errorResponse(handleSupabaseError(enrollmentError));
    }

    if (enrollments && enrollments.length > 0) {
      return errorResponse(
        'Bu dersin kayıtlı üyeleri var. Önce tüm kayıtları silmeniz gerekiyor.'
      );
    }

    // 3. Delete the class
    const { error: deleteError } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logError('deleteClass', deleteError);
      return errorResponse(handleSupabaseError(deleteError));
    }

    revalidatePath('/classes');
    return successResponse(true);
  } catch (error) {
    logError('deleteClass', error);
    return errorResponse(handleSupabaseError(error));
  }
}

/**
 * Delete multiple classes (only if archived)
 */
export async function deleteClasses(
  ids: number[]
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient();

    // Check all classes are archived
    const { data: classes, error: fetchError } = await supabase
      .from('classes')
      .select('id, active, name')
      .in('id', ids);

    if (fetchError) {
      return errorResponse(handleSupabaseError(fetchError));
    }

    const activeClasses = classes?.filter((c) => c.active) || [];
    if (activeClasses.length > 0) {
      return errorResponse(
        'Bazı dersler hala aktif. Sadece arşivlenmiş dersler silinebilir.'
      );
    }

    // Check enrollments
    const { data: enrollments } = await supabase
      .from('member_classes')
      .select('class_id')
      .in('class_id', ids);

    if (enrollments && enrollments.length > 0) {
      return errorResponse(
        'Seçilen derslerden bazılarının kayıtlı üyeleri var.'
      );
    }

    // Delete all classes
    const { error: deleteError } = await supabase
      .from('classes')
      .delete()
      .in('id', ids);

    if (deleteError) {
      logError('deleteClasses', deleteError);
      return errorResponse(handleSupabaseError(deleteError));
    }

    revalidatePath('/classes');
    return successResponse(true);
  } catch (error) {
    logError('deleteClasses', error);
    return errorResponse(handleSupabaseError(error));
  }
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

    // First, get all member_classes for this class
    const { data, error } = await supabase
      .from('member_classes')
      .select(
        `
        *,
        members (*),
        payments!member_class_id (payment_date)
      `
      )
      .eq('class_id', classId)
      .eq('active', true);

    if (error) {
      logError('getClassMembers', error);
      return errorListResponse(handleSupabaseError(error));
    }

    // Get enrollment IDs
    const enrollmentIds = data.map((item: any) => item.id);

    // Fetch active frozen logs for these enrollments
    const { data: frozenLogs, error: frozenError } = await supabase
      .from('frozen_logs')
      .select('member_class_id')
      .in('member_class_id', enrollmentIds)
      .is('end_date', null);

    if (frozenError) {
      logError('getClassMembers - frozen_logs', frozenError);
      // Continue without frozen logs rather than failing
    }

    // Create a set of frozen enrollment IDs for quick lookup
    const frozenEnrollmentIds = new Set(
      frozenLogs?.map((log: any) => log.member_class_id) || []
    );

    // Flatten result to return just members with enrollment_date and status
    const members = data
      .map((item: any) => {
        if (!item.members) return null;

        // Check if this specific enrollment is frozen
        const isFrozen = frozenEnrollmentIds.has(item.id);

        // Calculate first/last payment dates
        const paymentDates =
          item.payments?.map((p: any) => p.payment_date).sort() || [];
        const firstDate = paymentDates.length > 0 ? paymentDates[0] : null;
        const lastDate =
          paymentDates.length > 0
            ? paymentDates[paymentDates.length - 1]
            : null;

        return {
          ...item.members,
          enrollment_id: item.id,
          enrollment_date: item.created_at, // Add enrollment date from member_class
          next_payment_date: item.next_payment_date,
          active_enrollment: item.active,
          custom_price: item.custom_price,
          list_price: item.price,
          first_payment_date: firstDate,
          last_payment_date: lastDate,
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

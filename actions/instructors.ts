/**
 * Server Actions for Instructor Management
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  Instructor,
  InstructorInsert,
  InstructorUpdate,
  ApiResponse,
  ApiListResponse,
} from '@/types'
import {
  successResponse,
  errorResponse,
  successListResponse,
  errorListResponse,
  handleSupabaseError,
  logError,
  sanitizeInput,
  validateRequiredFields,
} from '@/utils/response-helpers'

/**
 * Get all active instructors
 */
export async function getInstructors(): Promise<ApiListResponse<Instructor>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('active', true)
      .order('first_name')

    if (error) {
      logError('getInstructors', error)
      return errorListResponse(handleSupabaseError(error))
    }

    return successListResponse(data || [])
  } catch (error) {
    logError('getInstructors', error)
    return errorListResponse(handleSupabaseError(error))
  }
}

/**
 * Get a single instructor by ID
 */
export async function getInstructorById(
  id: number
): Promise<ApiResponse<Instructor>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      logError('getInstructorById', error)
      return errorResponse(handleSupabaseError(error))
    }

    return successResponse(data)
  } catch (error) {
    logError('getInstructorById', error)
    return errorResponse(handleSupabaseError(error))
  }
}

/**
 * Create a new instructor
 */
export async function createInstructor(
  instructorData: InstructorInsert
): Promise<ApiResponse<Instructor>> {
  try {
    // Validate required fields
    const validation = validateRequiredFields(instructorData as unknown as Record<string, unknown>, [
      'first_name',
      'last_name',
    ])
    if (!validation.valid) {
      return errorResponse(`Gerekli alanlar eksik: ${validation.missingFields.join(', ')}`)
    }

    const supabase = await createClient()
    const sanitizedData = sanitizeInput(instructorData)

    const { data, error } = await supabase
      .from('instructors')
      .insert(sanitizedData)
      .select()
      .single()

    if (error) {
      logError('createInstructor', error)
      return errorResponse(handleSupabaseError(error))
    }

    revalidatePath('/instructors')
    return successResponse(data)
  } catch (error) {
    logError('createInstructor', error)
    return errorResponse(handleSupabaseError(error))
  }
}

/**
 * Update an instructor
 */
export async function updateInstructor(
  id: number,
  updates: InstructorUpdate
): Promise<ApiResponse<Instructor>> {
  try {
    const supabase = await createClient()
    const sanitizedUpdates = sanitizeInput(updates)

    const { data, error } = await supabase
      .from('instructors')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('updateInstructor', error)
      return errorResponse(handleSupabaseError(error))
    }

    revalidatePath('/instructors')
    return successResponse(data)
  } catch (error) {
    logError('updateInstructor', error)
    return errorResponse(handleSupabaseError(error))
  }
}

/**
 * Deactivate an instructor
 */
export async function deactivateInstructor(
  id: number
): Promise<ApiResponse<Instructor>> {
  return updateInstructor(id, { active: false })
}

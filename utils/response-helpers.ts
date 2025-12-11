/**
 * Response Helper Functions
 * Standardized response formatting for API calls and server actions
 */

import type { ApiResponse, ApiListResponse } from '@/types'

/**
 * Create a success response
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    error: null,
  }
}

/**
 * Create an error response
 */
export function errorResponse<T = null>(error: string): ApiResponse<T> {
  return {
    data: null,
    error,
  }
}

/**
 * Create a success list response
 */
export function successListResponse<T>(
  data: T[],
  count?: number
): ApiListResponse<T> {
  return {
    data,
    error: null,
    count,
  }
}

/**
 * Create an error list response
 */
export function errorListResponse<T>(error: string): ApiListResponse<T> {
  return {
    data: null,
    error,
    count: 0,
  }
}

/**
 * Handle Supabase errors and return user-friendly messages
 */
export function handleSupabaseError(error: unknown): string {
  if (error instanceof Error) {
    // Check for common Supabase error patterns
    if (error.message.includes('duplicate key')) {
      return 'Bu kayıt zaten mevcut.'
    }
    if (error.message.includes('foreign key')) {
      return 'İlişkili kayıtlar nedeniyle işlem yapılamadı.'
    }
    if (error.message.includes('not found')) {
      return 'Kayıt bulunamadı.'
    }
    if (error.message.includes('permission')) {
      return 'Bu işlem için yetkiniz bulunmuyor.'
    }

    return error.message
  }

  return 'Beklenmeyen bir hata oluştu.'
}

/**
 * Log errors in development mode
 */
export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}] Error:`, error)
  }
}

/**
 * Validate required fields
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(
    (field) => !data[field] || data[field] === ''
  )

  return {
    valid: missingFields.length === 0,
    missingFields: missingFields as string[],
  }
}

/**
 * Sanitize input by trimming whitespace
 */
export function sanitizeInput<T extends Record<string, unknown>>(data: T): T {
  const sanitized: Record<string, unknown> = { ...data }

  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = (sanitized[key] as string).trim()
    }
  })

  return sanitized as T
}

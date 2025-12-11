/**
 * Application Type Definitions
 * Export all commonly used types from here for easy imports
 */

import { Database } from './database.types'

// Extract table types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Specific table types
export type Instructor = Tables<'instructors'>
export type Class = Tables<'classes'>
export type Member = Tables<'members'>
export type MemberClass = Tables<'member_classes'>
export type Payment = Tables<'payments'>
export type FrozenLog = Tables<'frozen_logs'>
export type DanceType = Tables<'dance_types'>
export type InstructorRate = Tables<'instructor_rates'>
export type InstructorLedger = Tables<'instructor_ledger'>
export type InstructorPayout = Tables<'instructor_payouts'>

// Insert types
export type InstructorInsert = Inserts<'instructors'>
export type ClassInsert = Inserts<'classes'>
export type MemberInsert = Inserts<'members'>
export type MemberClassInsert = Inserts<'member_classes'>
export type PaymentInsert = Inserts<'payments'>
export type FrozenLogInsert = Inserts<'frozen_logs'>
export type DanceTypeInsert = Inserts<'dance_types'>
export type InstructorRateInsert = Inserts<'instructor_rates'>
export type InstructorLedgerInsert = Inserts<'instructor_ledger'>
export type InstructorPayoutInsert = Inserts<'instructor_payouts'>

// Update types
export type InstructorUpdate = Updates<'instructors'>
export type ClassUpdate = Updates<'classes'>
export type MemberUpdate = Updates<'members'>
export type MemberClassUpdate = Updates<'member_classes'>
export type PaymentUpdate = Updates<'payments'>
export type FrozenLogUpdate = Updates<'frozen_logs'>
export type DanceTypeUpdate = Updates<'dance_types'>
export type InstructorRateUpdate = Updates<'instructor_rates'>
export type InstructorLedgerUpdate = Updates<'instructor_ledger'>
export type InstructorPayoutUpdate = Updates<'instructor_payouts'>

// Extended types with relations
export type MemberWithClasses = Member & {
  member_classes: (MemberClass & {
    classes: Class | null
  })[]
}

export type ClassWithInstructor = Class & {
  instructors: Instructor | null
}

export type MemberWithPayments = Member & {
  payments: Payment[]
}

// Form data types (for creating/updating records)
export interface MemberFormData {
  first_name: string
  last_name: string
  phone?: string
  class_ids: number[]
  monthly_fee?: number
  initial_duration_months?: number
  initial_payment?: {
    amount: number
    payment_method?: string
    description?: string
  }
}

export interface PaymentFormData {
  member_id: number
  amount: number
  payment_method?: string
  description?: string
  period_start?: string
  period_end?: string
}

export interface FreezeFormData {
  member_id: number
  start_date: string
  end_date?: string
  reason?: string
  is_indefinite?: boolean
}

export interface InstructorFormData {
  first_name: string
  last_name: string
  specialty?: string
  phone?: string
  rates?: { dance_type_id: number; rate: number }[]
}

// API Response types
export type ApiResponse<T> = {
  data: T | null
  error: string | null
}

export type ApiListResponse<T> = {
  data: T[] | null
  error: string | null
  count?: number
}

// Member status types
export type MemberStatus = 'active' | 'frozen' | 'archived'

// Payment method types
export type PaymentMethod = 'Nakit' | 'Kredi Kartı' | 'Havale' | 'Diğer'

// Days of week
export type DayOfWeek =
  | 'Pazartesi'
  | 'Salı'
  | 'Çarşamba'
  | 'Perşembe'
  | 'Cuma'
  | 'Cumartesi'
  | 'Pazar'

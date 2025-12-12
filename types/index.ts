/**
 * Application Type Definitions
 * Export all commonly used types from here for easy imports
 */

import { Database } from './database.types';

// Extract table types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Specific table types
export type Instructor = Tables<'instructors'>;
export type Class = Tables<'classes'>;
export type Member = Tables<'members'>;
export type MemberClass = Tables<'member_classes'>;
export type Payment = Tables<'payments'>;
export type FrozenLog = Tables<'frozen_logs'>;
export type DanceType = Tables<'dance_types'>;
export type InstructorRate = Tables<'instructor_rates'>;
export type InstructorLedger = Tables<'instructor_ledger'>;
export type InstructorPayout = Tables<'instructor_payouts'>;

// Insert types
export type InstructorInsert = Inserts<'instructors'>;
export type ClassInsert = Inserts<'classes'>;
export type MemberInsert = Inserts<'members'>;
export type MemberClassInsert = Inserts<'member_classes'>;
export type PaymentInsert = Inserts<'payments'>;
export type FrozenLogInsert = Inserts<'frozen_logs'>;
export type DanceTypeInsert = Inserts<'dance_types'>;
export type InstructorRateInsert = Inserts<'instructor_rates'>;
export type InstructorLedgerInsert = Inserts<'instructor_ledger'>;
export type InstructorPayoutInsert = Inserts<'instructor_payouts'>;

// Update types
export type InstructorUpdate = Updates<'instructors'>;
export type ClassUpdate = Updates<'classes'>;
export type MemberUpdate = Updates<'members'>;
export type MemberClassUpdate = Updates<'member_classes'>;
export type PaymentUpdate = Updates<'payments'>;
export type FrozenLogUpdate = Updates<'frozen_logs'>;
export type DanceTypeUpdate = Updates<'dance_types'>;
export type InstructorRateUpdate = Updates<'instructor_rates'>;
export type InstructorLedgerUpdate = Updates<'instructor_ledger'>;
export type InstructorPayoutUpdate = Updates<'instructor_payouts'>;

// Extended types with relations
export type MemberWithClasses = Member & {
  member_classes: (MemberClass & {
    classes: Class | null;
  })[];
  frozen_logs?: FrozenLog[];
};

export type ClassWithInstructor = Class & {
  instructors: Instructor | null;
};

export type MemberWithPayments = Member & {
  payments: Payment[];
};

export type InstructorPayoutWithDetails = InstructorPayout & {
  instructors: {
    first_name: string;
    last_name: string;
  } | null;
};

// Extended member class with class details
export interface MemberClassWithDetails {
  id: number;
  member_id: number;
  class_id: number;
  next_payment_date: string | null;
  price: number | null;
  active: boolean;
  payment_interval: number | null;
  custom_price: number | null;
  classes: Class;
}

// Payment with class info
export interface PaymentWithClass extends Payment {
  classes?: Class | null;
}

// Member Class Registration Data
export interface ClassRegistration {
  class_id: number;
  price: number;
  duration: number; // months for initial next payment date
}

// Form data types (for creating/updating records)
export interface MemberFormData {
  first_name: string;
  last_name: string;
  phone?: string;
  class_registrations: ClassRegistration[];
  // monthly_fee removed - price is now per class
  // initial_* fields removed - payments handled separately
}

// Payment Schedule Item
export interface PaymentScheduleItem {
  periodMonth: string; // YYYY-MM-01 format
  periodLabel: string; // "Ocak 2025"
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
  paymentId?: number; // if status is paid
  paymentDate?: string;
  paymentMethod?: string;
  description?: string;
}

// Payment form with specific period support
export interface ClassPaymentFormData {
  memberId: number;
  classId: number;
  amount: number;
  monthsToPay?: number; // Legacy
  periodDate?: string; // Specific month to pay (YYYY-MM-DD)
  paymentMethod?: string;
  description?: string;
}

export interface FreezeFormData {
  member_id: number;
  start_date: string;
  end_date?: string;
  reason?: string;
  is_indefinite?: boolean;
}

export interface InstructorFormData {
  first_name: string;
  last_name: string;
  specialty?: string;
  phone?: string;
  rates?: { dance_type_id: number; rate: number }[];
}

// API Response types
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

export type ApiListResponse<T> = {
  data: T[] | null;
  error: string | null;
  count?: number;
};

// Member status types
export type MemberStatus = 'active' | 'frozen' | 'archived';

// Payment method types
export type PaymentMethod = 'Nakit' | 'Kredi Kartı' | 'Havale' | 'Diğer';

// Days of week
export type DayOfWeek =
  | 'Pazartesi'
  | 'Salı'
  | 'Çarşamba'
  | 'Perşembe'
  | 'Cuma'
  | 'Cumartesi'
  | 'Pazar';

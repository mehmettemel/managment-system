/**
 * Database Types
 *
 * These types are manually defined based on our database schema.
 *
 * To auto-generate these types from your Supabase database:
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Login: supabase login
 * 3. Generate types: npx supabase gen types typescript --project-id "your-project-ref" > types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      instructors: {
        Row: {
          id: number;
          first_name: string;
          last_name: string;
          specialty: string | null;
          phone: string | null;
          active: boolean;
          created_at: string;
          default_commission_rate: number | null;
        };
        Insert: {
          id?: number;
          first_name: string;
          last_name: string;
          specialty?: string | null;
          phone?: string | null;
          active?: boolean;
          created_at?: string;
          default_commission_rate?: number | null;
        };
        Update: {
          id?: number;
          first_name?: string;
          last_name?: string;
          specialty?: string | null;
          phone?: string | null;
          active?: boolean;
          created_at?: string;
          default_commission_rate?: number | null;
        };
      };
      classes: {
        Row: {
          id: number;
          name: string;
          instructor_id: number | null;
          dance_type_id: number | null;
          day_of_week: string | null;
          start_time: string | null;
          duration_minutes: number;
          price_monthly: number | null;
          active: boolean;
          archived: boolean;
        };
        Insert: {
          id?: number;
          name: string;
          instructor_id?: number | null;
          dance_type_id?: number | null;
          day_of_week?: string | null;
          start_time?: string | null;
          duration_minutes?: number;
          price_monthly?: number | null;
          active?: boolean;
          archived?: boolean;
        };
        Update: {
          id?: number;
          name?: string;
          instructor_id?: number | null;
          dance_type_id?: number | null;
          day_of_week?: string | null;
          start_time?: string | null;
          duration_minutes?: number;
          price_monthly?: number | null;
          active?: boolean;
          archived?: boolean;
        };
      };
      members: {
        Row: {
          id: number;
          first_name: string;
          last_name: string;
          phone: string | null;
          join_date: string;
          status: string;
          notes: string | null;
          monthly_fee: number | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          first_name: string;
          last_name: string;
          phone?: string | null;
          join_date?: string;
          status?: string;
          notes?: string | null;
          monthly_fee?: number | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          join_date?: string;
          status?: string;
          notes?: string | null;
          monthly_fee?: number | null;
          created_at?: string;
        };
      };
      member_classes: {
        Row: {
          id: number;
          member_id: number;
          class_id: number;
          next_payment_date: string | null;
          price: number | null;
          active: boolean;
          payment_interval: number | null;
          custom_price: number | null;
        };
        Insert: {
          id?: number;
          member_id: number;
          class_id: number;
          next_payment_date?: string | null;
          price?: number | null;
          active?: boolean;
          payment_interval?: number | null;
          custom_price?: number | null;
        };
        Update: {
          id?: number;
          member_id?: number;
          class_id?: number;
          next_payment_date?: string | null;
          price?: number | null;
          active?: boolean;
          payment_interval?: number | null;
          custom_price?: number | null;
        };
      };
      payments: {
        Row: {
          id: number;
          member_id: number | null;
          class_id: number | null;
          member_class_id: number | null;
          amount: number;
          payment_date: string;
          payment_method: string;
          period_start: string;
          period_end: string;
          description: string | null;
          snapshot_price: number | null;
          snapshot_class_name: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          member_id?: number | null;
          class_id?: number | null;
          member_class_id?: number | null;
          amount: number;
          payment_date?: string;
          payment_method?: string;
          period_start?: string;
          period_end?: string;
          description?: string | null;
          snapshot_price?: number | null;
          snapshot_class_name?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          member_id?: number | null;
          class_id?: number | null;
          member_class_id?: number | null;
          amount?: number;
          payment_date?: string;
          payment_method?: string;
          period_start?: string;
          period_end?: string;
          description?: string | null;
          snapshot_price?: number | null;
          snapshot_class_name?: string | null;
          created_at?: string | null;
        };
      };
      frozen_logs: {
        Row: {
          id: number;
          member_id: number | null;
          member_class_id: number | null;
          start_date: string | null;
          end_date: string | null;
          reason: string | null;
          days_count: number | null;
        };
        Insert: {
          id?: number;
          member_id?: number | null;
          member_class_id?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          reason?: string | null;
          days_count?: number | null;
        };
        Update: {
          id?: number;
          member_id?: number | null;
          member_class_id?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          reason?: string | null;
          days_count?: number | null;
        };
      };
      dance_types: {
        Row: {
          id: number;
          name: string;
          slug: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          slug?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string | null;
        };
      };
      instructor_rates: {
        Row: {
          id: number;
          instructor_id: number;
          dance_type_id: number;
          rate: number;
        };
        Insert: {
          id?: number;
          instructor_id: number;
          dance_type_id: number;
          rate: number;
        };
        Update: {
          id?: number;
          instructor_id?: number;
          dance_type_id?: number;
          rate?: number;
        };
      };
      instructor_ledger: {
        Row: {
          id: number;
          instructor_id: number | null;
          student_payment_id: number | null;
          amount: number;
          due_date: string;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          instructor_id?: number | null;
          student_payment_id?: number | null;
          amount: number;
          due_date: string;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          instructor_id?: number | null;
          student_payment_id?: number | null;
          amount?: number;
          due_date?: string;
          status?: string | null;
          created_at?: string | null;
        };
      };
      instructor_payouts: {
        Row: {
          id: number;
          instructor_id: number | null;
          amount: number;
          payment_date: string | null;
          note: string | null;
        };
        Insert: {
          id?: number;
          instructor_id?: number | null;
          amount: number;
          payment_date?: string | null;
          note?: string | null;
        };
        Update: {
          id?: number;
          instructor_id?: number | null;
          amount?: number;
          payment_date?: string | null;
          note?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

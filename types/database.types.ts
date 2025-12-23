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
      members: {
        Row: {
          id: number;
          first_name: string;
          last_name: string;
          phone: string | null;
          photo_url: string | null;
          status: 'active' | 'frozen' | 'archived';
          join_date: string;
          created_at: string;
          notes: string | null;
        };
        Insert: {
          id?: number;
          first_name: string;
          last_name: string;
          phone?: string | null;
          photo_url?: string | null;
          status?: 'active' | 'frozen' | 'archived';
          join_date?: string;
          created_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: number;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          photo_url?: string | null;
          status?: 'active' | 'frozen' | 'archived';
          join_date?: string;
          created_at?: string;
          notes?: string | null;
        };
      };
      classes: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          instructor_id: number | null;
          price_monthly: number;
          day_of_week: string | null;
          start_time: string | null;
          duration_minutes: number | null;
          active: boolean;
          archived: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          instructor_id?: number | null;
          price_monthly: number;
          day_of_week?: string | null;
          start_time?: string | null;
          duration_minutes?: number | null;
          active?: boolean;
          archived?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
          instructor_id?: number | null;
          price_monthly?: number;
          day_of_week?: string | null;
          start_time?: string | null;
          duration_minutes?: number | null;
          active?: boolean;
          archived?: boolean | null;
          created_at?: string;
        };
      };
      member_classes: {
        Row: {
          id: number;
          member_id: number;
          class_id: number;
          active: boolean;
          payment_interval: number | null;
          custom_price: number | null;
          first_payment_date: string | null;
          next_payment_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          member_id: number;
          class_id: number;
          active?: boolean;
          payment_interval?: number | null;
          custom_price?: number | null;
          first_payment_date?: string | null;
          next_payment_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          member_id?: number;
          class_id?: number;
          active?: boolean;
          payment_interval?: number | null;
          custom_price?: number | null;
          first_payment_date?: string | null;
          next_payment_date?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: number;
          member_id: number;
          class_id: number | null;
          member_class_id: number | null;
          amount: number;
          payment_method: string;
          payment_date: string;
          period_start: string | null;
          period_end: string | null;
          description: string | null;
          snapshot_price: number | null;
          snapshot_class_name: string | null;
          payment_type: 'monthly' | 'custom' | 'refund';
          created_at: string;
        };
        Insert: {
          id?: number;
          member_id: number;
          class_id?: number | null;
          member_class_id?: number | null;
          amount: number;
          payment_method: string;
          payment_date: string;
          period_start?: string | null;
          period_end?: string | null;
          description?: string | null;
          snapshot_price?: number | null;
          snapshot_class_name?: string | null;
          payment_type?: 'monthly' | 'custom' | 'refund';
          created_at?: string;
        };
        Update: {
          id?: number;
          member_id?: number;
          class_id?: number | null;
          member_class_id?: number | null;
          amount?: number;
          payment_method?: string;
          payment_date?: string;
          period_start?: string | null;
          period_end?: string | null;
          description?: string | null;
          snapshot_price?: number | null;
          snapshot_class_name?: string | null;
          payment_type?: 'monthly' | 'custom' | 'refund';
          created_at?: string;
        };
      };
      instructors: {
        Row: {
          id: number;
          first_name: string;
          last_name: string;
          phone: string | null;
          specialty: string | null;
          default_commission_rate: number | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          first_name: string;
          last_name: string;
          phone?: string | null;
          specialty?: string | null;
          default_commission_rate?: number | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          specialty?: string | null;
          default_commission_rate?: number | null;
          active?: boolean;
          created_at?: string;
        };
      };
      frozen_logs: {
        Row: {
          id: number;
          member_class_id: number;
          start_date: string;
          end_date: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          member_class_id: number;
          start_date: string;
          end_date?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          member_class_id?: number;
          start_date?: string;
          end_date?: string | null;
          reason?: string | null;
          created_at?: string;
        };
      };
      dance_types: {
        Row: {
          id: number;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          created_at?: string;
        };
      };
      instructor_rates: {
        Row: {
          id: number;
          instructor_id: number;
          dance_type_id: number;
          rate: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          instructor_id: number;
          dance_type_id: number;
          rate: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          instructor_id?: number;
          dance_type_id?: number;
          rate?: number;
          created_at?: string;
        };
      };
      instructor_ledger: {
        Row: {
          id: number;
          instructor_id: number;
          student_payment_id: number | null;
          amount: number;
          status: 'pending' | 'paid';
          payment_date: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          instructor_id: number;
          student_payment_id?: number | null;
          amount: number;
          status?: 'pending' | 'paid';
          payment_date?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          instructor_id?: number;
          student_payment_id?: number | null;
          amount?: number;
          status?: 'pending' | 'paid';
          payment_date?: string | null;
          description?: string | null;
          created_at?: string;
        };
      };
      instructor_payouts: {
        Row: {
          id: number;
          instructor_id: number;
          amount: number;
          payment_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          instructor_id: number;
          amount: number;
          payment_date: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          instructor_id?: number;
          amount?: number;
          payment_date?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: number;
          category: string;
          amount: number;
          description: string | null;
          date: string;
          receipt_number: string | null;
          member_id: number | null;
          member_class_id: number | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          category: string;
          amount: number;
          description?: string | null;
          date: string;
          receipt_number?: string | null;
          member_id?: number | null;
          member_class_id?: number | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          category?: string;
          amount?: number;
          description?: string | null;
          date?: string;
          receipt_number?: string | null;
          member_id?: number | null;
          member_class_id?: number | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
    };
  };
}

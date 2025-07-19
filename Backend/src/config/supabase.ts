import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Create Supabase client with service role key for backend operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types (will be generated from Supabase)
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'manager' | 'employee' | 'admin';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role: 'manager' | 'employee' | 'admin';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: 'manager' | 'employee' | 'admin';
          is_active?: boolean;
          updated_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string;
          unit_of_measure: string;
          purchase_cost: number;
          selling_price: number;
          current_stock: number;
          reorder_level: number;
          sku: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description: string;
          category: string;
          unit_of_measure: string;
          purchase_cost: number;
          selling_price: number;
          current_stock: number;
          reorder_level: number;
          sku: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string;
          category?: string;
          unit_of_measure?: string;
          purchase_cost?: number;
          selling_price?: number;
          current_stock?: number;
          reorder_level?: number;
          sku?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          address: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          email: string;
          phone: string;
          address: string;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string;
          address?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_info: string;
          payment_terms: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          contact_info: string;
          payment_terms: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          contact_info?: string;
          payment_terms?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      sales_orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          status: string;
          order_date: string;
          total_amount: number;
          payment_method: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          order_number: string;
          customer_id: string;
          status: string;
          order_date: string;
          total_amount: number;
          payment_method: string;
          created_by: string;
        };
        Update: {
          order_number?: string;
          customer_id?: string;
          status?: string;
          order_date?: string;
          total_amount?: number;
          payment_method?: string;
          updated_at?: string;
        };
      };
      sales_order_items: {
        Row: {
          id: string;
          sales_order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          sales_order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Update: {
          sales_order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
        };
      };
      purchase_orders: {
        Row: {
          id: string;
          order_number: string;
          supplier_id: string;
          status: string;
          total_amount: number;
          expected_delivery: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          order_number: string;
          supplier_id: string;
          status: string;
          total_amount: number;
          expected_delivery: string;
          created_by: string;
        };
        Update: {
          order_number?: string;
          supplier_id?: string;
          status?: string;
          total_amount?: number;
          expected_delivery?: string;
          updated_at?: string;
        };
      };
      production_orders: {
        Row: {
          id: string;
          bom_id: string;
          quantity_to_produce: number;
          status: string;
          start_date: string;
          completion_date: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          bom_id: string;
          quantity_to_produce: number;
          status: string;
          start_date: string;
          completion_date?: string;
          created_by: string;
        };
        Update: {
          bom_id?: string;
          quantity_to_produce?: number;
          status?: string;
          start_date?: string;
          completion_date?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          table_name: string;
          record_id: string;
          action: string;
          old_values: any;
          new_values: any;
          timestamp: string;
        };
        Insert: {
          user_id: string;
          table_name: string;
          record_id: string;
          action: string;
          old_values?: any;
          new_values?: any;
        };
        Update: never;
      };
      financial_transactions: {
        Row: {
          id: string;
          type: 'income' | 'expense';
          amount: number;
          category: string;
          description: string;
          date: string;
          payment_method: string;
          reference_number: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          type: 'income' | 'expense';
          amount: number;
          category: string;
          description: string;
          date: string;
          payment_method: string;
          reference_number: string;
          created_by: string;
        };
        Update: {
          type?: 'income' | 'expense';
          amount?: number;
          category?: string;
          description?: string;
          date?: string;
          payment_method?: string;
          reference_number?: string;
          updated_at?: string;
        };
      };
    };
  };
}

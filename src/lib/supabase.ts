import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '';

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not connected. Please connect Supabase first.');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name_en: string;
          name_ar: string;
          description_en: string;
          description_ar: string;
          price: number;
          image_url: string;
          stock: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_en: string;
          name_ar: string;
          description_en: string;
          description_ar: string;
          price: number;
          image_url: string;
          stock: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name_en?: string;
          name_ar?: string;
          description_en?: string;
          description_ar?: string;
          price?: number;
          image_url?: string;
          stock?: number;
          created_at?: string;
        };
      };
      codes: {
        Row: {
          id: string;
          product_id: string;
          code: string;
          is_used: boolean;
          used_by: string | null;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          code: string;
          is_used?: boolean;
          used_by?: string | null;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          code?: string;
          is_used?: boolean;
          used_by?: string | null;
          used_at?: string | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          total: number;
          stripe_payment_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total: number;
          stripe_payment_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total?: number;
          stripe_payment_id?: string;
          status?: string;
          created_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          code_id: string;
          quantity: number;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          code_id: string;
          quantity: number;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          code_id?: string;
          quantity?: number;
          price?: number;
          created_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          order_id: string;
          rating: number;
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          order_id: string;
          rating: number;
          comment: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          order_id?: string;
          rating?: number;
          comment?: string;
          created_at?: string;
        };
      };
      site_content: {
        Row: {
          id: string;
          key: string;
          content_en: string;
          content_ar: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          content_en: string;
          content_ar: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          content_en?: string;
          content_ar?: string;
          updated_at?: string;
        };
      };
    };
  };
};
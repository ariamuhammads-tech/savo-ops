// Hand-maintained Supabase schema types for SAVO Ops.
// Keep in sync with supabase/migrations/*. (We can later replace this with
// `supabase gen types typescript` output.)

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
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      business_settings: {
        Row: {
          id: string;
          business_name: string;
          tagline: string | null;
          address: string | null;
          phone_wa: string | null;
          email: string | null;
          instagram: string | null;
          npwp: string | null;
          logo_url: string | null;
          invoice_prefix: string;
          tax_percent: number;
          bank_name: string | null;
          bank_account_no: string | null;
          bank_account_name: string | null;
          invoice_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["business_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["business_settings"]["Row"]>;
        Relationships: [];
      };
      ingredients: {
        Row: {
          id: string;
          name: string;
          unit: string;
          stock_qty: number;
          min_stock: number;
          last_unit_cost: number;
          supplier_name: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          unit?: string;
          stock_qty?: number;
          min_stock?: number;
          last_unit_cost?: number;
          supplier_name?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ingredients"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          sku: string | null;
          name: string;
          category: string | null;
          unit: string;
          weight_grams: number | null;
          price_b2c: number;
          price_b2b: number;
          photo_url: string | null;
          stock_qty: number;
          min_stock: number;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku?: string | null;
          name: string;
          category?: string | null;
          unit?: string;
          weight_grams?: number | null;
          price_b2c?: number;
          price_b2b?: number;
          photo_url?: string | null;
          stock_qty?: number;
          min_stock?: number;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          yield_qty: number;
          yield_unit: string | null;
          overhead_cost: number;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name?: string;
          yield_qty?: number;
          yield_unit?: string | null;
          overhead_cost?: number;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recipes"]["Insert"]>;
        Relationships: [];
      };
      recipe_items: {
        Row: {
          id: string;
          recipe_id: string;
          ingredient_id: string;
          quantity: number;
          unit: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          ingredient_id: string;
          quantity?: number;
          unit?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recipe_items"]["Insert"]>;
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: string;
          item_type: "product" | "ingredient";
          item_id: string;
          movement_type:
            | "adjustment"
            | "sale"
            | "production_in"
            | "production_out"
            | "purchase"
            | "waste";
          qty_change: number;
          balance_after: number | null;
          ref_type: string | null;
          ref_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_type: "product" | "ingredient";
          item_id: string;
          movement_type: Database["public"]["Tables"]["stock_movements"]["Row"]["movement_type"];
          qty_change: number;
          balance_after?: number | null;
          ref_type?: string | null;
          ref_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stock_movements"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          type: "b2c" | "b2b";
          business_name: string | null;
          phone_wa: string | null;
          email: string | null;
          address: string | null;
          price_tier: "b2c" | "b2b";
          payment_terms_days: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: "b2c" | "b2b";
          business_name?: string | null;
          phone_wa?: string | null;
          email?: string | null;
          address?: string | null;
          price_tier?: "b2c" | "b2b";
          payment_terms_days?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row aliases
type Tables = Database["public"]["Tables"];
export type Profile = Tables["profiles"]["Row"];
export type BusinessSettings = Tables["business_settings"]["Row"];
export type Ingredient = Tables["ingredients"]["Row"];
export type Product = Tables["products"]["Row"];
export type StockMovement = Tables["stock_movements"]["Row"];
export type Recipe = Tables["recipes"]["Row"];
export type RecipeItem = Tables["recipe_items"]["Row"];
export type Customer = Tables["customers"]["Row"];

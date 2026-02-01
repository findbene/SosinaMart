import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables. Using mock mode.");
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};

// Database operations with fallback
export const db = {
  // Products
  async getProducts() {
    if (!supabase) {
      console.log("Supabase not configured, using local data");
      return { data: null, error: null };
    }
    return supabase.from("products").select("*");
  },

  async getProductById(id: string) {
    if (!supabase) return { data: null, error: null };
    return supabase.from("products").select("*").eq("id", id).single();
  },

  async getProductsByCategory(category: string) {
    if (!supabase) return { data: null, error: null };
    return supabase.from("products").select("*").eq("category", category);
  },

  // Orders
  async createOrder(orderData: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    items: string;
    total: number;
    notes?: string;
  }) {
    if (!supabase) {
      console.log("Supabase not configured, order saved locally");
      return { data: { id: `local-${Date.now()}` }, error: null };
    }
    return supabase.from("orders").insert([orderData]).select().single();
  },

  async getOrders() {
    if (!supabase) return { data: null, error: null };
    return supabase.from("orders").select("*").order("created_at", { ascending: false });
  },
};

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured =
  !!supabaseUrl && !!supabaseAnonKey;

/**
 * Supabase client (always created, but relies on valid env vars)
 */
export const supabase = createClient(
  supabaseUrl!,
  supabaseAnonKey!
);
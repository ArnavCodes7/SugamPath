import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SB_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const SB_KEY =
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

/** One shared client for the whole app (public anon / publishable key only). */
export const supabase: SupabaseClient | null =
  SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null;

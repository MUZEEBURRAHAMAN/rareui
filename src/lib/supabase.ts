import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Browser client — uses anon key, respects RLS */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Check if Supabase is configured (for dev-mode fallback) */
export function isSupabaseConfigured(): boolean {
  return (
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    supabaseUrl !== "https://your-project.supabase.co"
  );
}

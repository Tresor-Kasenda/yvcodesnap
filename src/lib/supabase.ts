import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasPlaceholderValues =
    supabaseUrl?.includes('your-project.supabase.co') ||
    supabaseUrl?.includes('your_supabase_url_here') ||
    supabaseAnonKey?.includes('your_anon_key_here') ||
    supabaseAnonKey?.includes('your_supabase_anon_key_here');

if (!supabaseUrl || !supabaseAnonKey || hasPlaceholderValues) {
    throw new Error(
        'Supabase is not configured. Set real values for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

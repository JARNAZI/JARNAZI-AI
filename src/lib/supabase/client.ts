
import { createBrowserClient } from '@supabase/ssr'

export function createClient(config?: { supabaseUrl?: string; supabaseAnonKey?: string }) {
    const url = config?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = config?.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.warn("Supabase client initialized with placeholder keys. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.");
        return createBrowserClient(
            url || 'https://placeholder.supabase.co',
            key || 'placeholder'
        )
    }

    return createBrowserClient(url, key)
}


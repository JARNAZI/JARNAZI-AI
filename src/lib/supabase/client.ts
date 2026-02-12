import { createBrowserClient } from '@supabase/ssr'

export function createClient(config?: { supabaseUrl?: string; supabaseAnonKey?: string }) {
    const url = config?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = config?.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        if (typeof window !== 'undefined') {
            console.error("Supabase credentials missing in browser.", { hasUrl: !!url, hasKey: !!key });
        }

        // Return a dummy client to prevent crash, but login will fail with "Failed to fetch" or descriptive error
        return createBrowserClient(
            url || 'https://missing-supabase-url.local',
            key || 'missing-anon-key'
        )
    }

    return createBrowserClient(url, key)
}


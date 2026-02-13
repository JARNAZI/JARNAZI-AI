import { createBrowserClient } from '@supabase/ssr'

export function createClient(config?: { supabaseUrl?: string; supabaseAnonKey?: string }) {
    const url = config?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = config?.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key || url.includes('missing-supabase-url')) {
        if (typeof window !== 'undefined') {
            console.error("Supabase credentials missing or invalid in browser.", {
                hasUrl: !!url,
                hasKey: !!key,
                url: url
            });
        }

        // Return a dummy client to prevent crash, but login will fail with "Failed to fetch" or descriptive error
        return createBrowserClient(
            url || 'https://missing-supabase-url.local',
            key || 'missing-anon-key'
        )
    }

    return createBrowserClient(url, key)
}


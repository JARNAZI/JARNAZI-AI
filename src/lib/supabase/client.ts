
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
        // Return a dummy client to avoid immediate crash. 
        // This will fail on actual usage but prevent the whole page from blanking out on load.
        return createBrowserClient(
            url || 'https://placeholder.supabase.co',
            key || 'placeholder'
        )
    }

    return createBrowserClient(url, key)
}

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createAdminClient() {
    const cookieStore = await cookies()

    // Use service role key to bypass RLS for admin operations
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Fallback or error if missing.
    // Ensure you have SUPABASE_SERVICE_ROLE_KEY in your env for this to work.
    if (!supabaseUrl || !supabaseServiceKey) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn("DEBUG [Supabase Admin Client]: Missing SERVICE_ROLE_KEY. Check env vars.");
        }
        // Return safe dummy or throw? Throwing is better for admin usage to alert misconfiguration.
        // But to avoid crashing build if env is missing locally:
        return createServerClient(
            supabaseUrl || 'https://missing-url.local',
            supabaseServiceKey || 'missing-service-key',
            { cookies: { getAll: () => [], setAll: () => { } } }
        )
    }

    return createServerClient(
        supabaseUrl,
        supabaseServiceKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                    }
                },
            },
        }
    )
}

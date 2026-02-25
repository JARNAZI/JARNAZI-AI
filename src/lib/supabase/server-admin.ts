import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Creates a client meant for standard admin UI operations where we WANT 
 * to know the currently logged-in admin user (for logging, RLS with role check, etc.)
 */
export async function createAdminClient() {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
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

/**
 * Creates a client that COMPLETELY BYPASSES RLS.
 * Use this only for system-level operations where the user session is irrelevant.
 */
export async function createServiceRoleClient() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Supabase Service Role Key for Admin Operation");
    }

    // Using the base createClient without cookies/SSR context ensures RLS bypass
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

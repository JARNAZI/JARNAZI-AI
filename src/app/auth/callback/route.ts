import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    let next = searchParams.get('next') ?? '/debate'

    const cookieHeader = request.headers.get('cookie') ?? '';
    const m = cookieHeader.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
    const cookieLocale = m ? decodeURIComponent(m[1]) : null;

    // If next is a non-localized internal path, prefix it with the user's locale cookie
    if (cookieLocale && next.startsWith('/') && !next.startsWith(`/${cookieLocale}/`)) {
        const candidates = ['/debate', '/login', '/register', '/buy-tokens', '/profile', '/plans'];
        if (candidates.includes(next)) {
            next = `/${cookieLocale}${next}`;
        }
    }

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

            if (siteUrl) {
                return NextResponse.redirect(`${siteUrl}${next}`)
            }

            // Fallback for previews/dev
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

function getBaseUrl(req: Request) {
    const env = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    if (env) return env.replace(/\/$/, '');

    const forwardedHost = req.headers.get('x-forwarded-host');
    const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
    if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;

    const origin = req.headers.get('origin') || req.headers.get('referer');
    if (origin) {
        try {
            const url = new URL(origin);
            return `${url.protocol}//${url.host}`;
        } catch (_) {
            return origin.replace(/\/$/, '');
        }
    }

    const reqUrl = new URL(req.url);
    if (!reqUrl.host.includes('0000')) {
        return reqUrl.origin;
    }

    return 'https://jarnazi.com';
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const baseUrl = getBaseUrl(request);
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
            return NextResponse.redirect(`${baseUrl}${next}`)
        } else {
            console.error('[Auth Callback] Code exchange failed:', error.message);
        }
    } else {
        console.warn('[Auth Callback] No code provided in search params.');
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
}

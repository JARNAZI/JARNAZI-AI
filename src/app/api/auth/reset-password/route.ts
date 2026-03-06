import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPasswordResetEmailLink } from '@/lib/email';

export const runtime = 'nodejs';

function getBaseUrl(req: Request) {
    const env = process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_BASE_URL;
    if (env) return env.replace(/\/$/, '');

    const origin = req.headers.get('origin') || req.headers.get('referer');
    if (origin) {
        try {
            const url = new URL(origin);
            return `${url.protocol}//${url.host}`;
        } catch (_) {
            return origin.replace(/\/$/, '');
        }
    }

    return 'https://jarnazi.com';
}

export async function POST(req: Request) {
    try {
        const { email, lang } = await req.json();

        const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !serviceKey) {
            const missing = [];
            if (!url) missing.push('SUPABASE_URL');
            if (!serviceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
            return NextResponse.json({
                error: `Supabase admin credentials missing: ${missing.join(', ')}. Ensure these are set in your Cloud Run variables.`
            }, { status: 500 });
        }

        const supabaseAdmin = createClient(url, serviceKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });

        const siteUrl = getBaseUrl(req);
        // Redirect directly to the update password page because generateLink(type: 'recovery') 
        // uses Implicit Flow and appends `#access_token=...`, which Server-side routes won't see.
        const redirectTo = `${siteUrl}/${lang || 'en'}/update-password`;

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: {
                redirectTo
            }
        });

        if (error) throw error;

        const actionLink = data.properties.action_link;
        let recoveryLink = actionLink;

        try {
            // Intercept the internal OTP token so the user never hits the Supabase verify redirect
            // This prevents all implicit-flow hash fragment errors and PKCE issues.
            const urlObj = new URL(actionLink);
            const tokenHash = urlObj.searchParams.get('token');
            if (tokenHash) {
                recoveryLink = `${siteUrl}/${lang || 'en'}/update-password?token=${tokenHash}`;
            }
        } catch (e) {
            console.error('[Reset Password] Failed to parse action_link', e);
        }

        await sendPasswordResetEmailLink(email, recoveryLink, lang || 'en');

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 400 });
    }
}


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPasswordResetEmailLink } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const { email, lang } = await req.json();

        const supabaseAdmin = createClient(
            (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://jarnazi.com';
        // Redirect to the update-password page
        const redirectTo = `${siteUrl}/${lang || 'en'}/update-password`;

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: {
                redirectTo
            }
        });

        if (error) throw error;

        const recoveryLink = data.properties.action_link;

        await sendPasswordResetEmailLink(email, recoveryLink, lang || 'en');

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 400 });
    }
}


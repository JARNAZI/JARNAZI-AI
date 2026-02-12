import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendVerificationEmailLink } from '@/lib/email';

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
    const { email, password, fullName, lang } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1) Create user (unconfirmed)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: fullName || '' },
      email_confirm: false,
    });

    if (createErr) throw createErr;

    // 2) Generate verification link with correct redirect (avoid localhost)
    const baseUrl = getBaseUrl(req);
    const redirectTo = `${baseUrl}/${lang || 'en'}/login?verified=1`;

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: { redirectTo },
    });

    if (linkErr) throw linkErr;

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) throw new Error('Verification link not generated');

    // 3) Send via Resend (Edge Function)
    await sendVerificationEmailLink(email, actionLink, lang || 'en');

    return NextResponse.json({ success: true, userId: created.user?.id });
  } catch (error: unknown) {
    console.error('Register Error:', error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Registration failed' }, { status: 400 });
  }
}


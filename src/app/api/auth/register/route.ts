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
    const { email, password, fullName, lang, turnstileToken, honeypot } = await req.json();

    const headersList = req.headers;
    const ip = headersList.get('x-forwarded-for') || 'unknown';

    // 0. Honeypot check - Trap bots
    if (honeypot) {
      console.warn(`[AUTH REGISTER] Honeypot triggered by IP: ${ip}`);
      try {
        const { createClient: createAdminClient } = await import('@supabase/supabase-js');
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (url && key) {
          const admin = createAdminClient(url, key);
          await admin.from('banned_ips').insert({ ip, reason: 'Caught in register honeypot' });
        }
      } catch (e) { }
      return NextResponse.json({ error: 'System is receiving too many requests. Please try again later.' }, { status: 400 });
    }

    // 1. Verify Turnstile (Human Check) - CRITICAL SECURITY FIX
    const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_API_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      if (!turnstileToken) {
        return NextResponse.json({ error: 'Security evaluation failed (Turnstile token missing).' }, { status: 400 });
      }
      try {
        const formData = new FormData();
        formData.append('secret', turnstileSecret);
        formData.append('response', turnstileToken);
        
        // Optional: Include client IP for better bot detection
        const headersList = req.headers;
        const ip = headersList.get('x-forwarded-for') || 'unknown';
        if (ip !== 'unknown') formData.append('remoteip', ip);

        const tRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: formData
        });
        const tData = await tRes.json();
        if (!tData.success) {
          console.error('[AUTH REGISTER] Turnstile verification failed:', tData);
          return NextResponse.json({ error: 'Security check failed. Please refresh and try again.' }, { status: 400 });
        }
      } catch (e) {
        console.error('[AUTH REGISTER] Turnstile error:', e);
        return NextResponse.json({ error: 'Internal security gateway timeout.' }, { status: 500 });
      }
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      const missing = [];
      if (!url) missing.push('SUPABASE_URL');
      if (!serviceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

      console.error('[AUTH REGISTER] Missing Supabase credentials:', {
        hasUrl: !!url,
        hasServiceKey: !!serviceKey,
        envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
      });

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

    // We use generateLink with type: 'signup' which creates the user and returns the verification link in one step.
    const baseUrl = getBaseUrl(req);
    const redirectTo = `${baseUrl}/${lang || 'en'}/login?verified=1`;

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: { full_name: fullName || '' },
        redirectTo
      },
    });

    if (linkErr) throw linkErr;

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) throw new Error('Verification link not generated');

    // Send via Resend (Edge Function)
    await sendVerificationEmailLink(email, actionLink, lang || 'en');

    // The user's UUID is returned in user properties of linkData if needed, but not necessarily populated.
    // If not, we can just return success: true.
    return NextResponse.json({ success: true, userId: linkData?.user?.id });
  } catch (error: unknown) {
    console.error('Register Error:', error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || 'Registration failed' }, { status: 400 });
  }
}


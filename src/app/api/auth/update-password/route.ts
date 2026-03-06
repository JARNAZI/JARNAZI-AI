import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const { password, token, email } = await req.json();
        const authHeader = req.headers.get('Authorization');

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }
        if (!authHeader && !token) {
            return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
        }
        if (token && !email) {
            return NextResponse.json({ error: 'Unauthorized: missing email for OTP token' }, { status: 401 });
        }

        const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !anonKey || !serviceKey) {
            return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
        }

        const adminClient = createClient(url, serviceKey, {
            auth: { persistSession: false }
        });

        let targetUserId = null;

        if (token && email) {
            // New Method: Verify OTP token_hash directly
            const { data, error: otpError } = await adminClient.auth.verifyOtp({
                email: email,
                token_hash: token,
                type: 'recovery'
            });
            if (otpError || !data?.user) {
                console.error('[Update Password API] OTP verify error:', otpError?.message);
                return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 401 });
            }
            targetUserId = data.user.id;
        } else if (authHeader) {
            // Old Method: access_token validation
            const rawToken = authHeader.replace('Bearer ', '').trim();
            const { data: { user }, error: userError } = await adminClient.auth.getUser(rawToken);
            if (userError || !user) {
                console.error('[Update Password API] getUser error:', userError?.message);
                return NextResponse.json({ error: 'Invalid or expired access token.' }, { status: 401 });
            }
            targetUserId = user.id;
        }

        if (!targetUserId) {
            return NextResponse.json({ error: 'Failed to identify user' }, { status: 401 });
        }

        // 2. Update the user's password using the Admin API
        const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
            password: password
        });

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 400 });
    }
}

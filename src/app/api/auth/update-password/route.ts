import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const { password } = await req.json();
        const authHeader = req.headers.get('Authorization');

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !anonKey || !serviceKey) {
            return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
        }

        // 1. Verify the user using the provided access token
        const userClient = createClient(url, anonKey, {
            auth: { persistSession: false }
        });

        const rawToken = authHeader.replace('Bearer ', '').trim();
        const { data: { user }, error: userError } = await userClient.auth.getUser(rawToken);

        if (userError || !user) {
            console.error('[Update Password API] getUser error:', userError?.message || 'No user found');
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        // 2. Update the user's password using the Admin API
        // This bypasses the default Supabase "Password Changed" email notification
        const adminClient = createClient(url, serviceKey, {
            auth: { persistSession: false }
        });

        const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
            password: password
        });

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 400 });
    }
}

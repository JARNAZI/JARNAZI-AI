import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Disable Edge Runtime to avoid Node.js API warnings
export const runtime = 'nodejs';

export async function GET(req: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const secret = req.headers.get('authorization')?.split(' ')[1];
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const health: any = {
        openai: 'unknown',
        database: 'unknown',
        timestamp: new Date().toISOString()
    };

    // 1. Check Database
    try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
        if (error) throw error;
        health.database = 'healthy';
    } catch (e: unknown) {
        health.database = `failed: ${(e instanceof Error ? e.message : String(e))}`;
    }

    // 2. Check OpenAI
    try {
        const res = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        if (res.ok) {
            health.openai = 'healthy';
        } else {
            health.openai = `failed: ${res.statusText}`;
        }
    } catch (e: unknown) {
        health.openai = `error: ${(e instanceof Error ? e.message : String(e))}`;
    }

    // Alerting Logic (Simple)
    if (health.database.startsWith('failed') || health.openai.startsWith('failed')) {
        // In a real app, send an email or Slack webhook here
        console.error("CRITICAL HEALTH CHECK FAILED", health);
    }

    return NextResponse.json(health);
}

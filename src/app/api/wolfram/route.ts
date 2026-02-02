import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    try {
        const { query } = await req.json();

        // 1. Get Wolfram Config from DB
        const { data: rawProviders } = await supabaseAdmin
            .from('ai_providers')
            .select('*')
            .eq('enabled', true);

        // Find provider where name matches Wolfram
        const provider = rawProviders?.find(p => p.name.toLowerCase().includes('wolfram'));

        if (!provider) {
            return NextResponse.json({ result: "Wolfram Alpha is not configured or active." }, { status: 404 });
        }

        const config = (provider.config as any) || {};
        let appId = config.appId || config.app_id || config.api_key;

        if (!appId) {
            return NextResponse.json({ result: "App ID missing in configuration." }, { status: 500 });
        }

        const url = `http://api.wolframalpha.com/v1/result?appid=${appId}&i=${encodeURIComponent(query)}`;

        const response = await fetch(url);
        const text = await response.text();

        if (!response.ok) {
            return NextResponse.json({ result: `Wolfram Error: ${text}` }, { status: response.status });
        }

        return NextResponse.json({ result: text });

    } catch (error: unknown) {
        console.error('Wolfram API Error:', error);
        return NextResponse.json({ result: "Internal Server Error" }, { status: 500 });
    }
}

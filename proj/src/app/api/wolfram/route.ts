import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Disable Edge Runtime for Node APIs if needed (optional here but good practice)
export const runtime = 'nodejs';

export async function POST(req: Request) {
    // Admin client to read config securely
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    try {
        const { query } = await req.json();

        // 1. Get Wolfram Config from DB
        const { data: provider } = await supabaseAdmin
            .from('ai_providers')
            .select('config, model_id') // We might store AppID in config or model_id
            .eq('provider', 'wolfram')
            .eq('is_active', true)
            .single();

        if (!provider) {
            return NextResponse.json({ result: "Wolfram Alpha is not configured or active." }, { status: 404 });
        }

        let appId = provider.config?.appId;

        // Fallback: If not in config, check model_id (sometimes users put key there)
        if (!appId && provider.model_id && provider.model_id.length > 5) {
            appId = provider.model_id;
        }

        if (!appId) {
            return NextResponse.json({ result: "App ID missing in configuration." }, { status: 500 });
        }

        // 2. Call Wolfram Alpha API
        // using "Short Answer" API
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

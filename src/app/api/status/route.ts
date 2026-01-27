import { NextResponse } from 'next/server';

/**
 * API Status Endpoint
 * Checks which AI provider API keys are configured
 */
export async function GET() {
    try {
        const configured = {
            openai: !!process.env.OPENAI_API_KEY,
            deepseek: !!process.env.DEEPSEEK_API_KEY,
            anthropic: !!process.env.ANTHROPIC_API_KEY,
            google: !!process.env.GOOGLE_API_KEY,
            resend: !!process.env.RESEND_API_KEY || !!process.env.RESEND_API_KEY_LIVE,
            resend_from: !!process.env.RESEND_FROM_EMAIL,
            supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            timestamp: new Date().toISOString()
        };



        const ready = configured.openai || configured.deepseek || configured.anthropic || configured.google;

        return NextResponse.json({
            configured,
            ready,
            message: ready
                ? 'At least one AI provider is configured'
                : 'No AI provider API keys found. Please configure in environment variables.'
        });

    } catch (error: unknown) {
        return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}

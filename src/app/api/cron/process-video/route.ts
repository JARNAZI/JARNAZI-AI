import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { triggerComposerJob } from '@/lib/cloud-run';

function getAdmin() {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key, {
        auth: { persistSession: false },
    });
}

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: Request) {
    try {
        const admin = getAdmin();
        const results = {
            runs_dispatched: 0,
            errors: [] as string[]
        };

        // Poll for job_runs that are 'starting' or 'pending'
        const { data: runs } = await admin
            .from('job_runs')
            .select('*')
            .eq('status', 'starting')
            .limit(10);

        if (runs?.length) {
            for (const run of runs) {
                try {
                    // Update status to 'running'
                    await admin.from('job_runs').update({
                        status: 'running',
                        started_at: new Date().toISOString()
                    }).eq('id', run.id);

                    if (run.run_type === 'compose') {
                        const triggered = await triggerComposerJob(run.video_job_id);
                        if (triggered) {
                            results.runs_dispatched++;
                        } else {
                            await admin.from('job_runs').update({
                                status: 'failed',
                                error_message: 'Failed to trigger Cloud Run Job'
                            }).eq('id', run.id);
                        }
                    } else {
                        // Handle other run types if needed
                    }
                } catch (err: any) {
                    results.errors.push(`Run dispatch failed: ${err.message}`);
                }
            }
        }

        return NextResponse.json({ ok: true, results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


import { NextResponse } from 'next/server';
import { createClient as createBrowserServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const supabase = await createBrowserServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const canon = body?.canon;
        const debateId = body?.debateId;

        if (!canon) {
            return NextResponse.json({ error: 'Canon is required' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ canon });
        }

        // Generate visual reference images for temporary memory
        if (canon.characters && Array.isArray(canon.characters)) {
            for (const char of canon.characters) {
                if (char.image_url) continue; // Skip if already enriched
                try {
                    const imgRes = await fetch('https://api.openai.com/v1/images/generations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                        body: JSON.stringify({
                            model: "dall-e-3",
                            prompt: `A cinematic character design reference sheet for: ${char.name}. Description: ${char.description || ''}. Keep it realistic, high quality, consistent with film style.`,
                            n: 1,
                            size: "1024x1024"
                        })
                    });
                    const imgData = await imgRes.json();
                    if (imgData?.data?.[0]?.url) {
                        char.image_url = imgData.data[0].url;
                    }
                } catch (e) {
                    console.error('Failed to generate image for character', e);
                }
            }
        }

        if (canon.locations && Array.isArray(canon.locations)) {
            for (const loc of canon.locations) {
                if (loc.image_url) continue;
                try {
                    const imgRes = await fetch('https://api.openai.com/v1/images/generations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                        body: JSON.stringify({
                            model: "dall-e-3",
                            prompt: `A cinematic location design background for: ${loc.name}. Description: ${loc.description || ''}. Empty scene, highly detailed, film look.`,
                            n: 1,
                            size: "1024x1024"
                        })
                    });
                    const imgData = await imgRes.json();
                    if (imgData?.data?.[0]?.url) {
                        loc.image_url = imgData.data[0].url;
                    }
                } catch (e) {
                    console.error('Failed to generate image for location', e);
                }
            }
        }

        // Save or update canon to user_canons table
        try {
            let seriesName = 'My Epic Series';
            if (debateId) {
                const { data: dbData } = await supabase.from('debates').select('topic').eq('id', debateId).maybeSingle();
                if (dbData?.topic) seriesName = `Series: ${dbData.topic.substring(0, 50)}`;
            }

            const { data: existingCanon } = await supabase
                .from('user_canons')
                .select('id')
                .eq('user_id', user.id)
                .eq('series_name', seriesName)
                .maybeSingle();

            if (existingCanon?.id) {
                await supabase
                    .from('user_canons')
                    .update({
                        canon_data: canon,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingCanon.id);
            } else {
                await supabase
                    .from('user_canons')
                    .insert({
                        user_id: user.id,
                        series_name: seriesName,
                        canon_data: canon
                    });
            }
        } catch (dbErr) {
            console.error('[Canon Enrichment] Failed to save to user_canons', dbErr);
        }

        return NextResponse.json({ canon });

    } catch (e: any) {
        console.error('[Canon Enrichment] Unexpected Error:', e);
        return NextResponse.json({ error: e?.message || 'Server Error' }, { status: 500 });
    }
}

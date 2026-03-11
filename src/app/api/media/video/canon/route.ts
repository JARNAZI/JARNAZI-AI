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
        const prompt = body?.prompt ?? '';

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('[Canon Extraction] OPENAI_API_KEY is not defined');
            // Graceful fallback if NO API KEY: return empty canon without throwing error
            return NextResponse.json({ canon: { characters: [], locations: [] } });
        }

        const sysPrompt = `You are a script continuity assistant. Extract all distinctive characters and locations from the provided script/prompt to help an AI Video Generator maintain visual consistency across scenes.
Return JSON ONLY matching this format:
{
  "characters": [
    { "name": "string", "description": "detailed physical appearance, clothing, age, style", "home": { "name": "string", "description": "physical look" }, "work": { "name": "string", "description": "physical look" } }
  ],
  "locations": [
    { "name": "string", "description": "detailed physical appearance, lighting, style" }
  ]
}
If home/work aren't mentioned, omit them or leave null. Provide as much visual detail as possible. Do not invent details not implied by the text.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('[Canon Extraction] OpenAI API Error:', err);
            return NextResponse.json({ canon: null }, { status: 500 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";
        let canon: any = {};

        try {
            canon = JSON.parse(content);

            // Generate visual reference images for temporary memory
            if (canon.characters && Array.isArray(canon.characters)) {
                for (const char of canon.characters) {
                    try {
                        const imgRes = await fetch('https://api.openai.com/v1/images/generations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                            body: JSON.stringify({
                                model: "dall-e-3",
                                prompt: `A cinematic character design reference sheet for: ${char.name}. Description: ${char.description}`,
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
                    try {
                        const imgRes = await fetch('https://api.openai.com/v1/images/generations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                            body: JSON.stringify({
                                model: "dall-e-3",
                                prompt: `A cinematic location design background for: ${loc.name}. Description: ${loc.description}. Empty scene, highly detailed.`,
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

        } catch (e) {
            console.error('[Canon Extraction] JSON Parse Error:', e);
            canon = { characters: [], locations: [] };
        }

        return NextResponse.json({ canon });

    } catch (e: any) {
        console.error('[Canon Extraction] Unexpected Error:', e);
        return NextResponse.json({ error: e?.message || 'Server Error' }, { status: 500 });
    }
}

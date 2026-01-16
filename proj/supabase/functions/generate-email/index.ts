import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { type, data, language } = await req.json()
        const apiKey = Deno.env.get('OPENAI_API_KEY')

        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is missing in Edge Function')
        }

        const openai = new OpenAI({
            apiKey: apiKey,
        })

        const BASE_URL = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://jarnazi.com';
        const LOGO_URL = `${BASE_URL}/logo.jpg`;

        const prompt = `
    You are an expert email designer for 'Jarnazi Consensus AI'.
    Generate a full HTML email for a "${type}" email.
    
    Context Data:
    ${JSON.stringify(data, null, 2)}
    
    Requirements:
    1. Language: ${language || 'en'} (Translate all text, buttons, and legal footer for this language).
    2. Design: Modern, minimalist, premium, inline CSS.
    3. Colors: Bg #f4f4f5, Card #ffffff, Text #18181b, Accent #4f46e5.
    4. Structure:
       - Header with Logo (${LOGO_URL}) and "Jarnazi Consensus AI".
       - Clear, professional customized message using the Context Data.
       - A Call-to-Action button if a URL is provided in data (use accent color).
       - Footer with copyright and links to ${BASE_URL}/privacy, ${BASE_URL}/terms, ${BASE_URL}/support.
    5. Output JSON format only: { "subject": "Email Subject", "html": "Full HTML String" }.
    `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant designed to output JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const result = completion.choices[0].message.content;
        const jsonResult = result ? JSON.parse(result) : null;

        return new Response(JSON.stringify(jsonResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})

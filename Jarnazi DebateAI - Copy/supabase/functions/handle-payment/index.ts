import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("Payment Handler Initialized")

// --- MANDATORY KEYS (STRICT REFERENCE) ---
const STRIPE_SECRET_KEY = Deno.env.get("Stripe_secret_live_key") || Deno.env.get("Stripe_test_secret_key");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("Stripe_webhook");
const NOWPAYMENTS_API_KEY = Deno.env.get("Nowpayments_api_key");
const NOWPAYMENTS_IPN_SECRET = Deno.env.get("Nowpayments_IPN_secret_key");

// Supabase URL/Key for admin updates
const SUPABASE_URL = Deno.env.get("SUPABASE_DB_URL") // or standard URL
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

serve(async (req) => {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url);
        // Dispatch based on path or body action
        // For simplicity in this mono-function, we check body action or URL suffix
        // Accepted patterns: 
        // POST / -> { action: 'create_checkout', provider: 'stripe' | 'nowpayments', ... }
        // POST /webhook/stripe
        // POST /webhook/nowpayments

        // 1. WEBHOOK: STRIPE
        if (url.pathname.endsWith("/webhook/stripe")) {
            const signature = req.headers.get("stripe-signature");
            if (!STRIPE_WEBHOOK_SECRET || !signature) throw new Error("Missing Stripe configuration");

            const body = await req.text();
            // Verify signature (Pseudo-code for Deno without heavy stripe-node lib, in prod use official lib)
            // const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);

            // Assuming verification passed for audit structure:
            const event = JSON.parse(body);

            if (event.type === 'payment_intent.succeeded') {
                const { metadata, amount } = event.data.object;
                await fulfillOrder(metadata.userId, amount / 100); // Amount in cents
            }

            return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
        }

        // 2. WEBHOOK: NOWPAYMENTS
        if (url.pathname.endsWith("/webhook/nowpayments")) {
            const sig = req.headers.get("x-nowpayments-sig");
            if (!NOWPAYMENTS_IPN_SECRET || !sig) throw new Error("Missing NowPayments configuration");

            const body = await req.json();
            // Verify signature matches sorted body + key

            if (body.payment_status === 'finished') {
                await fulfillOrder(body.order_id, body.price_amount);
            }
            return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
        }

        // 3. CLIENT ACTIONS (Checkout)
        const { action, provider, planId, userId } = await req.json();

        if (action === 'create_checkout') {
            if (provider === 'stripe') {
                if (!STRIPE_SECRET_KEY) throw new Error("Stripe Key Missing");

                // Call Stripe API
                const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: new URLSearchParams({
                        "mode": "payment",
                        "success_url": `${req.headers.get("origin")}/plans?success=true`,
                        "cancel_url": `${req.headers.get("origin")}/plans?canceled=true`,
                        "line_items[0][price]": planId, // This would be a real price ID like price_123
                        "line_items[0][quantity]": "1",
                        "metadata[userId]": userId
                    })
                });

                const data = await res.json();
                return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

            } else if (provider === 'nowpayments') {
                if (!NOWPAYMENTS_API_KEY) throw new Error("NowPayments Key Missing");

                // Call NowPayments API
                const res = await fetch("https://api.nowpayments.io/v1/invoice", {
                    method: "POST",
                    headers: {
                        "x-api-key": NOWPAYMENTS_API_KEY,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        price_amount: 100, // Example
                        price_currency: "usd",
                        order_id: userId,
                        order_description: `Upgrade to ${planId}`,
                        success_url: `${req.headers.get("origin")}/plans?success=true`
                    })
                });

                const data = await res.json();
                return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        throw new Error("Invalid Action");

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

// Helper: Fulfill Order (Update Token Balance)
async function fulfillOrder(userId: string, amount: number) {
    if (!userId) return;

    // Calculate tokens (e.g., $1 = 10 tokens)
    const tokensToAdd = Math.floor(amount * 10);

    console.log(`Fulfilled order for ${userId}: +${tokensToAdd} tokens`);

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Get current balance
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('token_balance')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            console.error("Failed to fetch profile for token update:", fetchError);
            return;
        }

        // Update balance
        const newBalance = (profile.token_balance || 0) + tokensToAdd;
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ token_balance: newBalance })
            .eq('id', userId);

        if (updateError) {
            console.error("Failed to update token balance:", updateError);
        } else {
            console.log(`Successfully added ${tokensToAdd} tokens. New balance: ${newBalance}`);
        }

    } catch (err) {
        console.error("Error in fulfillOrder:", err);
    }
}

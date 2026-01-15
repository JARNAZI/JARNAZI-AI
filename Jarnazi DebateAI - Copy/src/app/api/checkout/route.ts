import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { getPlan } from '@/lib/plans';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { planId } = body;

        if (!planId) {
            return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
        }

        const plan = await getPlan(planId);
        if (!plan) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const headersList = await headers();
        const origin = headersList.get('origin') || 'https://jarnazi.com';
        // Get user email
        const email = user.email || '';

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: plan.name,
                            description: plan.description,
                        },
                        unit_amount: plan.price_cents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/debate?success=true&plan=${planId}`,
            cancel_url: `${origin}/pricing?canceled=true`,
            customer_email: email,
            metadata: {
                userId: user.id,
                planId: planId,
                credits_cents: plan.credits_cents.toString(),
                planName: plan.name,
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (err: any) {
        console.error('Checkout error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

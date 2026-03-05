import Stripe from 'stripe';

export const stripe = new Stripe(
    (process.env.NODE_ENV === 'production'
        ? process.env.STRIPE_SECRET_LIVE_KEY
        : process.env.STRIPE_TEST_SECRET_KEY) || 'sk_test_dummy',
    {
        apiVersion: '2024-06-20',
        typescript: true,
    });

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    );

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: 'jarnazi@jarnazi.com',
        options: {
            redirectTo: 'http://localhost/update'
        }
    });

    if (error) {
        console.error('generateLink error:', error);
        return;
    }

    const actionLink = data.properties.action_link;
    console.log('Action Link:', actionLink);

    // We simulate hitting the action_link by fetching it!
    const res = await fetch(actionLink, { redirect: 'manual' });
    console.log('Redirect URL from Supabase:', res.headers.get('location'));

    const location = res.headers.get('location');
    if (location && location.includes('?')) {
        const searchParams = new URLSearchParams(location.split('?')[1]);
        const code = searchParams.get('code');
        if (code) {
            console.log('Returned PKCE CODE:', code);
        }
    }
    if (location && location.includes('#')) {
        const hashParams = new URLSearchParams(location.split('#')[1]);
        const accessToken = hashParams.get('access_token');
        console.log('Extracted Access Token:', accessToken);

        const userRes = await supabase.auth.getUser(accessToken);
        console.log('User Result:', userRes.data, userRes.error);
    }
}

run();

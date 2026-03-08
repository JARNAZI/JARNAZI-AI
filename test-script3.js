const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = envLocal.split('\n').reduce((acc, line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        acc[parts[0]] = parts.slice(1).join('=').trim();
    }
    return acc;
}, {});

const SUPABASE_URL = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY'];

async function run() {
    const supabase = createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
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

    const res = await fetch(actionLink, { redirect: 'manual' });
    const location = res.headers.get('location');
    console.log('Redirect URL from Supabase:', location);

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

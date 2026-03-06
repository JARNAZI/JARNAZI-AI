import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: 'test@jarnazi.com' // Ensure this email is a valid test user or mock it
    });

    if (error) {
        console.error('generateLink error:', error);
        return;
    }

    const actionLink = data.properties.action_link;
    console.log('Action Link:', actionLink);

    const urlObj = new URL(actionLink);
    const tokenHash = urlObj.searchParams.get('token');

    console.log('Extracted Token Hash:', tokenHash);

    const verifyRes = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery'
    });

    console.log('Verify Result:', verifyRes.data, verifyRes.error);
}

run();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function checkSettings() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('--- KV Schema Check ---');
    const { data: kvData, error: kvError } = await supabase.from('site_settings').select('*');
    if (kvError) {
        console.log('KV Error or Table Missing:', kvError.message);
    } else {
        console.log('KV Data:', JSON.stringify(kvData, null, 2));
    }

    console.log('\n--- Single Row Schema Check ---');
    const { data: srData, error: srError } = await supabase.from('site_settings').select('features').limit(1).maybeSingle();
    if (srError) {
        console.log('SR Error:', srError.message);
    } else {
        console.log('SR Features:', JSON.stringify(srData?.features, null, 2));
    }
}

checkSettings();

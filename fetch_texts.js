const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("Missing keys", url, key);
    process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
    const { data: privacyData } = await supabase.from('site_settings').select('*').eq('key', 'privacy_text').single();
    const { data: termsData } = await supabase.from('site_settings').select('*').eq('key', 'terms_text').single();

    fs.writeFileSync('privacy_text.txt', privacyData?.value || '');
    fs.writeFileSync('terms_text.txt', termsData?.value || '');

    console.log("Files written");
}

main();

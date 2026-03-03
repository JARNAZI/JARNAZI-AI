const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
for (const line of envStr.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1]] = match[2];
}

const url = envVars.NEXT_PUBLIC_SUPABASE_URL || envVars.SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function main() {
    console.log("Fetching data...");
    const { data: p } = await supabase.from('site_settings').select('*').eq('key', 'privacy_text').single();
    const { data: t } = await supabase.from('site_settings').select('*').eq('key', 'terms_text').single();

    fs.writeFileSync('texts.json', JSON.stringify({
        privacy: p?.value || '',
        terms: t?.value || ''
    }));
    console.log("Saved to texts.json");
    process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });

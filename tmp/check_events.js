const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
});

const getEnv = (key) => process.env[key] || env[key] || '';

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: events, error } = await supabase
        .from('payment_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    console.log('Last 3 payment events:', JSON.stringify(events, null, 2));
    if (error) console.error('Error fetching events:', error);

    const { data: ledgers, error: lErr } = await supabase
        .from('token_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    console.log('Last 3 ledgers:', JSON.stringify(ledgers, null, 2));
    if (lErr) console.error('Error fetching ledgers:', lErr);

}
run();

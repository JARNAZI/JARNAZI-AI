require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.log(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
    const { data } = await supabase.from('ai_costs').select('*');
    console.log("AI COSTS:", JSON.stringify(data, null, 2));

    const { data: p } = await supabase.from('profiles').select('email, token_balance').limit(10);
    console.log("PROFILES:", JSON.stringify(p, null, 2));
}

run();

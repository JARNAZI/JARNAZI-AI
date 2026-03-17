const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
let envUrl = '';
let envKey = '';

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const lines = envFile.split('\n');
    for (const line of lines) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) envUrl = line.split('=')[1].trim();
        if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) envKey = line.split('=')[1].trim();
    }
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || envUrl;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || envKey;

if (!url || !key) {
    console.error("Missing supabase credentials");
    process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function test() {
    const { data: profiles, error: pError } = await supabase.from('profiles').select('email, token_balance, free_trial_used');
    console.log("PROFILES:", JSON.stringify(profiles, null, 2));
    if (pError) console.error("Profile Error:", pError);

    const { data: costs, error: cError } = await supabase.from('ai_costs').select('*');
    console.log("AI COSTS DB:", JSON.stringify(costs, null, 2));
    if (cError) console.error("Costs Error:", cError);
    
    // Test orchestrator plan if possible
    
}
test().catch(console.error);

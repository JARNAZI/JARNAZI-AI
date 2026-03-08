const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const envMatches = [...envContent.matchAll(/^([^#\n=]+)=(.+)$/gm)];
const env = envMatches.reduce((acc, match) => { acc[match[1]] = match[2]; return acc; }, {});

const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log("Missing URL or KEY", !!supabaseUrl, !!supabaseKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('ai_models').select('*');
    console.log("Error:", error);
    console.log("Data count:", data?.length);
    if (data?.length > 0) {
        console.log("Sample:", data[0]);
    }
}
check();

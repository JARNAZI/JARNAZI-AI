const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.existsSync('.env.development')
    ? fs.readFileSync('.env.development', 'utf8')
    : fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';

const envVars = envLocal.split('\n').reduce((acc, line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        acc[parts[0]] = parts.slice(1).join('=').trim().replace(/'|"/g, '');
    }
    return acc;
}, {});

const SUPABASE_URL = envVars['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Keys:', SUPABASE_URL, SUPABASE_KEY?.length);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
supabase.auth.admin.generateLink({ type: 'recovery', email: 'jarnazi@jarnazi.com' }).then(res => {
    console.log(JSON.stringify(res.data, null, 2));
}).catch(console.error);

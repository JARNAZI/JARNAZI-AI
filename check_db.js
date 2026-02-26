const { createClient } = require('@supabase/supabase-js');

async function check() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jarnazi-ai-project.supabase.co'; // Fallback to guess, but we need env.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fake';
  
  // Actually we can read .env directly using fs
  const fs = require('fs');
  const env = fs.readFileSync('.env', 'utf8');
  const envMap = {};
  env.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) envMap[k.trim()] = v.trim();
  });
  
  const sb = createClient(envMap.NEXT_PUBLIC_SUPABASE_URL, envMap.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await sb.from('site_settings').select('*').limit(1);
  console.log('Error:', error);
  console.log('Cols:', data && data.length ? Object.keys(data[0]) : 'empty table');
}

check();

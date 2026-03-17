require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing keys!");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const email = `testuser_${Date.now()}@example.com`;
    const password = "Password123!";

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Test Agent',
        }
    });

    if (error) {
        console.error("Error creating user:", error.message);
        process.exit(1);
    }

    console.log(`CREATED_USER:${email}:${password}:${data.user.id}`);
}

main().catch(console.error);

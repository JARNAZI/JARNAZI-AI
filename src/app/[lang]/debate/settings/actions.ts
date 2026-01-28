'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createClientPrimitive } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

/**
 * Deletes the currently authenticated user's account.
 * Uses SUPABASE_SERVICE_ROLE_KEY on the server.
 */
export async function deleteOwnAccount() {
  const supabase = await createClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr || !user) {
    // Not authenticated
    redirect('/'); // fallback
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  const admin = createClientPrimitive(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  // Delete auth user (will cascade to profiles if you have FK/trigger; otherwise profiles remains)
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    throw delErr;
  }

  // Best-effort: also sign out cookie session
  await supabase.auth.signOut();

  redirect('/');
}

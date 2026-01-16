import 'server-only';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export type AppSetting = { key: string; value: unknown };

export async function getSettings(keys?: string[]) {
  const supabase = await createServerClient();
  let q = supabase.from('settings').select('key,value');
  if (keys && keys.length) q = q.in('key', keys);
  const { data, error } = await q;
  if (error) throw error;
  const out: Record<string, unknown> = {};
  for (const row of data || []) out[row.key] = row.value;
  return out;
}

export async function getSetting<T = unknown>(key: string, fallback?: T): Promise<T> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
  if (error) return fallback as T;
  return (data?.value ?? fallback) as T;
}

// For privileged server routes (webhooks/cron) that need to bypass RLS
export function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

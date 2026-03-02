import 'server-only';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

import { getRobustSetting, getAllRobustSettings } from './settings-robust';

export type AppSetting = { key: string; value: unknown };

export async function getSettings(keys?: string[]) {
  const supabase = getAdminClient();
  return getAllRobustSettings(supabase, keys);
}

export async function getSetting<T = unknown>(key: string, fallback?: T): Promise<T> {
  const supabase = getAdminClient();
  return getRobustSetting<T>(supabase, key, fallback);
}

export function getAdminClient() {
  return createAdminClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}


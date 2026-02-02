'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type JsonObject = Record<string, unknown>;

export type ProviderPayload = {
  id?: string;
  name: string;
  kind: string;
  enabled: boolean;
  base_url: string | null;
  env_key: string | null;
  config: JsonObject;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseJsonObject(value: unknown): JsonObject {
  if (isRecord(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function pickProviderFields(input: unknown): ProviderPayload {
  const obj = isRecord(input) ? input : {};

  return {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : undefined,
    name: String(obj.name ?? '').trim(),
    kind: String(obj.kind ?? obj.category ?? 'text').trim(),
    base_url: obj.base_url != null && String(obj.base_url).trim() ? String(obj.base_url).trim() : null,
    env_key: obj.env_key != null && String(obj.env_key).trim() ? String(obj.env_key).trim() : null,
    enabled: Boolean(obj.enabled ?? obj.is_active ?? true),
    config: parseJsonObject(obj.config),
  };
}

async function requireAdmin() {
  const supabase = await createClient();
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;

  let role: string | undefined;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile) role = profile.role;
  }

  if (!user || (role !== 'admin' && role !== 'super_admin')) {
    throw new Error('Unauthorized');
  }
  return supabase;
}

export async function upsertProvider(input: unknown) {
  const supabase = await requireAdmin();
  const payload = pickProviderFields(input);

  if (!payload.name || !payload.kind) {
    throw new Error('name and kind are required');
  }

  const { error } = await supabase
    .from('ai_providers')
    .upsert(payload);

  if (error) throw error;

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function deleteProvider(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('ai_providers').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/providers');
  return { success: true };
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type JsonObject = Record<string, unknown>;

export type ProviderPayload = {
  id?: string;
  name: string;
  provider: string;
  category: string;
  model_id: string;
  base_url: string | null;
  env_key: string | null;
  is_active: boolean;
  priority: number;
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

  const name = String(obj.name ?? '').trim();
  const provider = String(obj.provider ?? '').trim().toLowerCase();
  const category = String(obj.category ?? '').trim();
  const model_id = String(obj.model_id ?? '').trim();

  return {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : undefined,
    name,
    provider,
    category,
    model_id,
    base_url: obj.base_url != null && String(obj.base_url).trim() ? String(obj.base_url).trim() : null,
    env_key: obj.env_key != null && String(obj.env_key).trim() ? String(obj.env_key).trim() : null,
    is_active: Boolean(obj.is_active ?? true),
    priority: Number(obj.priority ?? 0),
    config: parseJsonObject(obj.config),
  };
}

async function requireAdmin() {
  const supabase = await createClient();

  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;

  let role: string | undefined;

  if (user) {
    const profileRes = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const profile = profileRes.data as any;
    if (isRecord(profile) && typeof profile.role === 'string') role = profile.role;
  }

  if (!user || (role !== 'admin' && role !== 'super_admin')) {
    throw new Error('Unauthorized');
  }

  return supabase;
}

export async function upsertProvider(input: unknown) {
  const supabase = await requireAdmin();
  const payload = pickProviderFields(input);

  if (!payload.name || !payload.provider || !payload.model_id) {
    throw new Error('name, provider, and model_id are required');
  }

  const { error } = await supabase
    .from('ai_providers')
    .upsert(payload, { onConflict: 'provider,model_id' });

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

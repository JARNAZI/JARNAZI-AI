'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type JsonObject = Record<string, unknown>;

type ModelPayload = {
  id?: string;
  provider: string;
  model_id: string;
  enabled: boolean;
  priority: number;
  notes: string | null;
  capabilities: JsonObject;
  cost_profile: JsonObject;
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

function pickModelFields(input: unknown): ModelPayload {
  const obj = isRecord(input) ? input : {};

  const provider = String(obj.provider ?? '').trim().toLowerCase();
  const model_id = String(obj.model_id ?? '').trim();

  return {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : undefined,
    provider,
    model_id,
    enabled: Boolean(obj.enabled ?? true),
    priority: Number(obj.priority ?? 0),
    notes: obj.notes != null && String(obj.notes).trim() ? String(obj.notes) : null,
    capabilities: parseJsonObject(obj.capabilities),
    cost_profile: parseJsonObject(obj.cost_profile),
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

    // Supabase types may be `any` depending on your generated types;
    // keep it safe and runtime-checked.
    const profile = profileRes.data as any;
    if (isRecord(profile) && typeof profile.role === 'string') role = profile.role;
  }

  if (!user || (role !== 'admin' && role !== 'super_admin')) {
    throw new Error('Unauthorized');
  }

  return supabase;
}

export async function upsertModel(input: unknown) {
  const supabase = await requireAdmin();
  const payload = pickModelFields(input);

  if (!payload.provider || !payload.model_id) {
    throw new Error('provider and model_id are required');
  }

  const { error } = await supabase
    .from('ai_models')
    .upsert(payload, { onConflict: 'provider,model_id' });

  if (error) throw error;

  revalidatePath('/admin/models');
  return { success: true };
}

export async function deleteModel(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase.from('ai_models').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/admin/models');
  return { success: true };
}

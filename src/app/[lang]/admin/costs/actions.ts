'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type AiCostPayload = {
  id?: string;
  provider: string;
  model: string;
  cost_type: string; // text | image | voice | video | ...
  unit: string; // per_1k_tokens | per_image | per_video | per_minute | ...
  cost_per_unit: number;
  is_active: boolean;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function pickString(obj: Record<string, unknown>, key: string, fallback = ''): string {
  const v = obj[key];
  return typeof v === 'string' ? v.trim() : fallback;
}

function pickBoolean(obj: Record<string, unknown>, key: string, fallback = true): boolean {
  const v = obj[key];
  return typeof v === 'boolean' ? v : Boolean(v ?? fallback);
}

function pickNumber(obj: Record<string, unknown>, key: string, fallback = 0): number {
  const v = obj[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.trim());
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function pickCostFields(input: unknown): AiCostPayload {
  const obj = isRecord(input) ? input : {};

  const provider = pickString(obj, 'provider').toLowerCase();
  const model = pickString(obj, 'model');
  const cost_type = pickString(obj, 'cost_type').toLowerCase();
  const unit = pickString(obj, 'unit');
  const cost_per_unit = pickNumber(obj, 'cost_per_unit', 0);

  return {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : undefined,
    provider,
    model,
    cost_type,
    unit,
    cost_per_unit,
    is_active: pickBoolean(obj, 'is_active', true),
  };
}

async function requireAdmin() {
  const supabase = await createClient();

  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;

  let role: string | undefined;

  if (user) {
    const profileRes = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const profile = profileRes.data as any;
    if (profile && typeof profile === 'object' && typeof profile.role === 'string') role = profile.role;
  }

  if (!user || (role !== 'admin' && role !== 'super_admin')) {
    throw new Error('Unauthorized');
  }

  return supabase;
}

export async function upsertAiCost(input: unknown) {
  const supabase = await requireAdmin();
  const lang = (isRecord(input) && typeof (input as any).lang === 'string' && (input as any).lang.trim()) ? String((input as any).lang).trim() : 'en';
  const payload = pickCostFields(input);

  if (!payload.provider || !payload.model || !payload.cost_type || !payload.unit) {
    throw new Error('provider, model, cost_type, and unit are required');
  }
  if (!Number.isFinite(payload.cost_per_unit) || payload.cost_per_unit < 0) {
    throw new Error('cost_per_unit must be a non-negative number');
  }

  const { error } = await supabase.from('ai_costs').upsert(payload);
  if (error) throw error;

  revalidatePath(`/${lang}/admin/costs`);
  revalidatePath('/admin/costs');
  return { success: true };
}

export async function deleteAiCost(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('ai_costs').delete().eq('id', id);
  if (error) throw error;

  revalidatePath(`/${lang}/admin/costs`);
  revalidatePath('/admin/costs');
  return { success: true };
}

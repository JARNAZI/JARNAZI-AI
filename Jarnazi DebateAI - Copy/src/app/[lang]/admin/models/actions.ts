'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function pickModelFields(input: any) {
  const capabilities = typeof input.capabilities === 'string' ? JSON.parse(input.capabilities || '{}') : (input.capabilities || {});
  const cost_profile = typeof input.cost_profile === 'string' ? JSON.parse(input.cost_profile || '{}') : (input.cost_profile || {});
  return {
    id: input.id || undefined,
    provider: String(input.provider || '').trim().toLowerCase(),
    model_id: String(input.model_id || '').trim(),
    enabled: Boolean(input.enabled ?? true),
    priority: Number(input.priority ?? 0),
    notes: input.notes ? String(input.notes) : null,
    capabilities,
    cost_profile,
  };
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null } as any;

  const role = profile?.role as string | undefined;
  if (!user || (role !== 'admin' && role !== 'super_admin')) throw new Error('Unauthorized');
  return supabase;
}

export async function upsertModel(input: any) {
  const supabase = await requireAdmin();
  const payload = pickModelFields(input);

  if (!payload.provider || !payload.model_id) throw new Error('provider and model_id are required');

  const { error } = await supabase.from('ai_models').upsert(payload, { onConflict: 'provider,model_id' });
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

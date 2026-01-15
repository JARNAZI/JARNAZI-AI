'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function pickProviderFields(input: any) {
  // Keep this aligned with public.ai_providers columns
  const cleaned: any = {
    id: input.id || undefined,
    name: String(input.name || '').trim(),
    provider: String(input.provider || '').trim(),
    category: input.category || 'text',
    model_id: String(input.model_id || '').trim(),
    base_url: input.base_url ? String(input.base_url).trim() : null,
    env_key: input.env_key ? String(input.env_key).trim() : null,
    is_active: typeof input.is_active === 'boolean' ? input.is_active : true,
    priority: Number.isFinite(Number(input.priority)) ? Number(input.priority) : 0,
    config: typeof input.config === 'string' ? (() => { try { return JSON.parse(input.config); } catch { return {}; } })() : (input.config || {}),
  };

  if (!cleaned.name) throw new Error('Provider name is required');
  if (!cleaned.provider) throw new Error('Provider code is required (e.g. openai, anthropic)');
  if (!cleaned.model_id) throw new Error('Model ID is required');
  return cleaned;
}

export async function upsertProvider(provider: any) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();

  if (!user || (profile?.role !== 'super_admin' && profile?.role !== 'admin')) {
    throw new Error('Unauthorized');
  }

  const row = pickProviderFields(provider);

  const { error } = await supabase
    .from('ai_providers')
    .upsert(row, { onConflict: 'id' });

  if (error) throw error;

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function deleteProvider(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();

  if (!user || (profile?.role !== 'super_admin' && profile?.role !== 'admin')) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase.from('ai_providers').delete().eq('id', id);
  if (error) throw error;

  revalidatePath('/admin/providers');
  return { success: true };
}

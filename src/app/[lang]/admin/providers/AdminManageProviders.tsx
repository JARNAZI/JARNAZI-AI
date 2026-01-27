'use client';

import { useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { useDictionary } from '@/i18n/use-dictionary';
import { upsertProvider, deleteProvider } from './actions';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

type ProviderRecord = {
  id: string;
  name: string;
  provider: string;
  category: string;
  model_id: string;
  env_key: string | null;
  base_url: string | null;
  is_active: boolean;
  priority: number;
  config: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

type ProviderForm = {
  id?: string;
  name: string;
  provider: string;
  category: string;
  model_id: string;
  env_key: string;   // empty string => NULL in DB
  base_url: string;  // empty string => NULL in DB
  is_active: boolean;
  priority: number;
  config: string; // JSON string
  created_at?: string;
  updated_at?: string;
};
const PROVIDER_TYPES = ['openai', 'anthropic', 'google', 'cohere', 'mistral', 'deepseek', 'qwen', 'replicate', 'fal', 'runway', 'luma'];
const CATEGORIES = ['text', 'image', 'video', 'audio', 'math', 'security'];

export default function AdminManageProviders({ initialProviders }: { initialProviders: unknown[] }) {
  // NOTE: initialProviders comes from a server component and is treated as unknown here.
  // We keep UI typing strict and treat it as ProviderRecord[] for rendering.
  const [providers, setProviders] = useState<ProviderRecord[]>(initialProviders as ProviderRecord[]);
  const [editing, setEditing] = useState<ProviderForm | null>(null);
  const [loading, setLoading] = useState(false);

  const params = useParams();
  const lang = (params as any)?.lang || 'en';
  const dict = useDictionary(String(lang));

  const startNew = () => {
    setEditing({
      name: '',
      provider: 'openai',
      category: 'text',
      model_id: 'gpt-4o',
      base_url: '',
      env_key: 'Openai_api_key',
      is_active: true,
      priority: 0,
      config: JSON.stringify({ style: 'openai_compatible', pricing: { input_per_1k_tokens: 2.5, output_per_1k_tokens: 7.5 } }, null, 2),
    });
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    try {
      await upsertProvider(editing);
      toast.success(dict.adminProviders?.providerSaved ?? 'Provider saved');
      setEditing(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(dict.adminProviders?.confirmDeleteProvider ?? 'Delete this provider?')) return;
    setLoading(true);
    try {
      await deleteProvider(id);
      toast.success(dict.adminProviders?.providerDeleted ?? 'Provider deleted');
      setProviders((prev) => prev.filter((p) => p.id !== id));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-foreground">{dict.adminProviders?.providersHeading ?? 'Providers'}</h2>
        <button
          onClick={startNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-foreground px-4 py-2 rounded-lg font-bold"
        >
          <Plus className="w-4 h-4" /> {dict.adminProviders?.addProvider ?? 'Add Provider'}
        </button>
      </div>

      <div className="grid gap-4">
        {providers.map((p) => (
          <div key={p.id} className="bg-card/60 border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-foreground">{p.name}</span>
                <span className="text-xs font-mono text-primary">{p.provider}</span>
                <span className="text-xs text-muted-foreground">({p.category})</span>
                {!p.is_active && <span className="text-xs text-destructive font-bold">INACTIVE</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                model: <span className="font-mono">{p.model_id}</span>
                {p.env_key ? <> • env: <span className="font-mono">{p.env_key}</span></> : null}
                {p.base_url ? <> • base: <span className="font-mono">{p.base_url}</span></> : null}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setEditing({
                    id: p.id,
                    name: p.name,
                    provider: p.provider,
                    category: p.category,
                    model_id: p.model_id,
                    env_key: p.env_key ?? '',
                    base_url: p.base_url ?? '',
                    is_active: p.is_active,
                    priority: p.priority,
                    config: JSON.stringify(p.config || {}, null, 2),
                  })
                }
                className="p-2 rounded-lg bg-muted/40 hover:bg-muted/60 text-foreground"
                title={dict.adminProviders?.edit ?? 'Edit'}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-destructive"
                title={dict.adminProviders?.delete ?? 'Delete'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-card/80 border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground font-black">{dict.adminProviders?.editProvider ?? 'Edit Provider'}</h3>
            <button type="button" onClick={() => setEditing(null)} className="p-2 rounded-lg bg-muted/40 hover:bg-muted/60 text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase">{dict.adminProviders?.fieldName ?? 'Name'}</span>
              <input className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-foreground"
                value={editing.name}
                onChange={e => setEditing({ ...editing, name: e.target.value })}
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase">{dict.adminProviders?.fieldProviderCode ?? 'Provider Code'}</span>
              <select className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-foreground"
                value={editing.provider}
                onChange={e => setEditing({ ...editing, provider: e.target.value })}
              >
                {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase">{dict.adminProviders?.fieldCategory ?? 'Category'}</span>
              <select className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-foreground"
                value={editing.category}
                onChange={e => setEditing({ ...editing, category: e.target.value })}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase">{dict.adminProviders?.fieldModelId ?? 'Model ID'}</span>
              <input className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-foreground"
                value={editing.model_id}
                onChange={e => setEditing({ ...editing, model_id: e.target.value })}
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase">{dict.adminProviders?.fieldEnvKey ?? 'Env Key (Edge Secret Name)'}</span>
              <input className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-foreground"
                value={editing.env_key || ''}
                onChange={e => setEditing({ ...editing, env_key: e.target.value })}
                placeholder="Openai_api_key"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase">{dict.adminProviders?.fieldBaseUrl ?? 'Base URL (optional)'}</span>
              <input className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-foreground"
                value={editing.base_url || ''}
                onChange={e => setEditing({ ...editing, base_url: e.target.value })}
                placeholder="https://api.openai.com"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase">{dict.adminProviders?.fieldPriority ?? 'Priority (lower = earlier)'}</span>
              <input type="number" className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-foreground"
                value={editing.priority}
                onChange={e => setEditing({ ...editing, priority: parseInt(e.target.value) || 0 })}
              />
            </label>

            <label className="space-y-1 flex items-center gap-2 mt-6">
              <input type="checkbox" checked={!!editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
              <span className="text-sm text-foreground font-bold">{dict.adminProviders?.fieldActive ?? 'Active'}</span>
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground font-bold uppercase">{dict.adminProviders?.fieldConfig ?? 'Config (JSON)'}</span>
            <textarea className="w-full min-h-[220px] bg-background/60 border border-border rounded-lg px-3 py-2 text-foreground font-mono text-xs"
              value={editing.config || ''}
              onChange={e => setEditing({ ...editing, config: e.target.value })}
              placeholder='{"style":"openai_compatible","pricing":{"input_per_1k_tokens":2.5,"output_per_1k_tokens":7.5}}'
            />
          </label>

          <div className="flex gap-3">
            <button disabled={loading} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-foreground px-4 py-2 rounded-lg font-bold disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button type="button" onClick={() => setEditing(null)} className="bg-muted/40 hover:bg-muted/60 text-foreground px-4 py-2 rounded-lg font-bold">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

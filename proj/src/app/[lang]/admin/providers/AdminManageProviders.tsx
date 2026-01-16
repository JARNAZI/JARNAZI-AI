'use client';

import { useState, type FormEvent } from 'react';
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
      toast.success('Provider saved');
      setEditing(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this provider?')) return;
    setLoading(true);
    try {
      await deleteProvider(id);
      toast.success('Provider deleted');
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
        <h2 className="text-lg font-bold text-white">Providers</h2>
        <button
          onClick={startNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold"
        >
          <Plus className="w-4 h-4" /> Add Provider
        </button>
      </div>

      <div className="grid gap-4">
        {providers.map((p) => (
          <div key={p.id} className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-white">{p.name}</span>
                <span className="text-xs font-mono text-indigo-300">{p.provider}</span>
                <span className="text-xs text-zinc-400">({p.category})</span>
                {!p.is_active && <span className="text-xs text-red-400 font-bold">INACTIVE</span>}
              </div>
              <div className="text-xs text-zinc-400">
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
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black">Edit Provider</h3>
            <button type="button" onClick={() => setEditing(null)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs text-zinc-400 font-bold uppercase">Name</span>
              <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                value={editing.name}
                onChange={e => setEditing({ ...editing, name: e.target.value })}
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-zinc-400 font-bold uppercase">Provider Code</span>
              <select className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                value={editing.provider}
                onChange={e => setEditing({ ...editing, provider: e.target.value })}
              >
                {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-zinc-400 font-bold uppercase">Category</span>
              <select className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                value={editing.category}
                onChange={e => setEditing({ ...editing, category: e.target.value })}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-zinc-400 font-bold uppercase">Model ID</span>
              <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                value={editing.model_id}
                onChange={e => setEditing({ ...editing, model_id: e.target.value })}
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-zinc-400 font-bold uppercase">Env Key (Edge Secret Name)</span>
              <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                value={editing.env_key || ''}
                onChange={e => setEditing({ ...editing, env_key: e.target.value })}
                placeholder="Openai_api_key"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-zinc-400 font-bold uppercase">Base URL (optional)</span>
              <input className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                value={editing.base_url || ''}
                onChange={e => setEditing({ ...editing, base_url: e.target.value })}
                placeholder="https://api.openai.com"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-zinc-400 font-bold uppercase">Priority (lower = earlier)</span>
              <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                value={editing.priority}
                onChange={e => setEditing({ ...editing, priority: parseInt(e.target.value) || 0 })}
              />
            </label>

            <label className="space-y-1 flex items-center gap-2 mt-6">
              <input type="checkbox" checked={!!editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} />
              <span className="text-sm text-white font-bold">Active</span>
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-xs text-zinc-400 font-bold uppercase">Config (JSON)</span>
            <textarea className="w-full min-h-[220px] bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-xs"
              value={editing.config || ''}
              onChange={e => setEditing({ ...editing, config: e.target.value })}
              placeholder='{"style":"openai_compatible","pricing":{"input_per_1k_tokens":2.5,"output_per_1k_tokens":7.5}}'
            />
          </label>

          <div className="flex gap-3">
            <button disabled={loading} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button type="button" onClick={() => setEditing(null)} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg font-bold">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

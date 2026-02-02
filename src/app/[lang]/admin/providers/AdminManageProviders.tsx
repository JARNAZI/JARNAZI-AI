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
  kind: string;
  enabled: boolean;
  env_key: string | null;
  base_url: string | null;
  config: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

type ProviderForm = {
  id?: string;
  name: string;
  kind: string;
  enabled: boolean;
  env_key: string;
  base_url: string;
  config: string; // JSON string
};

const KINDS = ['text', 'image', 'video', 'audio', 'math', 'security'];

export default function AdminManageProviders({ initialProviders }: { initialProviders: unknown[] }) {
  const [providers, setProviders] = useState<ProviderRecord[]>(initialProviders as ProviderRecord[]);
  const [editing, setEditing] = useState<ProviderForm | null>(null);
  const [loading, setLoading] = useState(false);

  const params = useParams();
  const lang = (params as any)?.lang || 'en';
  const dict = useDictionary(String(lang));

  const startNew = () => {
    setEditing({
      name: '',
      kind: 'text',
      base_url: '',
      env_key: '',
      enabled: true,
      config: JSON.stringify({
        provider: 'openai',
        model_id: 'gpt-4o',
        pricing: { input_per_1k_tokens: 2.5, output_per_1k_tokens: 7.5 }
      }, null, 2),
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
      // Best effort: refresh data
      window.location.reload();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : String(error));
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
      toast.error(error instanceof Error ? error.message : String(error));
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
                <span className="text-xs text-muted-foreground">({p.kind})</span>
                {!p.enabled && <span className="text-xs text-destructive font-bold">INACTIVE</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {p.env_key ? <>env: <span className="font-mono">{p.env_key}</span></> : null}
                {p.base_url ? <> • base: <span className="font-mono">{p.base_url}</span></> : null}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setEditing({
                    id: p.id,
                    name: p.name,
                    kind: p.kind,
                    env_key: p.env_key ?? '',
                    base_url: p.base_url ?? '',
                    enabled: p.enabled,
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
              <span className="text-xs text-muted-foreground font-bold uppercase">{dict.adminProviders?.fieldKind ?? 'Kind'}</span>
              <select className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-foreground"
                value={editing.kind}
                onChange={e => setEditing({ ...editing, kind: e.target.value })}
              >
                {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase">{dict.adminProviders?.fieldEnvKey ?? 'Env Key (Edge Secret Name)'}</span>
              <input className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-foreground"
                value={editing.env_key}
                onChange={e => setEditing({ ...editing, env_key: e.target.value })}
                placeholder="OPENAI_API_KEY"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase">{dict.adminProviders?.fieldBaseUrl ?? 'Base URL (optional)'}</span>
              <input className="w-full bg-background/60 border border-border rounded-lg px-3 py-2 text-foreground"
                value={editing.base_url}
                onChange={e => setEditing({ ...editing, base_url: e.target.value })}
                placeholder="https://api.openai.com"
              />
            </label>

            <label className="space-y-1 flex items-center gap-2 mt-6">
              <input type="checkbox" checked={editing.enabled} onChange={e => setEditing({ ...editing, enabled: e.target.checked })} />
              <span className="text-sm text-foreground font-bold">{dict.adminProviders?.fieldActive ?? 'Enabled'}</span>
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground font-bold uppercase">{dict.adminProviders?.fieldConfig ?? 'Config (JSON)'}</span>
            <textarea className="w-full min-h-[160px] bg-background/60 border border-border rounded-lg px-3 py-2 text-foreground font-mono text-xs"
              value={editing.config}
              onChange={e => setEditing({ ...editing, config: e.target.value })}
              placeholder='{"provider":"openai","model_id":"gpt-4o"}'
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

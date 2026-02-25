'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDictionary } from '@/i18n/use-dictionary';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { upsertModel, deleteModel } from './actions';

type ModelRow = {
  id?: string;
  provider?: string;
  model_id?: string;
  enabled?: boolean;
  priority?: number;
  notes?: string;
  capabilities?: unknown;
  cost_profile?: unknown;
  [key: string]: unknown;
};

type EditableModel = {
  id?: string;
  provider: string;
  model_id: string;
  enabled: boolean;
  priority: number;
  notes: string;
  capabilities: string; // JSON string
  cost_profile: string; // JSON string
  [key: string]: unknown;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const toEditable = (m: ModelRow): EditableModel => {
  const cap = isPlainObject(m.capabilities) ? m.capabilities : {};
  const cost = isPlainObject(m.cost_profile) ? m.cost_profile : {};
  return {
    id: typeof m.id === 'string' ? m.id : undefined,
    provider: typeof m.provider === 'string' ? m.provider : 'openai',
    model_id: typeof m.model_id === 'string' ? m.model_id : '',
    enabled: Boolean(m.enabled),
    priority: typeof m.priority === 'number' ? m.priority : 0,
    notes: typeof m.notes === 'string' ? m.notes : '',
    capabilities: JSON.stringify(cap, null, 2),
    cost_profile: JSON.stringify(cost, null, 2),
  };
};

const safeParseJsonObject = (value: string): Record<string, unknown> => {
  try {
    const parsed: unknown = JSON.parse(value);
    return isPlainObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export default function AdminManageModels({ initialModels }: { initialModels: unknown[] }) {
  const [models, setModels] = useState<ModelRow[]>(
    Array.isArray(initialModels) ? (initialModels as ModelRow[]) : [],
  );
  const [editing, setEditing] = useState<EditableModel | null>(null);
  const [loading, setLoading] = useState(false);

  const params = useParams();
  const lang = (params as any)?.lang || 'en';
  const dict = useDictionary(String(lang));

  const startNew = () => {
    setEditing(
      toEditable({
        provider: 'openai',
        model_id: '',
        enabled: true,
        priority: 0,
        notes: '',
        capabilities: { text: true },
        cost_profile: { input_per_1k: 0, output_per_1k: 0 },
      }),
    );
  };

  const startEdit = (m: ModelRow) => {
    setEditing(toEditable(m));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!editing) return;
      const payload = {
        ...editing,
        capabilities: editing.capabilities,
        cost_profile: editing.cost_profile,
      };
      await upsertModel(payload);
      toast.success(dict.adminModels?.modelSaved ?? 'Model saved');
      // Refresh list (simple optimistic refresh)
      const next = models.filter((x) => x.id !== editing.id);
      next.push({
        ...editing,
        capabilities: safeParseJsonObject(editing.capabilities || '{}'),
        cost_profile: safeParseJsonObject(editing.cost_profile || '{}'),
      });
      next.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
      setModels(next);
      setEditing(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? (err instanceof Error ? err.message : String(err)) : 'Failed to save';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(dict.adminModels?.confirmDeleteModel ?? 'Delete this model?')) return;
    setLoading(true);
    try {
      await deleteModel(id);
      setModels(models.filter((m) => m.id !== id));
      toast.success('Deleted');
    } catch (err: unknown) {
      const message = err instanceof Error ? (err instanceof Error ? err.message : String(err)) : 'Failed to delete';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{dict.adminModels?.modelsHeading ?? 'Models'}</h2>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-foreground"
        >
          <Plus className="w-4 h-4" /> {dict.adminModels?.addModel ?? 'Add Model'}
        </button>
      </div>

      <div className="space-y-3">
        {models.map((m) => (
          <div
            key={m.id || `${String(m.provider ?? '')}:${String(m.model_id ?? '')}`}
            className="bg-card/60 border border-border rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-foreground font-medium">
                  {String(m.provider ?? '')} — {String(m.model_id ?? '')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Priority: {m.priority ?? 0} • {m.enabled ? 'Enabled' : 'Disabled'}
                </div>
                {m.notes ? <div className="text-sm text-muted-foreground mt-1">{String(m.notes)}</div> : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(m)}
                  className="p-2 rounded-lg bg-muted/40 hover:bg-muted/60 text-foreground"
                  title={dict.adminModels?.edit ?? 'Edit'}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (typeof m.id === 'string' && m.id) handleDelete(m.id);
                  }}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300"
                  title={dict.adminModels?.delete ?? 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-card/60 border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-foreground font-semibold">
              {editing.id ? (dict.adminModels?.editModel ?? 'Edit Model') : (dict.adminModels?.addModel ?? 'New Model')}
            </div>
            <button type="button" onClick={() => setEditing(null)} className="p-2 rounded-lg bg-muted/40 hover:bg-muted/60 text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <div className="text-sm text-gray-300">Provider</div>
              <input
                value={editing.provider || ''}
                onChange={(e) => setEditing({ ...editing, provider: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background/60 border border-border text-foreground"
                placeholder="openai / gemini / claude / ..."
              />
            </label>
            <label className="space-y-1">
              <div className="text-sm text-gray-300">Model ID</div>
              <input
                value={editing.model_id || ''}
                onChange={(e) => setEditing({ ...editing, model_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background/60 border border-border text-foreground"
                placeholder="gpt-4.1-mini"
              />
            </label>
            <label className="space-y-1">
              <div className="text-sm text-gray-300">Priority</div>
              <input
                type="number"
                value={editing.priority ?? 0}
                onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-background/60 border border-border text-foreground"
              />
            </label>
            <label className="space-y-1 flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(editing.enabled)}
                onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
              />
              <span className="text-sm text-gray-300">{dict.adminModels?.fieldEnabled ?? 'Enabled'}</span>
            </label>
          </div>

          <label className="space-y-1 block">
            <div className="text-sm text-gray-300">Capabilities (JSON)</div>
            <textarea
              value={editing.capabilities || ''}
              onChange={(e) => setEditing({ ...editing, capabilities: e.target.value })}
              className="w-full min-h-[120px] px-3 py-2 rounded-lg bg-background/60 border border-border text-foreground font-mono text-xs"
            />
          </label>

          <label className="space-y-1 block">
            <div className="text-sm text-gray-300">Cost Profile (JSON)</div>
            <textarea
              value={editing.cost_profile || ''}
              onChange={(e) => setEditing({ ...editing, cost_profile: e.target.value })}
              className="w-full min-h-[120px] px-3 py-2 rounded-lg bg-background/60 border border-border text-foreground font-mono text-xs"
            />
          </label>

          <label className="space-y-1 block">
            <div className="text-sm text-gray-300">Notes</div>
            <input
              value={editing.notes || ''}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background/60 border border-border text-foreground"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-foreground disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {dict.adminModels?.save ?? 'Save'}
          </button>
        </form>
      )}
    </div>
  );
}

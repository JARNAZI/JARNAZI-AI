'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { upsertAiCost, deleteAiCost } from './actions';
import { useDictionary } from '@/i18n/use-dictionary';

type CostRow = {
  id?: string;
  provider?: string;
  model?: string;
  cost_type?: string;
  unit?: string;
  cost_per_unit?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

type EditableCost = {
  id?: string;
  provider: string;
  model: string;
  cost_type: string;
  unit: string;
  cost_per_unit: string;
  is_active: boolean;
};

const toEditable = (c: CostRow): EditableCost => ({
  id: typeof c.id === 'string' ? c.id : undefined,
  provider: typeof c.provider === 'string' ? c.provider : '',
  model: typeof c.model === 'string' ? c.model : '',
  cost_type: typeof c.cost_type === 'string' ? c.cost_type : 'text',
  unit: typeof c.unit === 'string' ? c.unit : 'per_1k_tokens',
  cost_per_unit: typeof c.cost_per_unit === 'number' ? String(c.cost_per_unit) : '0',
  is_active: Boolean(c.is_active ?? true),
});

export default function AdminManageCosts({ initialCosts }: { initialCosts: unknown[] }) {
  const [costs, setCosts] = useState<CostRow[]>(Array.isArray(initialCosts) ? (initialCosts as CostRow[]) : []);
  const [editing, setEditing] = useState<EditableCost | null>(null);
  const [loading, setLoading] = useState(false);

  const params = useParams();
  const lang = (params as any)?.lang || 'en';
  const dict = useDictionary(String(lang));

  const sorted = useMemo(() => {
    const next = [...costs];
    next.sort((a, b) => {
      const ap = (a.provider ?? '').toString().localeCompare((b.provider ?? '').toString());
      if (ap !== 0) return ap;
      const at = (a.cost_type ?? '').toString().localeCompare((b.cost_type ?? '').toString());
      if (at !== 0) return at;
      return (a.model ?? '').toString().localeCompare((b.model ?? '').toString());
    });
    return next;
  }, [costs]);

  const startNew = () => {
    setEditing(
      toEditable({
        provider: 'openai',
        model: 'default',
        cost_type: 'text',
        unit: 'per_1k_tokens',
        cost_per_unit: 0.0002,
        is_active: true,
      }),
    );
  };

  const startEdit = (c: CostRow) => setEditing(toEditable(c));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    try {
      const cost = Number(editing.cost_per_unit);
      if (!Number.isFinite(cost) || cost < 0) throw new Error('cost_per_unit must be a non-negative number');

      const payload = { ...editing, cost_per_unit: cost };
      await upsertAiCost({ ...payload, lang });

      const next = costs.filter((x) => x.id !== editing.id);
      next.push({ ...editing, cost_per_unit: cost });
      setCosts(next);
      setEditing(null);
      toast.success(dict?.adminCosts?.saved ?? 'Cost saved');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm(dict?.adminCosts?.confirmDelete ?? 'Delete this cost row?')) return;

    setLoading(true);
    try {
      await deleteAiCost(id);
      setCosts(costs.filter((c) => c.id !== id));
      toast.success(dict?.adminCosts?.deleted ?? 'Deleted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const closeEditor = () => setEditing(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {dict?.adminCosts?.hint ??
            'These rates are used by the pricing engine to estimate real API costs (USD per unit).'}
        </div>

        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          {dict?.adminCosts?.add ?? 'Add rate'}
        </button>
      </div>

      <div className="overflow-x-auto border border-border rounded-xl bg-card/40">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left p-3">Provider</th>
              <th className="text-left p-3">Model</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Unit</th>
              <th className="text-left p-3">Cost / unit (USD)</th>
              <th className="text-left p-3">Active</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-muted-foreground">
                  No rates yet.
                </td>
              </tr>
            ) : (
              sorted.map((c) => (
                <tr key={String(c.id ?? Math.random())} className="border-t border-border/60">
                  <td className="p-3">{String(c.provider ?? '')}</td>
                  <td className="p-3">{String(c.model ?? '')}</td>
                  <td className="p-3">{String(c.cost_type ?? '')}</td>
                  <td className="p-3">{String(c.unit ?? '')}</td>
                  <td className="p-3 tabular-nums">{typeof c.cost_per_unit === 'number' ? c.cost_per_unit : ''}</td>
                  <td className="p-3">{c.is_active ? 'Yes' : 'No'}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/70 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(typeof c.id === 'string' ? c.id : undefined)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-background border border-border shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">{editing.id ? 'Edit rate' : 'New rate'}</div>
              <button onClick={closeEditor} className="p-2 rounded-lg hover:bg-muted transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1">
                  <div className="text-xs text-muted-foreground">Provider</div>
                  <input
                    value={editing.provider}
                    onChange={(e) => setEditing({ ...editing, provider: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="openai"
                    required
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-xs text-muted-foreground">Model</div>
                  <input
                    value={editing.model}
                    onChange={(e) => setEditing({ ...editing, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="gpt-4o-mini"
                    required
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-xs text-muted-foreground">Type</div>
                  <input
                    value={editing.cost_type}
                    onChange={(e) => setEditing({ ...editing, cost_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="text"
                    required
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-xs text-muted-foreground">Unit</div>
                  <input
                    value={editing.unit}
                    onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="per_1k_tokens"
                    required
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <div className="text-xs text-muted-foreground">Cost per unit (USD)</div>
                  <input
                    value={editing.cost_per_unit}
                    onChange={(e) => setEditing({ ...editing, cost_per_unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background tabular-nums"
                    placeholder="0.0002"
                    required
                  />
                </label>

                <label className="flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

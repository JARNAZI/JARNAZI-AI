'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { upsertModel, deleteModel } from './actions';

export default function AdminManageModels({ initialModels }: { initialModels: any[] }) {
  const [models, setModels] = useState(initialModels);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const startNew = () => {
    setEditing({
      provider: 'openai',
      model_id: '',
      enabled: true,
      priority: 0,
      notes: '',
      capabilities: JSON.stringify({ text: true }, null, 2),
      cost_profile: JSON.stringify({ input_per_1k: 0, output_per_1k: 0 }, null, 2),
    });
  };

  const startEdit = (m: any) => {
    setEditing({
      ...m,
      capabilities: JSON.stringify(m.capabilities ?? {}, null, 2),
      cost_profile: JSON.stringify(m.cost_profile ?? {}, null, 2),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...editing,
        capabilities: editing.capabilities,
        cost_profile: editing.cost_profile,
      };
      await upsertModel(payload);
      toast.success('Model saved');
      // Refresh list (simple optimistic refresh)
      const next = models.filter((x) => x.id !== editing.id);
      next.push({ ...editing, capabilities: JSON.parse(editing.capabilities || '{}'), cost_profile: JSON.parse(editing.cost_profile || '{}') });
      next.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
      setModels(next);
      setEditing(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this model?')) return;
    setLoading(true);
    try {
      await deleteModel(id);
      setModels(models.filter((m) => m.id !== id));
      toast.success('Deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Models</h2>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          <Plus className="w-4 h-4" /> Add Model
        </button>
      </div>

      <div className="space-y-3">
        {models.map((m) => (
          <div key={m.id || (m.provider + m.model_id)} className="bg-zinc-900/60 border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-white font-medium">{m.provider} — {m.model_id}</div>
                <div className="text-sm text-gray-400">Priority: {m.priority ?? 0} • {m.enabled ? 'Enabled' : 'Disabled'}</div>
                {m.notes ? <div className="text-sm text-gray-400 mt-1">{m.notes}</div> : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(m)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-zinc-900/60 border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold">{editing.id ? 'Edit Model' : 'New Model'}</div>
            <button type="button" onClick={() => setEditing(null)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <div className="text-sm text-gray-300">Provider</div>
              <input
                value={editing.provider || ''}
                onChange={(e) => setEditing({ ...editing, provider: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white"
                placeholder="openai / gemini / claude / ..."
              />
            </label>
            <label className="space-y-1">
              <div className="text-sm text-gray-300">Model ID</div>
              <input
                value={editing.model_id || ''}
                onChange={(e) => setEditing({ ...editing, model_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white"
                placeholder="gpt-4.1-mini"
              />
            </label>
            <label className="space-y-1">
              <div className="text-sm text-gray-300">Priority</div>
              <input
                type="number"
                value={editing.priority ?? 0}
                onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white"
              />
            </label>
            <label className="space-y-1 flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(editing.enabled)}
                onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
              />
              <span className="text-sm text-gray-300">Enabled</span>
            </label>
          </div>

          <label className="space-y-1 block">
            <div className="text-sm text-gray-300">Capabilities (JSON)</div>
            <textarea
              value={editing.capabilities || ''}
              onChange={(e) => setEditing({ ...editing, capabilities: e.target.value })}
              className="w-full min-h-[120px] px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs"
            />
          </label>

          <label className="space-y-1 block">
            <div className="text-sm text-gray-300">Cost Profile (JSON)</div>
            <textarea
              value={editing.cost_profile || ''}
              onChange={(e) => setEditing({ ...editing, cost_profile: e.target.value })}
              className="w-full min-h-[120px] px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs"
            />
          </label>

          <label className="space-y-1 block">
            <div className="text-sm text-gray-300">Notes</div>
            <input
              value={editing.notes || ''}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </form>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { updateSetting } from '@/app/[lang]/admin/settings/actions';
import { toast } from 'sonner';
import { Loader2, Plus, Edit2, Trash2, X, Check, Save } from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    price: number; // in cents or whole dollars depending on implementation, previously seen as display string or number number
    tokens: number;
    description: string;
    features: string[];
    highlight?: boolean;
    label?: string;
}

interface PlansEditorProps {
    settings: Record<string, any>;
}

const DEFAULT_PLANS: Plan[] = [
    {
        id: 'starter',
        name: 'Starter Pack',
        price: 14,
        tokens: 42,
        description: 'Perfect for casual debates and occasional queries.',
        features: ['42 Consensus Tokens', 'Access to GPT-4o & Claude 3', 'Basic Image Generation', 'Tokens Never Expire', 'Email Summaries']
    },
    {
        id: 'producer',
        name: 'Producer Plan',
        price: 50,
        tokens: 155,
        description: 'For power users requiring frequent AI collaboration.',
        features: ['155 Consensus Tokens', 'Access to All Neural Nodes', 'High-Res Image Generation', 'Priority Processing', 'Tokens Never Expire'],
        highlight: true,
        label: 'Most Popular'
    },
    {
        id: 'creator',
        name: 'Pro Creator',
        price: 330,
        tokens: 1050,
        description: 'Ultimate toolkit for professional content generation.',
        features: ['1050 Consensus Tokens', 'Top-Tier Priority Access (Tier 1)', '4K Video Generation', 'Dedicated Support Channel', 'Commercial Usage Rights', 'Tokens Never Expire']
    }
];

export default function PlansEditor({ settings }: PlansEditorProps) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [editing, setEditing] = useState<Plan | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        try {
            const val = settings['token_plans']?.value;
            if (val) {
                setPlans(JSON.parse(val));
            } else {
                setPlans(DEFAULT_PLANS);
            }
        } catch (e) {
            console.error("Failed to parse plans JSON", e);
            setPlans(DEFAULT_PLANS);
        }
    }, [settings]);

    const savePlans = async (newPlans: Plan[]) => {
        setSaving(true);
        try {
            await updateSetting('token_plans', JSON.stringify(newPlans, null, 2));
            setPlans(newPlans);
            setEditing(null);
            toast.success('Plans updated successfully');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        if (!confirm('Delete this plan?')) return;
        const newPlans = plans.filter(p => p.id !== id);
        savePlans(newPlans);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;

        // Validation
        const newPlans = [...plans];
        const index = newPlans.findIndex(p => p.id === editing.id);

        if (index >= 0) {
            // Update existing
            newPlans[index] = editing;
        } else {
            // Add new
            newPlans.push(editing);
        }

        savePlans(newPlans);
    };

    return (
        <section className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full" />
                Token Plans
            </h2>

            {!editing && (
                <button
                    onClick={() => setEditing({
                        id: `plan_${Date.now()}`,
                        name: 'New Plan',
                        price: 1999,
                        tokens: 100,
                        description: '',
                        features: ['Feature 1']
                    })}
                    className="mb-6 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
                >
                    <Plus className="w-4 h-4" /> Add Plan
                </button>
            )}

            {editing && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">{plans.find(p => p.id === editing.id) ? 'Edit Plan' : 'New Plan'}</h3>
                        <button onClick={() => setEditing(null)} type="button"><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
                    </div>

                    <form onSubmit={handleSaveEdit} className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="text-xs text-gray-400">ID (Unique)</label>
                            <input
                                required
                                value={editing.id}
                                onChange={e => setEditing({ ...editing, id: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs text-gray-400">Name</label>
                            <input
                                required
                                value={editing.name}
                                onChange={e => setEditing({ ...editing, name: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs text-gray-400">Price (e.g. $19.99 or 1999)</label>
                            {/* Assuming string for price display based on previous page view which had '$14' string, but plans.ts had numbers. Adapting to flexibility. */}
                            <input
                                required
                                value={editing.price}
                                onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs text-gray-400">Token Amount</label>
                            <input
                                required
                                type="number"
                                value={editing.tokens}
                                onChange={e => setEditing({ ...editing, tokens: parseInt(e.target.value) || 0 })}
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-gray-400">Description</label>
                            <input
                                required
                                value={editing.description}
                                onChange={e => setEditing({ ...editing, description: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-gray-400">Features (Comma separated)</label>
                            <textarea
                                value={editing.features?.join(', ')}
                                onChange={e => setEditing({ ...editing, features: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-white h-20"
                            />
                        </div>

                        <div className="col-span-2 flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editing.highlight}
                                    onChange={e => setEditing({ ...editing, highlight: e.target.checked })}
                                    className="rounded border-gray-600 bg-gray-800 text-indigo-500"
                                />
                                <span className="text-sm text-gray-300">Highlight (Most Popular)</span>
                            </label>
                            {editing.highlight && (
                                <input
                                    placeholder="Label (e.g. Best Value)"
                                    value={editing.label || ''}
                                    onChange={e => setEditing({ ...editing, label: e.target.value })}
                                    className="bg-black/50 border border-white/10 rounded p-1 text-sm text-white"
                                />
                            )}
                        </div>

                        <div className="col-span-2 mt-4 flex gap-3">
                            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 rounded text-white font-medium flex items-center gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Plan
                            </button>
                            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded text-gray-300">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-black/20 border border-white/5 p-4 rounded-xl relative group hover:border-indigo-500/30 transition-all">
                        {plan.highlight && (
                            <span className="absolute -top-3 left-4 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                                {plan.label || 'Popular'}
                            </span>
                        )}
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-white">{plan.name}</h3>
                            <div className="flex gap-1 opactiy-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditing(plan)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"><Edit2 className="w-3 h-3" /></button>
                                <button onClick={() => handleDelete(plan.id)} className="p-1.5 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="text-xl font-bold text-white">${plan.price}</div>
                            <div className="text-xs text-indigo-400 font-medium">{plan.tokens} Tokens</div>
                        </div>
                        <ul className="space-y-1 mb-2">
                            {plan.features?.slice(0, 3).map((f, i) => (
                                <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-500/50" /> {f}
                                </li>
                            ))}
                            {plan.features?.length > 3 && <li className="text-xs text-gray-600 italic">+{plan.features.length - 3} more</li>}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
}

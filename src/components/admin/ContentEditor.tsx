'use client';

import { useState, useEffect } from 'react';
import { updateSetting } from '@/app/[lang]/admin/settings/actions';
import { toast } from 'sonner';
import { Loader2, Save, Type } from 'lucide-react';

interface ContentEditorProps {
    settings: any;
    onUpdate?: (key: string, value: string) => void;
}

const CONTENT_KEYS = [
    { key: 'home_hero_title', label: 'Homepage Hero Title', default: 'Debate with AI, Reach Consensus' },
    { key: 'home_hero_subtitle', label: 'Homepage Hero Subtitle', default: 'Engage in thought-provoking discussions with advanced AI models.' },
    { key: 'pricing_header_title', label: 'Pricing Page Title', default: 'Invest in Intelligence' },
    { key: 'pricing_header_subtitle', label: 'Pricing Page Subtitle', default: 'Purchase tokens to fuel your AI debates and content generation.' },
    { key: 'footer_copyright', label: 'Footer Copyright', default: '© 2024 Jarnazi. All rights reserved.' },
];

export default function ContentEditor({ settings, onUpdate }: ContentEditorProps) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<string | null>(null);

    // Initialize/Sync values from props
    useEffect(() => {
        const next: Record<string, string> = {};
        CONTENT_KEYS.forEach(k => {
            next[k.key] = settings[k.key]?.value || k.default;
        });
        setValues(next);
    }, [settings]);

    const handleSave = async (key: string) => {
        const newVal = values[key];
        // Don't save if it hasn't changed from what's in settings
        if (newVal === (settings[key]?.value || (CONTENT_KEYS.find(ck => ck.key === key)?.default))) return;

        setSaving(key);
        try {
            await updateSetting(key, newVal);
            if (onUpdate) onUpdate(key, newVal);
            toast.success(`${key} saved`);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to save');
        } finally {
            setSaving(null);
        }
    };

    return (
        <section className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-pink-500 rounded-full" />
                Site Content Editor
            </h2>

            <div className="space-y-6">
                {CONTENT_KEYS.map((item) => (
                    <div key={item.key} className="grid md:grid-cols-4 gap-4 items-start border-b border-white/5 pb-6 last:border-0 last:pb-0">
                        <div className="md:col-span-1">
                            <label className="text-sm font-medium text-white flex items-center gap-2">
                                <Type className="w-4 h-4 text-pink-400" />
                                {item.label}
                            </label>
                            <code className="text-[10px] text-gray-500 mt-1 block font-mono">{item.key}</code>
                        </div>
                        <div className="md:col-span-3 flex gap-2">
                            <textarea
                                value={values[item.key] || ''}
                                onChange={(e) => setValues({ ...values, [item.key]: e.target.value })}
                                onBlur={() => handleSave(item.key)}
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white resize-y min-h-[120px] focus:border-pink-500 outline-none transition-all"
                                placeholder={`Enter ${item.label}...`}
                            />
                            <button
                                onClick={() => handleSave(item.key)}
                                disabled={saving === item.key || values[item.key] === (settings[item.key]?.value || item.default)}
                                className="h-10 w-10 shrink-0 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                title="Save Changes"
                            >
                                {saving === item.key ? <Loader2 className="w-4 h-4 animate-spin text-pink-500" /> : <Save className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

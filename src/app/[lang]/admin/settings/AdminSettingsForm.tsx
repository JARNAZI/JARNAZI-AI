
'use client';

import { useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDictionary } from '@/i18n/use-dictionary';
import { updateSetting, uploadLogo } from './actions';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import PaymentGateways from '@/components/admin/PaymentGateways';
import PlansEditor from '@/components/admin/PlansEditor';
import ContentEditor from '@/components/admin/ContentEditor';
import AdminProfile from '@/components/admin/AdminProfile';

export default function AdminSettingsForm({ initialSettings }: { initialSettings: Record<string, unknown> }) {
    type SettingRow = { value: string;[k: string]: unknown };
    type SettingsMap = Record<string, SettingRow>;

    const normalizedInitialSettings: SettingsMap = useMemo(() => {
        const out: SettingsMap = {};
        for (const [k, v] of Object.entries(initialSettings ?? {})) {
            if (v && typeof v === 'object' && 'value' in (v as Record<string, unknown>)) {
                out[k] = v as SettingRow;
            } else {
                out[k] = { value: String((v as any) ?? '') };
            }
        }
        return out;
    }, [initialSettings]);

    const [settings, setSettings] = useState<SettingsMap>(normalizedInitialSettings);
    const [saving, setSaving] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const params = useParams();
    const lang = (params as any)?.lang || 'en';
    const dict = useDictionary(String(lang));
    const d = dict.admin?.settings || {};

    const handleUpdate = async (key: string, value: string) => {
        setSaving(key);
        try {
            await updateSetting(key, value);
            setSettings((prev) => ({
                ...prev,
                [key]: {
                    ...(prev[key] && typeof prev[key] === 'object' ? prev[key] : ({ value: '' } as SettingRow)),
                    value,
                },
            }));
            toast.success('Setting updated');
        } catch (error: any) {
            toast.error((error instanceof Error ? error.message : String(error)));
        } finally {
            setSaving(null);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setSaving('logo');

        const formData = new FormData();
        formData.append('logo', e.target.files[0]);

        try {
            const { url } = await uploadLogo(formData);
            // Optimistic update
            setSettings((prev) => ({
                ...prev,
                logo_url: {
                    ...(prev.logo_url && typeof prev.logo_url === 'object' ? prev.logo_url : ({ value: '' } as SettingRow)),
                    value: url,
                },
            }));
            toast.success('Logo uploaded');
        } catch (error: any) {
            toast.error((error instanceof Error ? error.message : String(error)));
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-8">

            {/* General Config */}
            <section className="bg-white/5 border border-white/10 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-indigo-500 rounded-full" />
                    {d.title || 'General Configuration'}
                </h2>

                <div className="space-y-6">
                    {/* Free Trial Toggle */}
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                        <div>
                            <div className="text-white font-medium">{d.enableFreeTrial || 'Enable Free Trial'}</div>
                            <div className="text-sm text-gray-400">{d.freeTrialDesc || 'Allow new users to debate without purchasing tokens initially.'}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings['enable_free_trial']?.value === 'true'}
                                onChange={(e) => handleUpdate('enable_free_trial', e.target.checked ? 'true' : 'false')}
                                disabled={saving === 'enable_free_trial'}
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {/* Site Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{d.siteTitle || 'Site Title'}</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                defaultValue={settings['site_title']?.value || ''}
                                onBlur={(e) => {
                                    if (e.target.value !== settings['site_title']?.value) {
                                        handleUpdate('site_title', e.target.value);
                                    }
                                }}
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
                            />
                            {saving === 'site_title' && <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />}
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{d.siteLogo || 'Site Logo'}</label>
                        <div className="flex items-start gap-6">
                            <div className="w-20 h-20 bg-black/50 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden relative group">
                                {settings['logo_url']?.value ? (
                                    <Image
                                        src={settings['logo_url'].value}
                                        alt="Logo"
                                        fill
                                        className="object-contain p-2"
                                    />
                                ) : (
                                    <span className="text-xs text-gray-500">{d.noLogo || 'No Logo'}</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={saving === 'logo'}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors text-sm font-medium text-white mb-2 disabled:opacity-50"
                                >
                                    {saving === 'logo' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {d.uploadLogo || 'Upload New Logo'}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoUpload}
                                />
                                <p className="text-xs text-gray-500">{d.logoDesc || 'Recommended size: 512x512px. PNG or JPG.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Debate Cost & Rounds */}
            <div className="p-4 bg-black/20 rounded-lg space-y-3">
                <div>
                    <div className="text-white font-medium">{d.debateRounds || 'Debate Rounds'}</div>
                    <div className="text-sm text-gray-400">{d.debateRoundsDesc || 'Limits how many back-and-forth rounds AIs will run (prevents infinite debates).'}</div>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min={1}
                        max={10}
                        className="w-28 px-3 py-2 rounded-md bg-black/40 border border-white/10 text-white"
                        value={settings['debate_rounds']?.value ?? '2'}
                        onChange={(e) => setSettings((p) => ({ ...p, debate_rounds: { ...(p.debate_rounds ?? { value: '' }), value: e.target.value } }))}
                    />
                    <button
                        className="px-3 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-60"
                        disabled={saving === 'debate_rounds'}
                        onClick={() => handleUpdate('debate_rounds', settings['debate_rounds']?.value ?? '2')}
                    >
                        {saving === 'debate_rounds' ? (d.saving || 'Saving...') : (d.save || 'Save')}
                    </button>
                </div>

                <div className="pt-3 border-t border-white/10" />

                <div>
                    <div className="text-white font-medium">{d.tokenCostPerTurn || 'Token Cost Per Turn'}</div>
                    <div className="text-sm text-gray-400">{d.tokenCostDesc || 'How many tokens to charge per AI response per round.'}</div>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min={1}
                        max={50}
                        className="w-28 px-3 py-2 rounded-md bg-black/40 border border-white/10 text-white"
                        value={settings['debate_cost_per_turn']?.value ?? '1'}
                        onChange={(e) => setSettings((p) => ({ ...p, debate_cost_per_turn: { ...(p.debate_cost_per_turn ?? { value: '' }), value: e.target.value } }))}
                    />
                    <button
                        className="px-3 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-60"
                        disabled={saving === 'debate_cost_per_turn'}
                        onClick={() => handleUpdate('debate_cost_per_turn', settings['debate_cost_per_turn']?.value ?? '1')}
                    >
                        {saving === 'debate_cost_per_turn' ? (d.saving || 'Saving...') : (d.save || 'Save')}
                    </button>
                </div>

                <div className="pt-3 border-t border-white/10" />

                <div>
                    <div className="text-white font-medium">{d.mediaOverhead || 'Media Overhead'}</div>
                    <div className="text-sm text-gray-400">{d.mediaOverheadDesc || 'Extra tokens added when the request involves image/video/file planning.'}</div>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min={0}
                        max={50}
                        className="w-28 px-3 py-2 rounded-md bg-black/40 border border-white/10 text-white"
                        value={settings['debate_media_overhead']?.value ?? '2'}
                        onChange={(e) => setSettings((p) => ({ ...p, debate_media_overhead: { ...(p.debate_media_overhead ?? { value: '' }), value: e.target.value } }))}
                    />
                    <button
                        className="px-3 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-60"
                        disabled={saving === 'debate_media_overhead'}
                        onClick={() => handleUpdate('debate_media_overhead', settings['debate_media_overhead']?.value ?? '2')}
                    >
                        {saving === 'debate_media_overhead' ? (d.saving || 'Saving...') : (d.save || 'Save')}
                    </button>
                </div>

                <div className="pt-3 border-t border-white/10" />

                <div>
                    <div className="text-white font-medium">{d.baseCost || 'Base Cost'}</div>
                    <div className="text-sm text-gray-400">{d.baseCostDesc || 'Flat token cost added to every debate message.'}</div>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min={0}
                        max={50}
                        className="w-28 px-3 py-2 rounded-md bg-black/40 border border-white/10 text-white"
                        value={settings['debate_base_cost']?.value ?? '1'}
                        onChange={(e) => setSettings((p) => ({ ...p, debate_base_cost: { ...(p.debate_base_cost ?? { value: '' }), value: e.target.value } }))}
                    />
                    <button
                        className="px-3 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-60"
                        disabled={saving === 'debate_base_cost'}
                        onClick={() => handleUpdate('debate_base_cost', settings['debate_base_cost']?.value ?? '1')}
                    >
                        {saving === 'debate_base_cost' ? (d.saving || 'Saving...') : (d.save || 'Save')}
                    </button>
                </div>
            </div>

            {/* Payment Gateways */}
            <PaymentGateways settings={settings} onUpdate={handleUpdate} />

            {/* Token Plans Editor */}
            <PlansEditor settings={settings} />

            {/* Site Content Editor */}
            <ContentEditor settings={settings} />

            {/* Admin Profile */}
            <AdminProfile />

            {/* Email Config */}
            <section className="bg-white/5 border border-white/10 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-yellow-500 rounded-full" />
                    Email Configuration
                </h2>
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Support Email (Display Sender)</label>
                        <input
                            type="email"
                            placeholder="support@yourdomain.com"
                            defaultValue={settings['email_from_address']?.value || ''}
                            onBlur={(e) => handleUpdate('email_from_address', e.target.value)}
                            className="w-full bg-black/50 border border-border rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                    Important: Ensure the "From Address" is verified in your Resend account. If empty, the system will use defaults.
                </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                    <h3 className="font-semibold text-white mb-4">{d.privacyPolicy || 'Privacy Policy (Markdown)'}</h3>
                    <textarea
                        rows={10}
                        defaultValue={settings['privacy_policy']?.value || ''}
                        onBlur={(e) => handleUpdate('privacy_policy', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-sm text-gray-300 outline-none focus:border-indigo-500 resize-y"
                    />
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                    <h3 className="font-semibold text-white mb-4">{d.termsOfService || 'Terms of Service (Markdown)'}</h3>
                    <textarea
                        rows={10}
                        defaultValue={settings['terms_of_service']?.value || ''}
                        onBlur={(e) => handleUpdate('terms_of_service', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-sm text-gray-300 outline-none focus:border-indigo-500 resize-y"
                    />
                </div>
            </section>

        </div>
    );
}

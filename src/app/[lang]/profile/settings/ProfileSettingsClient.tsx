'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Save, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSettingsClient({
    dict,
    lang,
    supabaseUrl,
    supabaseAnonKey
}: {
    dict: any;
    lang: string;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
}) {
    const d = dict?.dashboard || {};
    const router = useRouter();
    const [supabase] = useState(() => createClient({ supabaseUrl, supabaseAnonKey }));

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(`/${lang}/login`);
                return;
            }
            setEmail(user.email || '');

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (profile) {
                setFullName(profile.full_name || '');
            }
            setLoading(false);
        };
        fetchProfile();
    }, [supabase, router, lang]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user.id);

            if (error) throw error;

            toast.success(dict.common?.saveSuccess || "Profile updated successfully");
            router.refresh();
        } catch (err: any) {
            console.error("Error updating profile:", err);
            toast.error(err.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
            <div className="max-w-2xl mx-auto text-left">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">{d.backToConsole || "Back to Console"}</span>
                </button>

                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                        {d.accountSettings?.split(' ')[0] || "Account"} <span className="text-indigo-500">{d.accountSettings?.split(' ')[1] || "Settings"}</span>
                    </h1>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{d.manageProfile || "Manage your profile and presence"}</p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl">
                        <div className="space-y-6">
                            {/* Email Field (Read Only) */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 ml-1">{dict.auth?.email || "Email Address"} ({dict.common?.primary || "Primary"})</label>
                                <div className="relative flex items-center">
                                    <Mail className="absolute left-4 w-5 h-5 text-muted-foreground/50" />
                                    <input
                                        type="text"
                                        value={email}
                                        disabled
                                        className="w-full bg-muted border border-border rounded-2xl pl-12 pr-4 py-4 text-muted-foreground font-medium cursor-not-allowed"
                                    />
                                    <CheckCircle2 className="absolute right-4 w-4 h-4 text-emerald-500/50" />
                                </div>
                                <p className="text-[9px] text-muted-foreground/60 mt-2 ml-1 uppercase font-bold tracking-tighter">{d.identityVerified || "Identity is verified via Supabase Auth"}</p>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 ml-1">{d.displayName || "Display Name"}</label>
                                <div className="relative flex items-center group">
                                    <User className="absolute left-4 w-5 h-5 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder={d.enterFullName || "Enter your full name..."}
                                        className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 py-4 text-foreground focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center gap-3 shadow-xl"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {d.synchronizing || "Synchronizing..."}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {d.commitChanges || "Commit Changes"}
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-16 p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10">
                    <h3 className="text-foreground font-black uppercase tracking-widest text-xs mb-2">{d.privacySecurity || "Privacy & Security"}</h3>
                    <p className="text-muted-foreground text-[10px] leading-relaxed font-bold uppercase tracking-tight">
                        {d.privacyDesc || "Your data is encrypted at rest and in transit. Jarnazi AI does not share your identity with third-party providers. All deliberation logs are anonymized unless explicitly shared."}
                    </p>
                </div>
            </div>
        </div>
    );
}

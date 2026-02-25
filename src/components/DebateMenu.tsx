"use client";

import { Menu, Moon, Sun, Mail, Archive, CreditCard, Coins, User, Zap, Shield } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "./ui/custom-dropdown";
import { LANGUAGES, type LanguageCode } from "@/i18n/config";
import { useDictionary } from "@/i18n/use-dictionary";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export function DebateMenu() {
    const router = useRouter();
    const pathname = usePathname();
    const { setTheme, theme } = useTheme();
    const [balance, setBalance] = useState<number | null>(null);
    const [subscription, setSubscription] = useState<string>('Free');
    const [role, setRole] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);

    const lang = (pathname?.split('/')[1] || 'en') as LanguageCode;
    const dict = useDictionary(lang);
    const t = dict?.debateMenu || {};

    useEffect(() => {
        let channel: any;

        const fetchProfile = async () => {
            console.log("DebateMenu: Checking Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            console.log("DebateMenu: User", user, "Auth Error:", authError);

            if (user) {
                // Fallback to app_metadata role initially
                const metaRole = user.app_metadata?.role || null;
                console.log("DebateMenu: App Metadata Role:", metaRole);
                setRole(metaRole);

                const { data: profile, error: dbError } = await supabase
                    .from('profiles')
                    .select('token_balance_cents, subscription_tier, role')
                    .eq('id', user.id)
                    .single();

                console.log("DebateMenu: DB Profile:", profile, "DB Error:", dbError);

                if (profile) {
                    setBalance(profile.token_balance_cents);
                    setSubscription(profile.subscription_tier || 'Free');
                    // Prefer profile role if available
                    if (profile.role) {
                        console.log("DebateMenu: Setting Role from DB:", profile.role);
                        setRole(profile.role);
                    }
                }

                channel = supabase
                    .channel(`menu_profile_${user.id}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}`
                    }, (payload) => {
                        console.log("DebateMenu: Realtime Update:", payload);
                        if (payload.new.token_balance_cents !== undefined) setBalance(payload.new.token_balance_cents);
                        if (payload.new.subscription_tier !== undefined) setSubscription(payload.new.subscription_tier);
                        if (payload.new.role !== undefined) {
                            console.log("DebateMenu: Realtime Role Update:", payload.new.role);
                            setRole(payload.new.role);
                        }
                    })
                    .subscribe();
            }
        };

        fetchProfile();
        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [supabase]);

    const isAdmin = role === 'admin';

    return (
        <Dropdown
            align="left"
            trigger={
                <button className="p-2 text-foreground/80 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-colors border border-transparent hover:border-border/50" title={t.menuTitle ?? "Menu"}>
                    <Menu className="w-6 h-6" />
                </button>
            }
        >
            {/* User Info Header */}
            <div className="p-3 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-background rounded-xl border border-primary/20 mb-2 mx-2">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">{t.tierLabel ?? "Tier"}</p>
                        <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary" />
                            <span className="font-bold text-foreground text-sm">{subscription}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/10">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t.balanceLabel ?? "Balance"}</p>
                    <div className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="font-mono font-bold text-foreground text-sm">{balance?.toLocaleString() ?? '...'}</span>
                    </div>
                </div>
            </div>

            <DropdownSeparator />

            {/* Main Navigation */}
            {isAdmin && (
                <>
                    <DropdownItem onClick={() => router.push(`/${lang}/admin`)} icon={Shield} className="text-red-500 font-bold bg-red-500/10 hover:bg-red-500/20">
                        {dict?.adminDashboard?.title || "Admin Dashboard"}
                    </DropdownItem>
                    <DropdownSeparator />
                </>
            )}

            <DropdownItem onClick={() => router.push(`/${lang}/neural-hub`)} icon={Zap}>
                {t.neuralHub ?? "Neural Hub"}
            </DropdownItem>

            <DropdownItem onClick={() => router.push(`/${lang}/debate/usage`)} icon={Coins} className="bg-indigo-500/10 text-indigo-400 font-bold">
                {t.myTokens ?? "My Tokens"}
            </DropdownItem>

            <DropdownSeparator />

            <DropdownItem onClick={() => router.push(`/${lang}/profile/settings`)} icon={User}>
                {t.editUserData ?? "Edit User Data"}
            </DropdownItem>

            <DropdownItem onClick={() => router.push(`/${lang}/debate/saved`)} icon={Archive}>
                {t.savedAssets ?? "Saved Assets"}
            </DropdownItem>

            <DropdownSeparator />

            <DropdownItem onClick={() => router.push(`/${lang}/debate/pricing`)} icon={CreditCard}>
                {t.pricing ?? "Pricing"}
            </DropdownItem>

            <DropdownItem
                onClick={() => router.push(`/${lang}/buy-tokens`)}
                icon={Coins}
            >
                {t.purchaseCredits ?? "Purchase Credits"}
            </DropdownItem>

            <DropdownSeparator />

            {/* Settings Section */}
            <DropdownLabel>{t.systemLabel ?? "System"}</DropdownLabel>

            <DropdownItem
                onClick={() => {
                    const nextTheme = theme === 'dark' ? 'light' : 'dark';
                    setTheme(nextTheme);
                }}
                icon={theme === 'dark' ? Sun : Moon}
            >
                {theme === 'dark' ? (t.lightSpectrum ?? 'Light Spectrum') : (t.darkSpectrum ?? 'Dark Spectrum')}
            </DropdownItem>

            <DropdownLabel>{t.languageLabel ?? "Language"}</DropdownLabel>
            <div className="max-h-32 overflow-y-auto custom-scrollbar">
                {LANGUAGES.map(l => (
                    <DropdownItem
                        key={l.code}
                        onClick={() => {
                            const segments = pathname.split('/');
                            segments[1] = l.code;
                            const nextLang = l.code;
                            try { document.cookie = `NEXT_LOCALE=${nextLang}; path=/; max-age=${60 * 60 * 24 * 365}` } catch { }
                            router.push(segments.join('/'));
                            router.refresh();
                        }}
                    >
                        <span className="mr-2">{l.flag}</span> {l.name}
                    </DropdownItem>
                ))}
            </div>

            <DropdownSeparator />
            <DropdownItem onClick={() => router.push(`/${lang}/contact`)} icon={Mail}>
                {t.contactSupport ?? "Contact Support"}
            </DropdownItem>

        </Dropdown>
    );
}

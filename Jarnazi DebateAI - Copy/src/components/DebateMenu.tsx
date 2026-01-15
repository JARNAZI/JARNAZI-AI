"use client";

import { Menu, Moon, Sun, Mail, Archive, CreditCard, Coins, User, Settings, FileText } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "./ui/custom-dropdown";
import { LANGUAGES } from "@/i18n/config";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function DebateMenu() {
    const router = useRouter();
    const pathname = usePathname();
    const { setTheme, theme } = useTheme();
    const [balance, setBalance] = useState<number | null>(null);
    const [subscription, setSubscription] = useState<string>('Free');
    const supabase = createClient();

    const lang = pathname?.split('/')[1] || 'en';

    useEffect(() => {
        let channel: any;

        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('token_balance, subscription_tier').eq('id', user.id).single();
                if (profile) {
                    setBalance(profile.token_balance);
                    setSubscription(profile.subscription_tier || 'Free');
                }

                channel = supabase
                    .channel(`menu_profile_${user.id}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}`
                    }, (payload) => {
                        if (payload.new.token_balance !== undefined) setBalance(payload.new.token_balance);
                        if (payload.new.subscription_tier !== undefined) setSubscription(payload.new.subscription_tier);
                    })
                    .subscribe();
            }
        };

        fetchProfile();
        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    return (
        <Dropdown
            align="left"
            trigger={
                <button className="p-2 text-foreground/80 hover:text-foreground hover:bg-foreground/10 rounded-lg transition-colors border border-transparent hover:border-border/50" title="Menu">
                    <Menu className="w-6 h-6" />
                </button>
            }
        >
            {/* User Info Header */}
            <div className="p-3 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-background rounded-xl border border-primary/20 mb-2 mx-2">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Plan</p>
                        <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary" />
                            <span className="font-bold text-foreground text-sm">{subscription}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Tokens</p>
                        <div className="flex items-center justify-end gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-yellow-500" />
                            <span className="font-mono font-bold text-foreground text-sm">{balance?.toLocaleString() ?? '...'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <DropdownSeparator />

            {/* Plans Button */}
            <DropdownItem
                onClick={() => router.push(`/${lang}/debate/pricing`)}
                icon={CreditCard}
                className="font-bold text-primary" // Highlighted
            >
                Plans & Pricing
            </DropdownItem>

            <DropdownItem onClick={() => router.push(`/${lang}/debate/saved`)} icon={Archive}>
                Saved Assets
            </DropdownItem>

            <DropdownSeparator />

            {/* Settings Section */}
            <DropdownLabel>Settings</DropdownLabel>

            <DropdownItem
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                icon={theme === 'dark' ? Sun : Moon}
            >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </DropdownItem>

            <DropdownLabel>Language</DropdownLabel>
            <div className="max-h-32 overflow-y-auto custom-scrollbar">
                {LANGUAGES.map(l => (
                    <DropdownItem
                        key={l.code}
                        onClick={() => {
                            const segments = pathname.split('/');
                            segments[1] = l.code;
                            try { document.cookie = `NEXT_LOCALE=${l.code}; path=/; max-age=${60*60*24*365}` } catch (e) {}
                            router.push(segments.join('/'));
                        }}
                    >
                        <span className="mr-2">{l.flag}</span> {l.name}
                    </DropdownItem>
                ))}
            </div>

            <DropdownSeparator />
            <DropdownItem onClick={() => router.push(`/${lang}/contact`)} icon={Mail}>
                Contact Support
            </DropdownItem>

        </Dropdown>
    );
}

'use client';

import { useState } from 'react';
import { updateSetting } from '@/app/[lang]/admin/settings/actions';
import { toast } from 'sonner';
import { CreditCard, Loader2 } from 'lucide-react';

interface PaymentGatewaysProps {
    settings: any;
    onUpdate?: (key: string, value: string) => void;
}

export default function PaymentGateways({ settings, onUpdate }: PaymentGatewaysProps) {
    // Helper to safely get boolean value from setting object or string
    const getBool = (key: string) => {
        const val = settings[key]?.value;
        return val === 'true' || val === true;
    };

    const [gateways, setGateways] = useState({
        stripe: getBool('gateway_stripe_enabled'),
        nowpayments: getBool('gateway_nowpayments_enabled'),
    });
    const [saving, setSaving] = useState<string | null>(null);

    // Sync with props
    useEffect(() => {
        setGateways({
            stripe: getBool('gateway_stripe_enabled'),
            nowpayments: getBool('gateway_nowpayments_enabled'),
        });
    }, [settings]);

    const handleToggle = async (gateway: 'stripe' | 'nowpayments', checked: boolean) => {
        const key = `gateway_${gateway}_enabled`;
        const val = String(checked);
        setSaving(key);
        try {
            if (onUpdate) {
                await onUpdate(key, val);
            } else {
                await updateSetting(key, val);
            }
            setGateways(prev => ({ ...prev, [gateway]: checked }));
            toast.success(`${gateway === 'nowpayments' ? 'NowPayments' : 'Stripe'} ${checked ? 'enabled' : 'disabled'}`);
        } catch (error: any) {
            toast.error((error instanceof Error ? error.message : String(error)));
        } finally {
            setSaving(null);
        }
    };

    return (
        <section className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-emerald-500 rounded-full" />
                Payment Gateways
            </h2>

            <div className="space-y-4">
                {/* Stripe */}
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <CreditCard className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <div className="text-white font-medium">Stripe Payments</div>
                            <div className="text-sm text-gray-400">Enable credit card processing via Stripe.</div>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={gateways.stripe}
                            onChange={(e) => handleToggle('stripe', e.target.checked)}
                            disabled={saving === 'gateway_stripe_enabled'}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        {saving === 'gateway_stripe_enabled' && <Loader2 className="absolute -right-8 w-4 h-4 animate-spin text-gray-400" />}
                    </label>
                </div>

                {/* NowPayments */}
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <span className="text-blue-400 font-bold px-1">N</span>
                        </div>
                        <div>
                            <div className="text-white font-medium">NowPayments</div>
                            <div className="text-sm text-gray-400">Enable crypto payments via NowPayments.</div>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={gateways.nowpayments}
                            onChange={(e) => handleToggle('nowpayments', e.target.checked)}
                            disabled={saving === 'gateway_nowpayments_enabled'}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        {saving === 'gateway_nowpayments_enabled' && <Loader2 className="absolute -right-8 w-4 h-4 animate-spin text-gray-400" />}
                    </label>
                </div>
            </div>
        </section>
    );
}

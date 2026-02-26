'use client';

import { useState, useEffect } from 'react';
import { updateSetting } from '@/app/[lang]/admin/settings/actions';
import { toast } from 'sonner';
import { CreditCard, Loader2 } from 'lucide-react';

interface PaymentGatewaysProps {
    settings: any;
    onUpdate?: (key: string, value: string) => void;
}

export default function PaymentGateways({ settings, onUpdate }: PaymentGatewaysProps) {
    const [saving, setSaving] = useState<string | null>(null);

    const isStripeEnabled = 
        settings['gateway_stripe_enabled']?.value === 'true' || 
        settings['payments_stripe_enabled']?.value === 'true';

    const isNowpaymentsEnabled = 
        settings['gateway_nowpayments_enabled']?.value === 'true' || 
        settings['payments_nowpayments_enabled']?.value === 'true';

    const isStripeTestMode = settings['stripe_test_mode']?.value === 'true';

    const handleToggle = async (key: string, checked: boolean) => {
        // Find existing key if it's the alternate one
        let targetKey = key;
        if (key === 'gateway_stripe_enabled' && !settings[key] && settings['payments_stripe_enabled']) {
            targetKey = 'payments_stripe_enabled';
        } else if (key === 'gateway_nowpayments_enabled' && !settings[key] && settings['payments_nowpayments_enabled']) {
            targetKey = 'payments_nowpayments_enabled';
        }

        const val = String(checked);
        setSaving(key); // UI shows loading for the primary key
        try {
            if (onUpdate) {
                await onUpdate(targetKey, val);
            } else {
                await updateSetting(targetKey, val);
            }
            toast.success(`Setting updated`);
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
                <div className="flex flex-col gap-4 p-4 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-between">
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
                                checked={isStripeEnabled}
                                onChange={(e) => handleToggle('gateway_stripe_enabled', e.target.checked)}
                                disabled={saving === 'gateway_stripe_enabled'}
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            {saving === 'gateway_stripe_enabled' && <Loader2 className="absolute -right-8 w-4 h-4 animate-spin text-gray-400" />}
                        </label>
                    </div>

                    {isStripeEnabled && (
                        <div className="mt-2 flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="text-sm text-gray-300">
                                <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${isStripeTestMode ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                                    {isStripeTestMode ? 'Test Mode' : 'Live Mode'}
                                </span>
                                <p className="mt-1 text-xs text-gray-500">Route payments to Stripe {isStripeTestMode ? 'Sandbox' : 'Production'}.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isStripeTestMode}
                                    onChange={(e) => handleToggle('stripe_test_mode', e.target.checked)}
                                    disabled={saving === 'stripe_test_mode'}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                {saving === 'stripe_test_mode' && <Loader2 className="absolute -right-8 w-4 h-4 animate-spin text-gray-400" />}
                            </label>
                        </div>
                    )}
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
                            checked={isNowpaymentsEnabled}
                            onChange={(e) => handleToggle('gateway_nowpayments_enabled', e.target.checked)}
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

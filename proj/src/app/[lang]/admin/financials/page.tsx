import Link from 'next/link';
import { ExternalLink, CreditCard } from 'lucide-react';

// Removed createClient since we are not fetching secrets from DB anymore
export default async function FinancialsPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-6">Financials</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {/* Stripe */}
                <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <CreditCard className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="font-semibold text-gray-200">Stripe Dashboard</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">View revenue, subscriptions, and payouts directly in Stripe.</p>
                    <Link
                        href="https://dashboard.stripe.com"
                        target="_blank"
                        className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        Go to Stripe <ExternalLink className="w-4 h-4" />
                    </Link>
                </div>

                {/* NowPayments */}
                <div className="p-6 rounded-xl bg-gray-900 border border-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <span className="text-blue-400 font-bold px-1 text-lg">N</span>
                        </div>
                        <h3 className="font-semibold text-gray-200">NowPayments</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">Crypto payments are managed via Supabase Edge Functions.</p>
                    <div className="flex flex-col gap-2">
                        <Link
                            href="https://account.nowpayments.io/"
                            target="_blank"
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            Go to NowPayments <ExternalLink className="w-4 h-4" />
                        </Link>
                        <span className="text-xs text-gray-600 mt-2">
                            Secrets managed via <code>.env.local</code> / Edge Secrets
                        </span>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-gray-500 text-sm">
                Note: In production mode, detailed transaction history should be accessed via the Payment Provider Dashboards.
            </p>
        </div>
    );
}

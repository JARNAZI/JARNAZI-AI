import { createClient } from '@/lib/supabase/server';
import { BadgeCheck, XCircle } from 'lucide-react';

export default async function HealthPage() {
    const supabase = await createClient();

    // Check DB connection
    const start = Date.now();
    const { error } = await supabase.from('profiles').select('count').limit(1).single();
    const latency = Date.now() - start;

    const dbStatus = error ? 'error' : 'healthy';

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-6">System Health</h1>

            <div className="space-y-4 max-w-lg">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                        <h3 className="text-gray-200 font-medium">Database Connection</h3>
                        <p className="text-sm text-gray-500">Supabase Latency: {latency}ms</p>
                    </div>
                    {dbStatus === 'healthy' ? (
                        <div className="flex items-center gap-2 text-green-400">
                            <BadgeCheck className="w-5 h-5" />
                            <span>Operational</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-400">
                            <XCircle className="w-5 h-5" />
                            <span>Error</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                        <h3 className="text-gray-200 font-medium">Environment</h3>
                        <p className="text-sm text-gray-500">Node Environment</p>
                    </div>
                    <div className="text-gray-300 font-mono">
                        {process.env.NODE_ENV}
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                        <h3 className="text-gray-200 font-medium">Stripe Configuration</h3>
                        <p className="text-sm text-gray-500">API Keys Present</p>
                    </div>
                    <div className="text-gray-300">
                        {process.env.STRIPE_SECRET_KEY ? 'Yes' : 'No'}
                    </div>
                </div>
            </div>
        </div>
    );
}

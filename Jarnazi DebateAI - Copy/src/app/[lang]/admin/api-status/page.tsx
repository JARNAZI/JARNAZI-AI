'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function APIStatusPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            setStatus(data);
        } catch (error: any) {
            setStatus({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-white">API Configuration Status</h1>
                <button
                    onClick={checkStatus}
                    disabled={loading}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Check Status
                </button>
            </div>

            {status && (
                <div className="space-y-6">
                    {/* Overall Status */}
                    <div className={`p-4 rounded-xl border ${status.ready
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                        }`}>
                        <div className="flex items-center gap-2">
                            {status.ready ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                            )}
                            <span className={status.ready ? 'text-green-200' : 'text-red-200'}>
                                {status.message}
                            </span>
                        </div>
                    </div>

                    {/* Individual Provider Status */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Provider Configuration</h2>
                        <div className="space-y-2">
                            {status.configured && Object.entries(status.configured).map(([key, value]: [string, any]) => {
                                if (key === 'timestamp') return null;
                                return (
                                    <div key={key} className="flex items-center justify-between p-3 bg-black/50 rounded-lg">
                                        <span className="text-gray-300 capitalize font-mono text-sm">
                                            {key.replace('_', ' ')}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {value ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                    <span className="text-green-400 text-sm">Configured</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                                                    <span className="text-yellow-400 text-sm">Not Set</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Instructions */}
                    {!status.ready && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                            <h3 className="text-white font-semibold mb-2">Configuration Required</h3>
                            <p className="text-blue-200 text-sm mb-3">
                                To use AI providers in debates, configure API keys in your environment:
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-200">
                                <li>Add API keys to <code className="bg-black/50 px-1 rounded">.env.local</code> (local dev)</li>
                                <li>Or configure in Supabase Edge Function Secrets (production)</li>
                                <li>Restart the dev server or redeploy</li>
                            </ol>
                        </div>
                    )}
                </div>
            )}

            {!status && (
                <div className="text-center py-12 text-gray-500">
                    Click "Check Status" to verify API configuration
                </div>
            )}
        </div>
    );
}

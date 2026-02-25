import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import UserManagementPanel from './UserManagementPanel';
import StaffManagementPanel from './StaffManagementPanel';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function UserDetailsPage(props: { params: Promise<{ lang: string; id: string }> }) {
    const params = await props.params;
    const lang = params.lang;
    const supabase = await createClient();

    // Fetch profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', params.id).single();
    if (!profile) notFound();

    // Fetch stats
    const { count: debateCount } = await supabase.from('debates').select('*', { count: 'exact', head: true }).eq('user_id', params.id);
    const { count: msgCount } = await supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('user_id', params.id);

    // Fetch recent transactions
    const { data: transactions } = await supabase.from('transactions')
        .select('*')
        .eq('user_id', params.id)
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <Link href={`/${lang}/admin/users`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Users
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card border border-border p-6 rounded-xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">{profile.full_name}</h1>
                                <code className="text-gray-500 bg-black/20 px-2 py-1 rounded">{profile.email}</code>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-sm font-medium">
                                    {profile.role}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs ${profile.is_banned ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                    {profile.is_banned ? 'Banned' : 'Active'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                            <div className="text-center p-4 bg-white/5 rounded-lg">
                                <div className="text-2xl font-mono text-white mb-1">{profile.token_balance}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Tokens</div>
                            </div>
                            <div className="text-center p-4 bg-white/5 rounded-lg">
                                <div className="text-2xl font-mono text-white mb-1">{debateCount || 0}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Debates</div>
                            </div>
                            <div className="text-center p-4 bg-white/5 rounded-lg">
                                <div className="text-2xl font-mono text-white mb-1">{msgCount || 0}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Messages</div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions */}
                    <div className="bg-card border border-border p-6 rounded-xl">
                        <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
                        {!transactions || transactions.length === 0 ? (
                            <p className="text-gray-500">No transactions found.</p>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                        <div>
                                            <div className="text-white font-medium">{tx.type}</div>
                                            <div className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <div className={`text-sm font-mono ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount} Tokens
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Panel */}
                <div className="space-y-6">
                    <UserManagementPanel user={profile} />
                    <StaffManagementPanel user={profile} />
                </div>
            </div>
        </div>
    );
}

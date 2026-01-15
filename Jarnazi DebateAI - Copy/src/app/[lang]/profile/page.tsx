import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, Coins, MessageSquare, Clock } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function ProfilePage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 2. Fetch Profile Data
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // 3. Fetch Recent Debates
    const { data: debates } = await supabase
        .from('debates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <div className="min-h-screen bg-black text-white pt-20 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-3xl font-bold">
                        {profile?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{profile?.full_name || 'Anonymous User'}</h1>
                        <p className="text-gray-400">{profile?.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                                {profile?.role}
                            </span>
                            {profile?.is_banned && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
                                    BANNED
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 text-indigo-400">
                            <Coins className="w-6 h-6" />
                            <h3 className="font-semibold">Token Balance</h3>
                        </div>
                        <div className="text-4xl font-bold">{profile?.token_balance}</div>
                        <p className="text-sm text-gray-500 mt-2">Available for debates</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 text-cyan-400">
                            <MessageSquare className="w-6 h-6" />
                            <h3 className="font-semibold">Total Debates</h3>
                        </div>
                        <div className="text-4xl font-bold">{debates?.length ?? 0}</div> {/* In reality should be count */}
                        <p className="text-sm text-gray-500 mt-2">Sessions orchestrated</p>
                    </div>
                </div>

                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    Recent Activity
                </h2>

                <div className="space-y-4">
                    {debates?.map((debate) => (
                        <Link
                            key={debate.id}
                            href={`/debate?id=${debate.id}`} // Future: Link to history view
                            className="block bg-white/5 border border-white/10 p-5 rounded-xl hover:border-indigo-500/50 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-lg">{debate.topic}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full border ${debate.status === 'completed'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                    {debate.status}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                                {new Date(debate.created_at).toLocaleDateString()} at {new Date(debate.created_at).toLocaleTimeString()}
                            </div>
                        </Link>
                    ))}

                    {(!debates || debates.length === 0) && (
                        <div className="text-center py-12 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                            No debates found. Start your first session!
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

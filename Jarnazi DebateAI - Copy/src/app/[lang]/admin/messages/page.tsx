import { createClient } from '@/lib/supabase/server'
import { Mail, Reply, CheckCircle, Clock } from 'lucide-react'
import ReplyModal from '@/components/admin/ReplyModal'

export const dynamic = 'force-dynamic'

export default async function AdminMessagesPage(props: { params: Promise<{ lang: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    const { data: messages, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return <div className="p-8 text-red-500">Error loading messages: {error.message}</div>
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-8">Inbox</h1>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {!messages || messages.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        No messages yet.
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {messages.map((msg) => (
                            <div key={msg.id} className="p-6 hover:bg-white/5 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${msg.status === 'replied' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`} />
                                        <h3 className="font-semibold text-white text-lg">{msg.subject}</h3>
                                        {msg.status === 'replied' && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Replied
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {new Date(msg.created_at).toLocaleString()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-[1fr,auto] gap-8">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                                            <span className="text-gray-300 font-medium">{msg.name}</span>
                                            <span>&lt;{msg.email}&gt;</span>
                                        </div>
                                        <p className="text-gray-300 leading-relaxed bg-black/20 p-4 rounded-lg border border-white/5">
                                            {msg.message}
                                        </p>

                                        {msg.admin_reply && (
                                            <div className="mt-4 ml-8 relative before:absolute before:left-[-16px] before:top-0 before:bottom-0 before:w-[2px] before:bg-indigo-500/20">
                                                <div className="text-xs text-indigo-400 mb-1 flex items-center gap-1">
                                                    <Reply className="w-3 h-3" />
                                                    Reply sent on {new Date(msg.updated_at).toLocaleDateString()}
                                                </div>
                                                <p className="text-gray-400 text-sm">{msg.admin_reply}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        {msg.status !== 'replied' && (
                                            <ReplyModal messageId={msg.id} recipientName={msg.name} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

import { createClient } from '@/lib/supabase/server';
import { Mail, CheckCircle } from 'lucide-react';
import ReplyModal from '@/components/admin/ReplyModal';
import { getDictionary } from '@/i18n/getDictionary';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  const dict = await getDictionary(lang);

  const supabase = await createClient();

  const { data: messages, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-destructive">
        {dict.adminMessages?.loadError ?? 'Error loading messages:'} {error.message}
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">{dict.adminMessages?.title ?? 'Inbox'}</h1>

      <div className="bg-card/60 border border-border rounded-xl overflow-hidden">
        {!messages || messages.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            {dict.adminMessages?.empty ?? 'No messages yet.'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {messages.map((msg: any) => (
              <div key={msg.id} className="p-6 hover:bg-muted/30 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        msg.status === 'replied' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-foreground">{msg.name}</div>
                      <div className="text-sm text-muted-foreground">{msg.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {msg.status === 'replied' && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                        <CheckCircle className="w-3 h-3" />
                        {dict.adminMessages?.replied ?? 'Replied'}
                      </span>
                    )}
                    <ReplyModal messageId={msg.id} recipientName={msg.name} />
                  </div>
                </div>

                <div className="text-sm text-foreground/90 whitespace-pre-wrap">{msg.message}</div>
                <div className="text-xs text-muted-foreground mt-3">
                  {new Date(msg.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

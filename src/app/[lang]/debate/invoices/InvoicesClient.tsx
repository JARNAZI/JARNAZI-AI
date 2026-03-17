'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Receipt, 
  ArrowLeft, 
  Loader2, 
  Clock, 
  CreditCard,
  History
} from 'lucide-react';

export default function InvoicesClient({ dict, lang, supabaseUrl, supabaseAnonKey }: { dict: any; lang: string; supabaseUrl?: string; supabaseAnonKey?: string }) {
  const t = dict?.invoices || {};
  const d = dict?.dashboard || {};
  const router = useRouter();
  const [supabase] = useState(() => createClient({ supabaseUrl, supabaseAnonKey }));

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        
        if (userErr || !user) {
          console.warn('[Invoices] User not authenticated, redirecting...', userErr);
          router.push(`/${lang}/login`);
          return;
        }

        console.log('[Invoices] Fetching records for user:', user.id);

        // Fetch from token_ledger for positive amounts (purchases/grants)
        const { data, error } = await supabase
          .from('token_ledger')
          .select('*')
          .eq('user_id', user.id)
          .gt('amount', 0)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Invoices] Database error fetching ledger:', error);
          // Try without gt filter as fallback to see if anything exists
          const { data: anyData } = await supabase.from('token_ledger').select('id').eq('user_id', user.id).limit(1);
          console.log('[Invoices] Any records exist for user?', !!anyData?.length);
        } else if (data) {
          console.log(`[Invoices] Successfully retrieved ${data.length} records`);
          setTransactions(data);
        }
      } catch (err) {
        console.error('[Invoices] Unexpected error in fetchInvoices:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [supabase, router, lang]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isRtl = lang.startsWith('ar');

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-5xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        <button
          onClick={() => router.push(`/${lang}/debate/usage`)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className={`w-4 h-4 transition-transform ${isRtl ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
          <span className="text-xs font-black uppercase tracking-widest">{t.backToUsage || "Back to Liquidity"}</span>
        </button>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">
              {t.title || "Billing History"}
            </span>
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.3em]">
            {t.subtitle || "Historical transaction records"}
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-[2rem] p-12 text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <History className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold mb-2">{t.noInvoices || "No transaction records found."}</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Any future token purchases will appear here as official receipts.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.date || "Date"}
                    </th>
                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.tokens || "Tokens"}
                    </th>
                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.method || "Method"}
                    </th>
                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.status || "Status"}
                    </th>
                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground ${isRtl ? 'text-center' : 'text-center'}`}>
                      {t.download || "Action"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => {
                    const date = new Date(tx.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });
                    
                    const description = tx.description?.toLowerCase() || '';
                    const isStripe = description.includes('stripe');
                    const isNowPayments = description.includes('nowpayments') || description.includes('crypto');
                    const isGrant = description.includes('grant') || description.includes('admin');

                    let method = "System";
                    if (isStripe) method = "Stripe";
                    else if (isNowPayments) method = "NowPayments";
                    else if (isGrant) method = "Admin Grant";

                    return (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-muted-foreground/50" />
                            <span className="text-sm font-bold">{date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-black text-cyan-500">+{tx.amount?.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                             <span className="text-[10px] font-black uppercase tracking-wider">{method}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-bold uppercase tracking-wider">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            {t.completed || "Completed"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button
                            onClick={() => router.push(`/${lang}/debate/invoices/${tx.id}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted-foreground hover:text-white transition-all rounded-xl text-[10px] font-black uppercase tracking-widest"
                          >
                            <Receipt className="w-3 h-3" />
                            {dict?.debate?.view || "View"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

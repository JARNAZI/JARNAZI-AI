'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Loader2, 
  Printer, 
  Fingerprint,
  Calendar,
  User,
  Zap,
  ShieldCheck,
  CreditCard,
  ExternalLink
} from 'lucide-react';

export default function InvoiceDetailClient({ id, dict, lang, supabaseUrl, supabaseAnonKey }: { id: string; dict: any; lang: string; supabaseUrl?: string; supabaseAnonKey?: string }) {
  const t = dict?.invoices || {};
  const d = dict?.dashboard || {};
  const router = useRouter();
  const [supabase] = useState(() => createClient({ supabaseUrl, supabaseAnonKey }));

  const [loading, setLoading] = useState(true);
  const [tx, setTx] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${lang}/login`);
        return;
      }

      // 1. Fetch Transaction
      const { data: txData } = await supabase
        .from('token_ledger')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      // 2. Fetch User Profile
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (txData) {
        setTx(txData);
        setProfile(profData);
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase, router, lang, id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <ArrowLeft className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Record Not Found</h2>
        <button onClick={() => router.back()} className="text-primary font-bold uppercase tracking-widest text-xs py-3 px-6 border border-primary/20 rounded-xl hover:bg-primary/5">
          Go Back
        </button>
      </div>
    );
  }

  const isRtl = lang.startsWith('ar');
  const date = new Date(tx.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const description = tx.description?.toLowerCase() || '';
  const isStripe = description.includes('stripe');
  const isNowPayments = description.includes('nowpayments') || description.includes('crypto');
  const method = isStripe ? "Credit Card (Stripe)" : (isNowPayments ? "Crypto (NowPayments)" : "Admin Allocation");

  return (
    <div className="min-h-screen bg-[#080b11] text-foreground p-4 md:p-12">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; background: white !important; color: black !important; }
          #printable-invoice, #printable-invoice * { visibility: visible !important; }
          #printable-invoice { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            padding: 40px !important; 
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .no-print { display: none !important; }
          #printable-invoice .text-primary { color: black !important; border-bottom: 2px solid #EEE !important; padding-bottom: 10px !important; }
          #printable-invoice .bg-card, #printable-invoice .bg-muted { background: transparent !important; border: 1px solid #EEE !important; }
        }
      `}} />

      <div className="max-w-4xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Navigation / Actions (Hidden on Print) */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className={`w-4 h-4 transition-transform ${isRtl ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
            <span className="text-xs font-black uppercase tracking-widest">{dict?.common?.back || "Back"}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-xl"
            >
              <Printer className="w-3.5 h-3.5" />
              {t.print || "Print Invoice"}
            </button>
          </div>
        </div>

        {/* The Actual Invoice (Glassmorphism on Web, Simple on Print) */}
        <div 
          id="printable-invoice"
          className="bg-card border border-border rounded-[2.5rem] p-8 md:p-16 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl no-print" />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16 pb-8 border-b border-border">
              <div>
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-primary-foreground fill-current" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter uppercase">JARNAZI AI</span>
                 </div>
                 <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">{t.issuedBy || "Issued By"} Jarnazi Network</p>
              </div>
              <div className={`text-right md:${isRtl ? 'text-left' : 'text-right'}`}>
                 <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">{t.invoiceNumber || "Invoice"}</h2>
                 <p className="text-primary font-black tracking-widest text-[10px] uppercase">#{tx.id.split('-')[0].toUpperCase()}-{tx.id.split('-').pop().toUpperCase()}</p>
              </div>
            </div>

            {/* Meta Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
               <div className="space-y-6">
                  <div>
                    <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                       <User className="w-3 h-3 text-primary" /> {t.billTo || "Bill To"}
                    </h3>
                    <p className="text-lg font-bold">{profile?.full_name || 'Valued Resident'}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email || 'authenticated-user@jarnazi.com'}</p>
                  </div>
                  <div>
                    <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                       <Fingerprint className="w-3 h-3 text-primary" /> {dict?.dashboard?.accessLevel || "Access Level"}
                    </h3>
                    <p className="text-xs font-black uppercase tracking-widest">{profile?.role || 'FREE'}</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                       <Calendar className="w-3 h-3 text-primary" /> {t.date || "Issued Date"}
                    </h3>
                    <p className="text-lg font-bold">{date}</p>
                  </div>
                  <div>
                    <h3 className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                       <CreditCard className="w-3 h-3 text-primary" /> {t.method || "Payment Method"}
                    </h3>
                    <p className="text-xs font-black uppercase tracking-widest">{method}</p>
                  </div>
               </div>
            </div>

            {/* Line Items Table */}
            <div className="mb-16">
               <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                       <tr className="border-b-2 border-border">
                          <th className={`py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>{t.description || "Description"}</th>
                          <th className="py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground text-center">Qty</th>
                          <th className={`py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground ${isRtl ? 'text-left' : 'text-right'}`}>{t.total || "Total Credits"}</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                       <tr>
                          <td className="py-8">
                             <p className="text-lg font-bold">Consensus Network Credits</p>
                             <p className="text-xs text-muted-foreground mt-1">{tx.description || "Credit allocation for deliberation services"}</p>
                          </td>
                          <td className="py-8 text-center text-sm font-bold">1</td>
                          <td className={`py-8 text-lg font-black text-cyan-500 ${isRtl ? 'text-left' : 'text-right'}`}>
                             {tx.amount?.toLocaleString()} <span className="text-[10px] uppercase ml-1">Tokens</span>
                          </td>
                       </tr>
                    </tbody>
                  </table>
               </div>
            </div>

            {/* Footer Summary */}
            <div className={`p-8 bg-muted/30 border border-border rounded-3xl flex flex-col md:flex-row justify-between items-center gap-8`}>
               <div className="flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest">{t.status || "Status"}</p>
                    <p className="text-emerald-500 font-bold uppercase tracking-tight text-xl">{t.completed || "Verified & Settled"}</p>
                  </div>
               </div>
               <div className={`text-center md:${isRtl ? 'text-left' : 'text-right'}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t.total || "Final Balance Impact"}</p>
                  <p className="text-4xl font-black text-white">{tx.amount?.toLocaleString()} <span className="text-sm font-bold text-primary">TOKENS</span></p>
               </div>
            </div>

            <div className="mt-16 pt-12 border-t border-border text-center">
               <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.25em] mb-4">
                 {t.thankYou || "Thank you for using Jarnazi AI Consensus."}
               </p>
               <div className="flex justify-center gap-4 text-[9px] font-black uppercase tracking-widest text-primary/40">
                  <span>Jarnazi.com</span>
                  <span>•</span>
                  <span>Autonomous Ledger Verified</span>
                  <span>•</span>
                  <span>v5.7.0</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

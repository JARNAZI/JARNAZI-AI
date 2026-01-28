'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { submitContactForm } from '@/app/actions/contact';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { DEFAULT_LANGUAGE, type LanguageCode } from '@/i18n/config';
import { useDictionary } from '@/i18n/use-dictionary';

const initialState = {
    success: false,
    error: undefined,
};

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                    <Send className="w-4 h-4" />
                    {label}
                </>
            )}
        </button>
    );
}

export default function ContactPage() {
    const params = useParams();
    const lang = ((params as any)?.lang as LanguageCode) || DEFAULT_LANGUAGE;
    const dict = useDictionary(lang);
    const t = dict?.contactPage || {};

    const [state, formAction] = useFormState(submitContactForm, initialState);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.success) {
            toast.success(t.sentToast || 'Message sent successfully! We will get back to you shortly.');
            formRef.current?.reset();
        } else if (state.error) {
            toast.error(state.error);
        }
    }, [state]);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="w-full max-w-lg bg-card/50 border border-border p-8 rounded-2xl shadow-2xl backdrop-blur-xl relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {t.title || 'Contact Us'}
                    </h1>
                    <p className="text-muted-foreground mt-2">{t.subtitle || 'Questions, feedback, or inquiries?'}</p>
                </div>

                <form ref={formRef} action={formAction} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t.name || 'Name'}</label>
                            <input
                                name="name"
                                type="text"
                                required
                                maxLength={25}
                                placeholder={t.namePh || "Max 25 chars"}
                                className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-muted-foreground/60"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t.subject || 'Subject'}</label>
                            <input
                                name="subject"
                                type="text"
                                required
                                maxLength={20}
                                placeholder={t.subjectPh || "Max 20 chars"}
                                className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-muted-foreground/60"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">{t.email || 'Email'}</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder={t.emailPh || "you@example.com"}
                            className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-muted-foreground/60"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">{t.message || 'Message'}</label>
                        <textarea
                            name="message"
                            required
                            maxLength={250}
                            placeholder={t.messagePh || "How can we help? (Max 250 chars)"}
                            rows={5}
                            className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-muted-foreground/60 resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">{t.max250 || 'Max 250 characters'}</p>
                    </div>

                    <SubmitButton label={t.send || 'Send Message'} />
                </form>
            </div>
        </div>
    );
}

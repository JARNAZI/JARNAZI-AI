'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { submitContactForm } from '@/app/actions/contact';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useRef, use } from 'react';

const initialState = {
    success: false,
    error: undefined,
};

function SubmitButton() {
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
                    Send Message
                </>
            )}
        </button>
    );
}

export default function ContactPage(props: { params: Promise<{ lang: string }> }) {
    const params = use(props.params);
    const [state, formAction] = useFormState(submitContactForm, initialState);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.success) {
            toast.success('Message sent successfully! We will get back to you shortly.');
            formRef.current?.reset();
        } else if (state.error) {
            toast.error(state.error);
        }
    }, [state]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="w-full max-w-lg bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-xl relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Contact Us
                    </h1>
                    <p className="text-gray-400 mt-2">Questions, feedback, or inquiries?</p>
                </div>

                <form ref={formRef} action={formAction} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Name</label>
                            <input
                                name="name"
                                type="text"
                                required
                                maxLength={25}
                                placeholder="Max 25 chars"
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Subject</label>
                            <input
                                name="subject"
                                type="text"
                                required
                                maxLength={20}
                                placeholder="Max 20 chars"
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Message</label>
                        <textarea
                            name="message"
                            required
                            maxLength={250}
                            placeholder="How can we help? (Max 250 chars)"
                            rows={5}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600 resize-none"
                        />
                        <p className="text-xs text-gray-500 text-right">Max 250 characters</p>
                    </div>

                    <SubmitButton />
                </form>
            </div>
        </div>
    );
}

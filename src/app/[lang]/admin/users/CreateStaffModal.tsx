'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDictionary } from '@/i18n/use-dictionary';
import { createSupportStaff } from './staff-actions';
import { toast } from 'sonner';
import { UserPlus, Loader2, X } from 'lucide-react';

export default function CreateStaffModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const params = useParams();
    const lang = (params as any)?.lang || 'en';
    const dict = useDictionary(String(lang));

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createSupportStaff(email, password, name);
            toast.success(dict.adminUsers?.staffCreated ?? 'Staff user created/updated successfully');
            setIsOpen(false);
        } catch (error: unknown) {
            toast.error((error instanceof Error ? error.message : String(error)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
                <UserPlus className="w-4 h-4" /> Create Staff
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-[#18181b] border border-border rounded-xl shadow-2xl p-6 relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-foreground mb-4">Add Staff Member</h3>
                        <p className="text-sm text-gray-400 mb-6">Create a new user with limited admin access (Support). If the email exists, the user will be promoted.</p>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                                <input
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-black/50 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-foreground font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create & Grant Access
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

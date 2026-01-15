'use client';

import { useState } from 'react';
import { updateAdminProfile } from '@/app/[lang]/admin/settings/actions';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, Save } from 'lucide-react';

export default function AdminProfile() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateAdminProfile({
                email: email || undefined,
                password: password || undefined
            });
            toast.success('Profile updated. You may need to login again if you changed your email.');
            setEmail('');
            setPassword('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-orange-500 rounded-full" />
                Admin Profile
            </h2>

            <form onSubmit={handleUpdate} className="space-y-4 max-w-md">
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-200 mb-4">
                    Leave fields empty if you don't want to change them.
                </div>

                <div>
                    <label className="text-sm font-medium text-white flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-gray-400" /> New Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="new-admin@example.com"
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-orange-500"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-white flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-gray-400" /> New Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-orange-500"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading || (!email && !password)}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Update Credentials
                    </button>
                </div>
            </form>
        </section>
    );
}

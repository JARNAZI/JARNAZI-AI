'use client';

import { useState } from 'react';
import { Loader2, Ban, Trash2, LogIn, Coins, X, Check } from 'lucide-react';
import { impersonateUser, toggleBanUser } from '../privileged-actions';
import { performDeleteUser } from '../privileged-actions';
import { grantTokens } from '../token-actions';
import { toast } from 'sonner';

const GRANT_REASONS = [
    "Compensation",
    "Loyalty reward",
    "Campaign",
    "Support resolution",
    "Special sales"
];

export default function UserManagementPanel({ user }: { user: any }) {
    const [loading, setLoading] = useState<string | null>(null);
    const [grantMode, setGrantMode] = useState(false);

    // Grant state
    const [tokens, setTokens] = useState(10);
    const [reason, setReason] = useState(GRANT_REASONS[0]);
    const [notify, setNotify] = useState(true);

    const handleImpersonate = async () => {
        if (!confirm("Are you sure you want to login as this user? You will be redirected.")) return;
        setLoading('impersonate');
        try {
            const { url } = await impersonateUser(user.id);
            window.location.href = url;
        } catch (error: any) {
            toast.error(error.message);
            setLoading(null);
        }
    };

    const handleDelete = async () => {
        const confirmText = prompt(`Type "DELETE" to confirm deleting ${user.email} forever.`);
        if (confirmText !== 'DELETE') return;

        setLoading('delete');
        try {
            const res = await performDeleteUser(user.id);
            if (res.success) {
                toast.success('User deleted');
                window.location.href = '/admin/users';
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to delete');
            setLoading(null);
        }
    };

    const handleBan = async () => {
        setLoading('ban');
        try {
            await toggleBanUser(user.id, !user.is_banned);
            toast.success(user.is_banned ? 'User unbanned' : 'User banned');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(null);
        }
    };

    const handleGrantSubmit = async () => {
        setLoading('grant');
        try {
            await grantTokens(user.id, tokens, reason, notify);
            toast.success('Tokens granted successfully');
            setGrantMode(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Management</h3>

            {!grantMode ? (
                <button
                    onClick={() => setGrantMode(true)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-all text-sm font-medium"
                >
                    <span className="flex items-center gap-2"><Coins className="w-4 h-4" /> Grant Tokens</span>
                </button>
            ) : (
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold text-indigo-300">Grant Tokens</h4>
                        <button onClick={() => setGrantMode(false)}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Amount</label>
                        <input
                            type="number"
                            value={tokens}
                            onChange={e => setTokens(parseInt(e.target.value))}
                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-indigo-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Reason</label>
                        <select
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-indigo-500 outline-none"
                        >
                            {GRANT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={notify}
                            onChange={e => setNotify(e.target.checked)}
                            className="rounded border-gray-600 bg-gray-800 text-indigo-500"
                        />
                        <span className="text-xs text-gray-300">Send user notification email</span>
                    </label>

                    <button
                        onClick={handleGrantSubmit}
                        disabled={!!loading}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium flex items-center justify-center gap-2"
                    >
                        {loading === 'grant' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Confirm Grant
                    </button>
                </div>
            )}

            <button
                onClick={handleImpersonate}
                disabled={!!loading}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 transition-all text-sm font-medium"
            >
                <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> Login as User</span>
                {loading === 'impersonate' && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>

            <button
                onClick={handleBan}
                disabled={!!loading}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-sm font-medium ${user.is_banned
                        ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20'
                        : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                    }`}
            >
                <span className="flex items-center gap-2"><Ban className="w-4 h-4" /> {user.is_banned ? 'Unban User' : 'Ban Access'}</span>
                {loading === 'ban' && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>

            <div className="h-px bg-white/10 my-2" />

            <button
                onClick={handleDelete}
                disabled={!!loading}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all text-sm font-medium"
            >
                <span className="flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete Permanently</span>
                {loading === 'delete' && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>
        </div>
    );
}

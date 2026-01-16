'use client';

import { useState } from 'react';
import { MoreVertical, Ban, CheckCircle, Coins } from 'lucide-react';
import { toggleUserBan, grantTokens } from '@/app/[lang]/admin/users/actions';

interface UserActionsProps {
    userId: string;
    isBanned: boolean;
}

export default function UserActions({ userId, isBanned }: UserActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleToggleBan = async () => {
        if (!confirm(`Are you sure you want to ${isBanned ? 'unban' : 'ban'} this user?`)) return;

        setLoading(true);
        try {
            await toggleUserBan(userId, isBanned);
            setIsOpen(false);
        } catch (error: unknown) {
            alert((error instanceof Error ? error.message : String(error)));
        } finally {
            setLoading(false);
        }
    };

    const handleGrantTokens = async () => {
        const tokensStr = prompt('Enter number of tokens to grant:');
        if (!tokensStr) return;
        const tokens = parseInt(tokensStr);
        if (isNaN(tokens) || tokens <= 0) {
            alert('Invalid amount');
            return;
        }

        const reason = prompt('Enter reason for grant:') || 'Admin Grant';

        setLoading(true);
        try {
            await grantTokens(userId, tokens, reason);
            alert('Tokens granted successfully');
            setIsOpen(false);
        } catch (error: unknown) {
            alert((error instanceof Error ? error.message : String(error)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                disabled={loading}
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-20 py-1">
                        <button
                            onClick={handleToggleBan}
                            disabled={loading}
                            className={`w-full px-4 py-2 text-sm flex items-center gap-2 transition-colors ${isBanned
                                ? 'text-green-500 hover:bg-green-500/10'
                                : 'text-red-500 hover:bg-red-500/10'
                                }`}
                        >
                            {isBanned ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Unban User
                                </>
                            ) : (
                                <>
                                    <Ban className="w-4 h-4" />
                                    Ban User
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleGrantTokens}
                            disabled={loading}
                            className="w-full px-4 py-2 text-sm flex items-center gap-2 transition-colors text-yellow-500 hover:bg-yellow-500/10"
                        >
                            <Coins className="w-4 h-4" />
                            Grant Tokens
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

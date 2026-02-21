'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDictionary } from '@/i18n/use-dictionary';
import { performDeleteUser } from './privileged-actions';
import { toast } from 'sonner';
import { Loader2, Trash2, Settings } from 'lucide-react';

export default function UserListActions({ userId, userEmail }: { userId: string, userEmail: string }) {
    const params = useParams();
    const lang = (params as any)?.lang || 'en';
    const dict = useDictionary(String(lang));
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        const confirmText = prompt((dict.adminUsers?.deleteConfirm ?? 'Type "DELETE" to confirm deleting {email} forever.').replace('{email}', userEmail));
        if (confirmText !== 'DELETE') return;

        setLoading(true);
        try {
            await performDeleteUser(userId);
            toast.success(dict.adminUsers?.userDeleted ?? 'User deleted');
            // Optimistic update handled by revalidatePath in action, but we might want to refresh router or specialized list state?
            // page.tsx is a server component, revalidatePath should update the list on next render/navigation.
        } catch (error: unknown) {
            toast.error((error instanceof Error ? error.message : String(error)) || 'Failed to delete');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-end gap-2">
            <Link
                href={`/${lang}/admin/users/${userId}`}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors text-foreground flex items-center gap-2"
            >
                <Settings className="w-3 h-3" /> {dict.adminUsers?.manage || 'Manage'}
            </Link>
            <button
                onClick={handleDelete}
                disabled={loading}
                className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-sm transition-colors border border-red-500/10 flex items-center gap-2"
                title="Delete User"
            >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            </button>
        </div>
    );
}

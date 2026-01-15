'use client';

import { useState } from 'react';
import { createSupportStaff, revokeStaffAccess, promoteToStaff } from '../staff-actions';
import { toast } from 'sonner';
import { ShieldAlert, UserPlus, CheckCircle, Loader2, X } from 'lucide-react';

export default function StaffManagementPanel({ user }: { user: any }) {
    const [loading, setLoading] = useState(false);

    // If user passed in is already support, show revoke options
    const isSupport = user.role === 'support';
    // If user passed is a normal user, we can 'Promote' them if we want? 
    // Or this panel is intended to create NEW staff.
    // The prompt says "Grant access via Email + Password".

    // Let's support both:
    // 1. If viewing an existing user => "Promote to Staff" (no password needed if they exist, or just role change)
    // 2. If creating new => "Create Staff User"

    // BUT this component is inside `/ admin / users / [id]`. So we are viewing ONE user.
    // If we are viewing a specific user, we just toggle their role.

    // However, the prompt implies "Admin can grant access via Email + Password to staff".
    // This sounds like "Invite a new person".
    // I will add a "Create Staff" button on the MAIN Users page, AND a "Make Staff" button on detail page.

    // This file `StaffManagementPanel` will be used on the DETAIL page to manage EXISTING user's staff status.
    // For creating NEW users, I should add a modal on the main list page.

    const toggleStaffRole = async () => {
        if (!confirm(isSupport ? "Revoke staff access?" : "Grant Limited Staff Access? User will be able to reply to messages.")) return;
        setLoading(true);
        try {
            if (isSupport) {
                await revokeStaffAccess(user.id);
                toast.success('Access revoked');
            } else {
                await promoteToStaff(user.id);
                toast.success('User promoted to Staff');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Staff Access</h3>

            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-4">
                <p className="text-sm text-purple-200 mb-2">
                    {isSupport
                        ? "This user has Limited Admin Access (Support)."
                        : "Grant limited access to view and reply to contact messages."}
                </p>
                {isSupport && (
                    <ul className="text-xs text-purple-300 list-disc list-inside">
                        <li>Read Contact Messages</li>
                        <li>Reply to Messages</li>
                        <li>Implicitly denied: User Deletion, Settings, Token Grants</li>
                    </ul>
                )}
            </div>

            <button
                onClick={toggleStaffRole}
                disabled={loading}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-sm font-medium ${isSupport
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                        : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/20'
                    }`}
            >    <span className="flex items-center gap-2">
                    {isSupport ? <ShieldAlert className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    {isSupport ? 'Revoke Staff Access' : 'Promote to Staff'}
                </span>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>
        </div>
    );
}

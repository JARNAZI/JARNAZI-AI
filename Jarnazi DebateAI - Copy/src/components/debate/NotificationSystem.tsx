'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Clock, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Notification = {
    id: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'alert';
    created_at: number; // timestamp
    expires_at: number; // timestamp
    read: boolean;
};

export function NotificationSystem({ dict }: { dict: any }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // Load from LocalStorage (Simulating client-side persistence for immediate UI satisfaction)
    // In strict prod, this would sync with Supabase `notifications` table if schema supported it fully.
    useEffect(() => {
        const loadNotifications = () => {
            const stored = localStorage.getItem('jarnazi_notifications');
            if (stored) {
                const parsed: Notification[] = JSON.parse(stored);
                // Filter out expired (Auto-delete after 30 days logic)
                const now = Date.now();
                const valid = parsed.filter(n => n.expires_at > now);

                // If we pruned items, notify user (subtly) or just save
                if (valid.length < parsed.length) {
                    console.log("Pruned expired notifications");
                    localStorage.setItem('jarnazi_notifications', JSON.stringify(valid));
                }

                setNotifications(valid);
                setHasUnread(valid.some(n => !n.read));
            } else {
                // Seed generic welcome if empty
                const welcome: Notification = {
                    id: 'welcome',
                    message: dict?.notifications?.welcome || 'Welcome to Jarnazi AI Consensus.',
                    type: 'info',
                    created_at: Date.now(),
                    expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
                    read: false
                };
                setNotifications([welcome]);
                localStorage.setItem('jarnazi_notifications', JSON.stringify([welcome]));
            }
        };
        loadNotifications();

        // Check every minute for expiration
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, [dict]);

    const markRead = () => {
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        setHasUnread(false);
        localStorage.setItem('jarnazi_notifications', JSON.stringify(updated));
    };

    const deleteNotification = (id: string) => {
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        localStorage.setItem('jarnazi_notifications', JSON.stringify(updated));
    };

    return (
        <div className="relative">
            <button
                onClick={() => { setIsOpen(!isOpen); if (!isOpen) markRead(); }}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors relative"
            >
                <Bell className="w-4 h-4" />
                {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-zinc-900" />}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-[#111] border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/50">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Notifications (30 Days)</span>
                        <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 text-zinc-500 hover:text-white" /></button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-zinc-600 text-xs">No active alerts.</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 w-2 h-2 rounded-full ${n.type === 'alert' ? 'bg-red-500' : 'bg-indigo-500'}`} />
                                        <div className="flex-1">
                                            <p className="text-xs text-zinc-300 leading-snug">{n.message}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(n.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="text-[9px] text-zinc-600">
                                                    Exp: {new Date(n.expires_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteNotification(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-3 h-3 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

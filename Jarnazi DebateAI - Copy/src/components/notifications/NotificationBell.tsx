'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

type Notification = {
    id: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    is_read: boolean;
    created_at: string;
    link?: string;
    user_id?: string;
};

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();
    const router = useRouter();

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    const markAsRead = async () => {
        if (unreadCount === 0) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);

        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    useEffect(() => {
        fetchNotifications();

        // Optional: Realtime subscription
        const channel = supabase
            .channel('notifications')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                payload => {
                    const newNotification = payload.new as Notification;
                    // Only update if it belongs to this user
                    supabase.auth.getUser().then(({ data: { user } }) => {
                        if (!user) return;
                        if ((newNotification as any).user_id !== user.id) return;
                        setNotifications(prev => [newNotification, ...prev].slice(0, 10));
                        if (!(newNotification as any).is_read) setUnreadCount(prev => Math.min(prev + 1, 99));
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleToggle = () => {
        if (!isOpen) {
            markAsRead();
        }
        setIsOpen(!isOpen);
    };

    const handleItemClick = (n: Notification) => {
        if (n.link) {
            router.push(n.link);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors hover:bg-foreground/5 rounded-full outline-none"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ring-1 ring-black/5 dark:ring-white/10">
                    <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                        <span className="text-xs text-muted-foreground">Latest 10</span>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-background/50">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                    <Bell className="w-6 h-6 opacity-20" />
                                </div>
                                <span className="text-muted-foreground text-sm">No new notifications</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleItemClick(n)}
                                        className={clsx(
                                            "p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                                            !n.is_read && "bg-primary/5"
                                        )}
                                    >
                                        <div className="flex gap-3 items-start">
                                            <div className={clsx(
                                                "w-2 h-2 mt-2 rounded-full shrink-0",
                                                n.type === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                    n.type === 'warning' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' :
                                                        n.type === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                                                            'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                            )} />
                                            <div className="space-y-1 flex-1">
                                                <p className="text-sm text-foreground leading-snug">{n.message}</p>
                                                <span className="text-[10px] text-muted-foreground block">
                                                    {new Date(n.created_at).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            {!n.is_read && (
                                                <span className="w-1.5 h-1.5 bg-primary rounded-full absolute right-4 top-1/2 -translate-y-1/2" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

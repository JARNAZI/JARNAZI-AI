'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

export default function NotificationBell({
  supabaseUrl,
  supabaseAnonKey,
  dict
}: {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  dict?: any;
}) {
  const d = dict?.notifications || {};
  // Create once per component instance
  const supabase = useMemo(() => createClient({ supabaseUrl, supabaseAnonKey }), [supabaseUrl, supabaseAnonKey]);

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    const rows = (data ?? []) as NotificationRow[];
    setNotifications(rows);
    setUnreadCount(rows.filter((n) => !n.is_read).length);
  }, [supabase]);

  const markAsRead = useCallback(async () => {
    if (unreadCount === 0) return;

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (error) {
      console.error('Error marking notifications as read:', error);
      toast.error(dict?.common?.error || 'An error occurred');
      return;
    }

    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [supabase, unreadCount, notifications]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchNotifications]);

  const toggleOpen = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) await markAsRead();
  };

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        aria-label={d.notifications || "Notifications"}
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold">{d.notifications || 'Notifications'}</h3>
            {unreadCount > 0 && (
              <button onClick={markAsRead} className="text-[10px] uppercase font-black text-indigo-400 hover:text-indigo-300 transition-colors">
                {d.markAllAsRead || 'Mark all as read'}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-4 text-white/60 text-center">{d.noNotifications || 'No notifications'}</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-4 border-b border-white/5 last:border-b-0 group hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-white font-medium text-sm group-hover:text-indigo-300 transition-colors">{n.title}</h4>
                      <p className="text-white/70 text-sm mt-1">{n.message}</p>
                      <p className="text-white/40 text-xs mt-2">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 animate-pulse" />}
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

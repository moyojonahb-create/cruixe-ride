import { useCallback, useEffect, useId, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { markNotificationRead, markNotificationsRead } from '@/lib/businessApi';
import { showLocalNotification } from '@/lib/push';

export interface InboxNotification {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export function useNotificationInbox() {
  const { user } = useAuth();
  const userId = user?.id;
  const subscriptionId = useId();
  const [inbox, setInbox] = useState<{ userId: string; items: InboxNotification[]; failed: boolean }>();
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setInbox(undefined);
    setAttempt(current => current + 1);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const incoming = new Map<string, InboxNotification>();
    const channel = supabase.channel(`notification-inbox-${userId}-${subscriptionId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}`,
      }, ({ new: row }) => {
        if (!active) return;
        const notification = row as InboxNotification;
        incoming.set(notification.id, notification);
        setInbox(current => current?.userId === userId && !current.items.some(item => item.id === notification.id)
          ? { ...current, items: [notification, ...current.items].slice(0, 50) }
          : current);
        showLocalNotification(notification.title, notification.body);
      })
      .subscribe();

    void (async () => {
      try {
        const { data, error } = await supabase.from('notifications').select('id,title,body,notification_type,is_read,created_at')
          .eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        if (!active) return;
        const items = [...new Map([...incoming, ...(data ?? []).map(item => [item.id, item] as const)]).values()]
          .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 50);
        setInbox({ userId, items, failed: false });
      } catch {
        if (active) setInbox({ userId, items: [], failed: true });
      }
    })();

    return () => { active = false; void supabase.removeChannel(channel); };
  }, [userId, attempt, subscriptionId]);

  const markRead = async (ids: string[]) => {
    if (!userId || ids.length === 0) return;
    const result = ids.length === 1 ? await markNotificationRead(ids[0]) : await markNotificationsRead(ids);
    if (result.success === false || result.error) throw new Error(result.error || "Could not mark notifications as read");
    const changed = new Set(ids);
    setInbox(current => current?.userId === userId
      ? { ...current, items: current.items.map(item => changed.has(item.id) ? { ...item, is_read: true } : item) }
      : current);
  };

  const current = inbox?.userId === userId ? inbox : undefined;
  return { notifications: current?.items ?? [], loading: !!userId && !current, failed: current?.failed ?? false, retry, markRead };
}

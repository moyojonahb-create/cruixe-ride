import { format } from 'date-fns';
import { toast } from 'sonner';
import type { useNotificationInbox } from '@/hooks/useNotificationInbox';

export default function DriverNotificationInbox({
  notifications, loading, failed, retry, markRead,
}: ReturnType<typeof useNotificationInbox>) {
  const unreadIds = notifications.filter(item => !item.is_read).map(item => item.id);
  const handleRead = (ids: string[]) => {
    void markRead(ids).catch(() => toast.error('Could not mark notifications as read'));
  };

  return (
    <section aria-labelledby="driver-notifications-title" data-figma-node="1107:210">
      <h1 id="driver-notifications-title" className="text-[21px] font-bold leading-tight">Notifications</h1>
      <p className="mt-4 text-[11px] text-[#667080]">Ride updates and account notices appear here.</p>

      {loading && <p role="status" className="mt-7 text-sm">Loading notifications…</p>}
      {failed && (
        <div role="alert" className="mt-7 rounded-[17px] bg-[#f5f6f8] p-4 text-sm">
          <p>Could not load notifications.</p>
          <button type="button" onClick={retry} className="mt-2 min-h-11 font-semibold text-primary">Try again</button>
        </div>
      )}
      {!loading && !failed && notifications.length === 0 && (
        <div className="relative mt-7 min-h-[116px] overflow-hidden rounded-[17px] bg-[#f5f6f8] px-4 py-5">
          <img alt="" src="/brand/driver-notifications/empty-accent.svg" className="pointer-events-none absolute left-0 top-0 max-w-none" />
          <p className="relative text-base font-semibold">No notifications yet</p>
          <p className="relative mt-6 text-[11px] text-[#667080]">We'll show booking and verification updates here.</p>
        </div>
      )}
      {notifications.length > 0 && (
        <>
          {unreadIds.length > 0 && (
            <button type="button" onClick={() => handleRead(unreadIds)} className="mt-3 min-h-11 text-xs font-semibold text-primary">Mark all read</button>
          )}
          <ul className="mt-3 space-y-2">
            {notifications.map(item => (
              <li key={item.id} className="rounded-[17px] bg-[#f5f6f8] p-4">
                <p className="break-words text-sm font-semibold">{item.title}</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-xs text-[#667080]">{item.body}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3">
                  <time dateTime={item.created_at} className="text-[11px] text-[#667080]">{format(new Date(item.created_at), 'MMM d · h:mm a')}</time>
                  {!item.is_read && <button type="button" aria-label={`Mark ${item.title} as read`} onClick={() => handleRead([item.id])} className="min-h-11 text-xs font-semibold text-primary">Mark as read</button>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

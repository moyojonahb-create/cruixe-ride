import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DriverNotificationInbox from '@/components/driver/DriverNotificationInbox';

describe('Driver notification inbox', () => {
  const props = () => ({
    loading: false,
    failed: false,
    notifications: [],
    retry: vi.fn(),
    markRead: vi.fn().mockResolvedValue(undefined),
  });

  it('shows the empty design only after a successful read', () => {
    const inbox = props();
    const { rerender } = render(<DriverNotificationInbox {...inbox} loading />);
    expect(screen.queryByText('No notifications yet')).toBeNull();
    rerender(<DriverNotificationInbox {...inbox} failed />);
    expect(screen.queryByText('No notifications yet')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(inbox.retry).toHaveBeenCalledOnce();
    rerender(<DriverNotificationInbox {...inbox} />);
    expect(screen.getByText('No notifications yet')).toBeTruthy();
  });

  it('passes only unread notification IDs to the bulk action', () => {
    const inbox = props();
    const notification = {
      id: 'unread',
      title: 'Ride accepted',
      body: 'Your rider accepted the fare.',
      created_at: '2026-11-18T12:00:00Z',
      notification_type: 'ride_accepted',
      is_read: false,
    };
    render(<DriverNotificationInbox {...inbox} notifications={[notification, { ...notification, id: 'read', is_read: true }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
    expect(inbox.markRead).toHaveBeenCalledWith(['unread']);
  });
});

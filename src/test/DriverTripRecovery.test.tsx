import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDriverTripRecovery } from '@/components/driver/useDriverTripRecovery';

const mocks = vi.hoisted(() => ({ read: vi.fn(), eq: vi.fn(), predicate: vi.fn(), remove: vi.fn(), update: undefined as undefined | (() => void) }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: {
  from: () => ({ select: () => ({ eq: (...args: unknown[]) => {
    mocks.eq(...args);
    return { or: (predicate: string) => { mocks.predicate(predicate); return { limit: () => ({ maybeSingle: mocks.read }) }; } };
  } }) }),
  channel: () => ({ on: (_event: string, _filter: unknown, callback: () => void) => {
    mocks.update = callback; return { subscribe: () => 'channel' };
  } }),
  removeChannel: mocks.remove,
} }));

describe('Driver live trip handoff recovery', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); mocks.read.mockResolvedValue({ data: null, error: null }); });
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it('reaches the trip dashboard when rider acceptance is missed by Realtime', async () => {
    const recover = vi.fn();
    const { unmount } = renderHook(() => useDriverTripRecovery('driver-row', recover));
    await act(async () => {});
    expect(recover).not.toHaveBeenCalled();
    mocks.read.mockResolvedValue({ data: { id: 'accepted-trip' }, error: null });
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(recover).toHaveBeenCalledOnce();
    expect(mocks.eq).toHaveBeenCalledWith('driver_id', 'driver-row');
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); mocks.update?.(); });
    expect(recover).toHaveBeenCalledOnce();
    unmount();
    expect(mocks.remove).toHaveBeenCalledWith('channel');
  });

  it('retries on reconnect after a failed read and includes unpaid cash recovery', async () => {
    mocks.read.mockRejectedValueOnce(new Error('offline'));
    const recover = vi.fn();
    renderHook(() => useDriverTripRecovery('driver-row', recover));
    await act(async () => {});
    mocks.read.mockResolvedValue({ data: { id: 'completed-unpaid-trip' }, error: null });
    await act(async () => { window.dispatchEvent(new Event('online')); });
    expect(recover).toHaveBeenCalledOnce();
    expect(mocks.predicate).toHaveBeenCalledWith(expect.stringContaining('and(status.eq.completed,payment_method.eq.cash,driver_collected_at.is.null)'));
  });

  it('ignores a stale result after account changes and avoids overlapping reads', async () => {
    let resolve!: (value: unknown) => void;
    mocks.read.mockReturnValue(new Promise((done) => { resolve = done; }));
    const recover = vi.fn();
    const { unmount } = renderHook(() => useDriverTripRecovery('driver-row', recover));
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); window.dispatchEvent(new Event('online')); });
    expect(mocks.read).toHaveBeenCalledOnce();
    unmount();
    await act(async () => { resolve({ data: { id: 'late-trip' }, error: null }); });
    expect(recover).not.toHaveBeenCalled();
  });

  it('rechecks immediately when the iPhone browser returns to the foreground', async () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    mocks.read.mockResolvedValue({ data: { id: 'trip-accepted-in-background' }, error: null });
    const recover = vi.fn();
    renderHook(() => useDriverTripRecovery('driver-row', recover));
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(mocks.read).not.toHaveBeenCalled();
    visibility.mockReturnValue('visible');
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(recover).toHaveBeenCalledOnce();
  });
});

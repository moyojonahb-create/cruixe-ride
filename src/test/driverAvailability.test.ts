import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canCurrentDriverOperate } from '@/lib/businessApi';
import { setDriverOnline } from '@/lib/driverPresence';
import { DRIVER_AVAILABILITY_EVENT, DriverEligibilityError, updateDriverAvailability } from '@/lib/driverAvailability';

vi.mock('@/lib/businessApi', () => ({ canCurrentDriverOperate: vi.fn() }));
vi.mock('@/lib/driverPresence', () => ({ setDriverOnline: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('shared driver availability mutation', () => {
  it('checks eligibility before going online and publishes confirmed state', async () => {
    vi.mocked(canCurrentDriverOperate).mockResolvedValue(true);
    vi.mocked(setDriverOnline).mockResolvedValue({ is_online: true });
    const listener = vi.fn();
    window.addEventListener(DRIVER_AVAILABILITY_EVENT, listener);
    await expect(updateDriverAvailability('driver-a', true, { lat: 1, lng: 2 })).resolves.toEqual({ applied: true, isOnline: true });
    expect(canCurrentDriverOperate).toHaveBeenCalledTimes(1);
    expect(setDriverOnline).toHaveBeenCalledWith(true, { lat: 1, lng: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(DRIVER_AVAILABILITY_EVENT, listener);
  });

  it('rejects ineligible drivers without mutating presence', async () => {
    sessionStorage.setItem('pickme-selfie-verified', 'forged-client-value');
    vi.mocked(canCurrentDriverOperate).mockResolvedValue(false);
    await expect(updateDriverAvailability('driver-a', true)).rejects.toBeInstanceOf(DriverEligibilityError);
    expect(setDriverOnline).not.toHaveBeenCalled();
  });

  it('allows offline and surfaces mutation failures', async () => {
    vi.mocked(setDriverOnline).mockRejectedValue(new Error('network down'));
    await expect(updateDriverAvailability('driver-a', false)).rejects.toThrow('network down');
    expect(canCurrentDriverOperate).not.toHaveBeenCalled();
  });

  it('deduplicates the same concurrent intent for one authenticated driver', async () => {
    vi.mocked(canCurrentDriverOperate).mockResolvedValue(true);
    let resolve!: (value: { is_online: boolean }) => void;
    vi.mocked(setDriverOnline).mockReturnValue(new Promise((done) => { resolve = done; }));
    const first = updateDriverAvailability('driver-a', true);
    const second = updateDriverAvailability('driver-a', true);
    expect(first).toBe(second);
    resolve({ is_online: true });
    await first;
    expect(setDriverOnline).toHaveBeenCalledTimes(1);
  });

  it('serializes opposite intents per driver and only publishes the latest result', async () => {
    vi.mocked(canCurrentDriverOperate).mockResolvedValue(true);
    let finishOnline!: (value: { is_online: boolean }) => void;
    vi.mocked(setDriverOnline)
      .mockReturnValueOnce(new Promise((resolve) => { finishOnline = resolve; }))
      .mockResolvedValueOnce({ is_online: false });
    const listener = vi.fn();
    window.addEventListener(DRIVER_AVAILABILITY_EVENT, listener);

    const online = updateDriverAvailability('driver-a', true);
    await vi.waitFor(() => expect(setDriverOnline).toHaveBeenCalledTimes(1));
    const offline = updateDriverAvailability('driver-a', false);
    finishOnline({ is_online: true });

    await expect(online).resolves.toEqual({ applied: false, isOnline: true });
    await expect(offline).resolves.toEqual({ applied: true, isOnline: false });
    expect(setDriverOnline).toHaveBeenNthCalledWith(1, true, undefined);
    expect(setDriverOnline).toHaveBeenNthCalledWith(2, false, undefined);
    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ isOnline: false });
    window.removeEventListener(DRIVER_AVAILABILITY_EVENT, listener);
  });

  it('keeps coordination independent across authenticated drivers', async () => {
    vi.mocked(setDriverOnline).mockResolvedValue({ is_online: false });
    await Promise.all([
      updateDriverAvailability('driver-a', false),
      updateDriverAvailability('driver-b', false),
    ]);
    expect(setDriverOnline).toHaveBeenCalledTimes(2);
  });
});

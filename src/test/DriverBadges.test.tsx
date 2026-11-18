import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ profile: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/offerHelpers', () => ({ getDriverProfile: mocks.profile }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
import DriverBadgeScreens from '@/components/driver/DriverBadgeScreens';
import { loadDriverBadgeActivity } from '@/pages/driver/DriverBadgesPage';
const props = { activity: { rides: 0, parcels: 0, status: 'pending' }, onRetry: vi.fn(), onScreen: vi.fn(), onProfile: vi.fn() };
beforeEach(() => { vi.clearAllMocks(); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); });
afterEach(cleanup);
describe('Driver badge screens', () => {
  it('does not award Bronze or claim approval for a pending driver', () => {
    render(<DriverBadgeScreens {...props} screen="achievements" />);
    expect(screen.queryByText(/Bronze/i)).not.toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('0 completed rides')).toBeInTheDocument();
  });
  it('keeps failed activity distinct from zero activity and offers retry', () => {
    render(<DriverBadgeScreens {...props} screen="achievements" error="Activity unavailable" />);
    expect(screen.queryByText('0 completed rides')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Try again'));
    expect(props.onRetry).toHaveBeenCalledOnce();
  });
  it('connects requirements, achievements and profile actions', () => {
    render(<DriverBadgeScreens {...props} screen="progress" />);
    fireEvent.click(screen.getByText('View Badge Requirements'));
    expect(props.onScreen).toHaveBeenCalledWith('requirements');
    fireEvent.click(screen.getByText('View Achievements'));
    expect(props.onScreen).toHaveBeenCalledWith('achievements');
    fireEvent.click(screen.getByText('Back to Profile'));
    expect(props.onProfile).toHaveBeenCalledOnce();
  });
  it('leaves award rules pending even for an approved driver', () => {
    render(<DriverBadgeScreens {...props} activity={{ rides: 128, parcels: 31, status: 'approved' }} screen="requirements" />);
    expect(screen.getByText('Progression rules pending')).toBeInTheDocument();
    expect(screen.queryByText(/CURRENT TIER/)).not.toBeInTheDocument();
  });
});
describe('Driver activity reads', () => {
  function query(count: number | null, error: unknown = null) {
    const q = { select: vi.fn(), eq: vi.fn(), neq: vi.fn(), then: (resolve: (result: unknown) => void) => resolve({ count, error }) };
    q.select.mockReturnValue(q); q.eq.mockReturnValue(q); q.neq.mockReturnValue(q); return q;
  }
  it('counts only this driver’s completed jobs, separated by parcel type', async () => {
    mocks.profile.mockResolvedValue({ id: 'driver-1', status: 'approved' });
    const rides = query(128), parcels = query(31);
    mocks.from.mockReturnValueOnce(rides).mockReturnValueOnce(parcels);
    await expect(loadDriverBadgeActivity()).resolves.toEqual({ rides: 128, parcels: 31, status: 'approved' });
    for (const q of [rides, parcels]) {
      expect(q.select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
      expect(q.eq).toHaveBeenCalledWith('driver_id', 'driver-1');
      expect(q.eq).toHaveBeenCalledWith('status', 'completed');
    }
    expect(rides.neq).toHaveBeenCalledWith('vehicle_type', 'parcel');
    expect(parcels.eq).toHaveBeenCalledWith('vehicle_type', 'parcel');
  });
  it('does not query all drivers when there is no driver profile', async () => {
    mocks.profile.mockResolvedValue(null);
    await expect(loadDriverBadgeActivity()).rejects.toThrow('Driver profile unavailable');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('rejects incomplete counts instead of reporting zero', async () => {
    mocks.profile.mockResolvedValue({ id: 'driver-1', status: 'approved' });
    mocks.from.mockReturnValueOnce(query(null, new Error('denied'))).mockReturnValueOnce(query(1));
    await expect(loadDriverBadgeActivity()).rejects.toThrow('Activity unavailable');
  });
});

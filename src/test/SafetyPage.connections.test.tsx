import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const mocks = vi.hoisted(() => ({ maybe: vi.fn(), eq: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'rider-1' } }) }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { from: () => ({ select: () => ({ eq: mocks.eq }) }) } }));
vi.mock('@/components/ride/TrustedContactSheet', () => ({ default: ({ open }: { open: boolean }) => open ? <div>Saved contact manager</div> : null }));
vi.mock('@/components/BottomNavBar', () => ({ default: () => null }));
vi.mock('@/components/CruiXeLogo', () => ({ default: () => null }));
import SafetyPage from '@/pages/SafetyPage';
describe('Rider safety live connections', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.eq.mockReturnValue({ in: () => ({ order: () => ({ limit: () => ({ maybeSingle: mocks.maybe }) }) }) }); });
  it('opens contact management instead of dialing an unrelated emergency line', async () => {
    mocks.maybe.mockResolvedValue({ data: null, error: null });
    render(<MemoryRouter><SafetyPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Trusted contacts/ }));
    expect(screen.getByText('Saved contact manager')).toBeInTheDocument();
  });
  it('does not offer live sharing when no active ride exists', async () => {
    mocks.maybe.mockResolvedValue({ data: null, error: null });
    render(<MemoryRouter><SafetyPage /></MemoryRouter>);
    expect(await screen.findByRole('button', { name: /Open my ride/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Share live trip/ })).not.toBeInTheDocument();
  });
  it('hides a previous share control after a rejected fresh lookup', async () => {
    mocks.maybe.mockResolvedValueOnce({ data: { id: 'live-trip', user_id: 'rider-1', pickup_address: 'Pickup', dropoff_address: 'Dropoff' }, error: null }).mockRejectedValueOnce(new Error('Disconnected'));
    render(<MemoryRouter><SafetyPage /></MemoryRouter>);
    await screen.findByRole('button', { name: /Share live trip/ });
    fireEvent.focus(window);
    await screen.findByText('Could not check your active trip. Open your ride to retry.');
    expect(screen.queryByRole('button', { name: /Share live trip/ })).not.toBeInTheDocument();
  });
  it('ignores an older overlapping lookup after a newer response', async () => {
    let finish!: (value: unknown) => void;
    mocks.maybe.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; })).mockResolvedValueOnce({ data: null, error: null });
    render(<MemoryRouter><SafetyPage /></MemoryRouter>);
    fireEvent.focus(window);
    await waitFor(() => expect(mocks.maybe).toHaveBeenCalledTimes(2));
    finish({ data: { id: 'stale-trip', user_id: 'rider-1', pickup_address: 'Pickup', dropoff_address: 'Dropoff' }, error: null });
    await waitFor(() => expect(screen.queryByRole('button', { name: /Share live trip/ })).not.toBeInTheDocument());
  });
  it('offers the existing live share control only for the authenticated riders active trip', async () => {
    mocks.maybe.mockResolvedValue({ data: { id: 'live-trip', user_id: 'rider-1', pickup_address: 'Pickup', dropoff_address: 'Dropoff' }, error: null });
    render(<MemoryRouter><SafetyPage /></MemoryRouter>);
    expect(await screen.findByRole('button', { name: /Share live trip/ })).toBeInTheDocument();
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'rider-1');
  });
});

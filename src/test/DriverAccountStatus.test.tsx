import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import DriverAccountStatusScreen from '@/components/driver/DriverAccountStatusScreen';
import { useObservedDriverReactivation } from '@/components/driver/useObservedDriverReactivation';

describe('Driver account status evidence', () => {
  beforeEach(() => { vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); });
  afterEach(() => { vi.restoreAllMocks(); });
  it('does not claim reactivation for an initially approved profile', () => {
    const { result } = renderHook(() => useObservedDriverReactivation('driver-a', 'approved'));
    expect(result.current).toBe(false);
  });
  it('recognizes only the same driver suspended-to-approved transition', () => {
    const { result, rerender } = renderHook(({ id, status }) => useObservedDriverReactivation(id, status), { initialProps: { id: 'driver-a', status: 'suspended' } });
    expect(result.current).toBe(false);
    rerender({ id: 'driver-a', status: 'approved' });
    expect(result.current).toBe(true);
    rerender({ id: 'driver-b', status: 'approved' });
    expect(result.current).toBe(false);
  });
  it('does not infer approval through missing or pending evidence', () => {
    const { result, rerender } = renderHook(({ status }) => useObservedDriverReactivation('driver-a', status), { initialProps: { status: 'suspended' as string | null } });
    rerender({ status: null });
    rerender({ status: 'approved' });
    expect(result.current).toBe(false);
    rerender({ status: 'suspended' });
    rerender({ status: 'pending' });
    rerender({ status: 'approved' });
    expect(result.current).toBe(false);
  });
  it('renders suspension without inventing a reason and preserves back actions', () => {
    const back = vi.fn(); const home = vi.fn();
    render(<DriverAccountStatusScreen status="suspended" reactivated={false} onBack={back} onHome={home} />);
    expect(screen.getByRole('heading', { name: 'Account Suspended' })).toBeInTheDocument();
    expect(screen.getByText('Unavailable during restriction')).toBeInTheDocument();
    expect(screen.getByText('Contact support for authorized review details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request Account Review' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to Profile' }));
    expect(back).toHaveBeenCalledTimes(1);
    expect(home).not.toHaveBeenCalled();
  });
  it('renders fresh approval neutrally and keeps ordinary eligibility checks', () => {
    const home = vi.fn();
    render(<DriverAccountStatusScreen status="approved" reactivated={false} onBack={vi.fn()} onHome={home} />);
    expect(screen.getByRole('heading', { name: 'Account status' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Account Reactivated' })).not.toBeInTheDocument();
    expect(screen.getByText('Subject to eligibility checks')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Return to Driver Home' }));
    expect(home).toHaveBeenCalledTimes(1);
  });
  it('requires both approval and observed reactivation before the restored screen', () => {
    const props = { onBack: vi.fn(), onHome: vi.fn() };
    const { rerender } = render(<DriverAccountStatusScreen status="approved" reactivated {...props} />);
    expect(screen.getByRole('heading', { name: 'Account Reactivated' })).toBeInTheDocument();
    expect(screen.queryByText(/example/)).not.toBeInTheDocument();
    rerender(<DriverAccountStatusScreen status={null} reactivated {...props} />);
    expect(screen.getByRole('heading', { name: 'Account status' })).toBeInTheDocument();
    expect(screen.getByText('Not confirmed')).toBeInTheDocument();
  });
});

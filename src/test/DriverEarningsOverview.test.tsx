import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DriverEarningsOverview from '@/components/driver/DriverEarningsOverview';

const mocks = vi.hoisted(() => ({ summary: vi.fn().mockResolvedValue({ balance: 90 }) }));
vi.mock('@/lib/walletApi', () => ({ getDriverWalletSummary: mocks.summary }));
vi.mock('@/hooks/useWalletPin', () => ({ useWalletPin: () => ({ hasPin: true, loading: false, verifyPin: vi.fn() }) }));
vi.mock('@/components/wallet/WalletPinModal', () => ({
  default: ({ isOpen, onVerified }: { isOpen: boolean; onVerified: () => void }) =>
    isOpen ? <button onClick={onVerified}>PIN verified</button> : null,
}));
vi.mock('@/components/driver/DriverEarningsDashboard', () => ({ default: () => <p>Earnings analytics</p> }));

afterEach(cleanup);

it('loads private earnings only after PIN verification and hides them again on request', async () => {
  render(<MemoryRouter><DriverEarningsOverview onClose={vi.fn()} /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'View Amount' }));
  expect(mocks.summary).not.toHaveBeenCalled();
  expect(screen.queryByText('Earnings analytics')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'PIN verified' }));
  expect(await screen.findByText('$90.00')).toBeInTheDocument();
  expect(screen.getByText('Earnings analytics')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Hide Amounts' }));
  expect(screen.queryByText('$90.00')).toBeNull();
  expect(screen.queryByText('Earnings analytics')).toBeNull();
});

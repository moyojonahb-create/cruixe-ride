import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RiderWalletPage from '@/pages/RiderWalletPage';

const state = vi.hoisted(() => ({
  user: { id: 'rider-fixture' },
  transactions: [] as Array<{ id: string; amount: number | string; transaction_type: string; description: string; created_at: string; currency?: string | null }>,
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/hooks/useWallet', () => ({ useWallet: () => ({ balance: 50, transactions: state.transactions, refresh: vi.fn(), loading: false }) }));
vi.mock('@/hooks/useWalletPin', () => ({ useWalletPin: () => ({ hasPin: true, loading: false, setPin: vi.fn(), verifyPin: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/hooks/usePickmeAccount', () => ({ usePickmeAccount: () => ({ full_name: 'Test Rider', pickme_account: 'TEST' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ eq: async () => ({ count: 0 }) }) }) }) } }));
vi.mock('@/lib/walletApi', () => ({ listWalletDeposits: async () => [] }));
vi.mock('@/components/wallet/WalletPinModal', async () => {
  const { useEffect, useRef } = await import('react');
  return { default: function PinFixture({ onVerified }: { onVerified: () => void }) {
    const verifyOnMount = useRef(onVerified);
    useEffect(() => { verifyOnMount.current(); }, []);
    return null;
  } };
});
vi.mock('@/components/BottomNavBar', () => ({ default: () => null }));
vi.mock('@/components/wallet/DepositModal', () => ({ default: () => null }));
vi.mock('@/components/wallet/WalletSettings', () => ({ default: () => null }));
vi.mock('@/components/wallet/TransferMoneyModal', () => ({ default: () => null }));
vi.mock('@/components/wallet/WithdrawalModal', () => ({ default: () => null }));
vi.mock('@/components/wallet/WalletCard', () => ({ default: () => null }));

afterEach(cleanup);

describe('wallet transaction presentation across recent activity and history', () => {
  it.each([
    { type: 'deposit', amount: 12.5, display: '+$12.50', name: 'Credit USD 12.50' },
    { type: 'withdrawal', amount: -5, display: '-$5.00', name: 'Debit USD 5.00' },
    { type: 'deposit', amount: 0, display: '$0.00', name: 'USD 0.00' },
    { type: 'refund', amount: '3.25', display: '+$3.25', name: 'Credit USD 3.25' },
    { type: 'trip_fee', amount: '-0.75', display: '-$0.75', name: 'Debit USD 0.75' },
    { type: 'deposit', amount: 1234567.89, display: '+$1234567.89', name: 'Credit USD 1234567.89' },
    { type: 'refund', amount: 1.25, currency: 'ZWG', display: '+ZWG 1.25', name: 'Credit ZWG 1.25' },
    { type: 'deposit', amount: 2.5, currency: null, display: '+$2.50', name: 'Credit USD 2.50' },
  ])('preserves $type $amount $currency units, sign and currency', async ({ type, amount, currency, display, name }) => {
    state.transactions = [{ id: 'transaction-fixture', amount, currency, transaction_type: type, description: 'Fixture transaction', created_at: '2026-10-20T12:00:00Z' }];
    const { container } = render(<RiderWalletPage />);
    const page = within(container);
    const recentSection = page.getByText('Recent Transactions').closest('section');
    expect(recentSection).not.toBeNull();
    const recent = within(recentSection!);
    expect(recent.getByText(display)).toBeInTheDocument();
    expect(recent.getByText(name)).toHaveClass('sr-only');
    fireEvent.click(page.getByRole('button', { name: 'History' }));
    const history = within(await screen.findByRole('dialog', { name: 'All Transactions' }));
    expect(history.getByText(display)).toBeInTheDocument();
    expect(history.getByText(name)).toHaveClass('sr-only');
    expect(state.transactions[0].amount).toBe(amount);
  }, 15000);
});

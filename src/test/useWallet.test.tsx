import { renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useWallet } from '@/hooks/useWallet';
import { getWalletMe, getWalletTransactions } from '@/lib/walletApi';

const auth = vi.hoisted(() => ({ user: { id: 'first' } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth }));
vi.mock('@/lib/walletApi', () => ({
  getWalletMe: vi.fn(),
  getWalletTransactions: vi.fn(),
}));

it('hides the previous account balance even when the next account fails to load', async () => {
  vi.mocked(getWalletMe)
    .mockResolvedValueOnce({
      id: 'wallet',
      user_id: 'first',
      balance: 25,
      created_at: '',
      updated_at: '',
    })
    .mockRejectedValueOnce(new Error('Service unavailable'));
  vi.mocked(getWalletTransactions).mockResolvedValue([]);

  const { result, rerender, unmount } = renderHook(() => useWallet());
  await waitFor(() => expect(result.current.balance).toBe(25));

  auth.user = { id: 'second' };
  rerender();
  expect(result.current.wallet).toBeNull();
  expect(result.current.transactions).toEqual([]);
  await waitFor(() => expect(result.current.error).toBe('Service unavailable'));
  expect(result.current.loading).toBe(false);
  expect(result.current.wallet).toBeNull();
  unmount();
});

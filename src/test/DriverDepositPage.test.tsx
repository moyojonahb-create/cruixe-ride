import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DriverDepositPage from '@/pages/DriverDepositPage';

const mocks = vi.hoisted(() => ({
  upload: vi.fn().mockResolvedValue({ error: null }),
  deposit: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'driver' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { storage: { from: () => ({ upload: mocks.upload }) } } }));
vi.mock('@/lib/walletApi', () => ({ walletDeposit: mocks.deposit }));
afterEach(cleanup);

it('reviews proof before submitting and keeps payment pending after the server accepts it', async () => {
  const { container } = render(<MemoryRouter><DriverDepositPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: '$10' }));
  fireEvent.change(screen.getByPlaceholderText('+263...'), { target: { value: '+263771234567' } });
  fireEvent.change(screen.getByPlaceholderText('Transaction reference'), { target: { value: 'test-reference' } });
  const proof = new File(['image'], 'proof.png', { type: 'image/png' });
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [proof] } });
  fireEvent.click(screen.getByRole('button', { name: 'Review Top-Up' }));
  expect(mocks.upload).not.toHaveBeenCalled();
  expect(mocks.deposit).not.toHaveBeenCalled();
  const submit = screen.getByRole('button', { name: 'Submit deposit request' });
  fireEvent.click(submit);
  fireEvent.click(submit);
  expect(await screen.findByText('Awaiting verification')).toBeInTheDocument();
  expect(mocks.upload).toHaveBeenCalledTimes(1);
  expect(mocks.deposit).toHaveBeenCalledTimes(1);
  expect(mocks.deposit).toHaveBeenCalledWith(expect.objectContaining({ amount: 10, wallet_type: 'driver', ecocash_reference: 'test-reference' }));
});

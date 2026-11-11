import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ confirm: vi.fn(), wallet: vi.fn(), error: vi.fn() }));
vi.mock('@/lib/confirmCashCollection', () => ({ confirmCashCollection: mocks.confirm }));
vi.mock('@/lib/walletApi', () => ({ getDriverWalletSummary: mocks.wallet }));
vi.mock('@/lib/haptics', () => ({ haptic: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: mocks.error } }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }) }) } }));
import TripCollectSheet from '@/components/driver/TripCollectSheet';
const ride = { id: 'ride-1', fare: 5, payment_method: 'cash', pickup_address: 'Montrose', dropoff_address: 'Tower Block', user_id: 'rider-1' };

describe('approved driver cash collection sequence', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.wallet.mockResolvedValue({ earnings: [{ ride_id: 'ride-1', fare_amount: 5, platform_fee: .75, driver_earnings: 4.25 }] }); });
  it('keeps Not received pending without confirming or leaving the screen', async () => {
    const onDone = vi.fn();
    render(<TripCollectSheet ride={ride} onDone={onDone} />);
    expect(screen.getByText('PAYMENT DUE')).toBeInTheDocument();
    expect(screen.queryByText('Cash collected')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Not received' }));
    expect(screen.getByText(/Payment is still due/)).toBeInTheDocument();
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });
  it('shows receipt only after successful persistence and exits only on Return', async () => {
    let resolve!: () => void;
    mocks.confirm.mockReturnValue(new Promise<void>((done) => { resolve = done; }));
    const onDone = vi.fn();
    render(<TripCollectSheet ride={ride} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cash received' }));
    expect(screen.getByRole('button', { name: 'Confirming…' })).toBeDisabled();
    expect(screen.queryByText('TRIP COMPLETED')).not.toBeInTheDocument();
    resolve();
    await screen.findByLabelText('Cash collected receipt');
    expect(screen.getByText(/Cash collected/)).toBeInTheDocument();
    expect(screen.getByText('Montrose')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Return to Waiting Room' }));
    expect(onDone).toHaveBeenCalledOnce();
  });
  it('keeps full fare separate from ledger net earnings', async () => {
    mocks.confirm.mockResolvedValue(undefined);
    render(<TripCollectSheet ride={ride} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cash received' }));
    await screen.findByText('Driver earnings');
    expect(screen.getByText('$5.00')).toBeInTheDocument();
    expect(screen.getByText('$4.25')).toBeInTheDocument();
    expect(screen.getByText('TOTAL FARE')).toBeInTheDocument();
  });
  it('retains Payment due after failed confirmation and permits retry', async () => {
    mocks.confirm.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(undefined);
    const onDone = vi.fn();
    render(<TripCollectSheet ride={ride} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cash received' }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Offline'));
    expect(screen.getByText('PAYMENT DUE')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cash received' }));
    await screen.findByLabelText('Cash collected receipt');
    expect(mocks.confirm).toHaveBeenCalledTimes(2);
  });
});

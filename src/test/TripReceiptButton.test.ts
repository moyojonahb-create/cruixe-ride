import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { fetchRideById } from '@/lib/rideMatching';
import { openTripReceipt, refreshTripReceiptPayment } from '@/components/ride/TripReceiptButton';
vi.mock('@/lib/rideMatching', () => ({ fetchRideById: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const receipt = { rideId: 'ride-1', pickupAddress: '<img src=x onerror=alert(1)>', dropoffAddress: 'A & B', fare: 6, distanceKm: 2, durationMinutes: 5, paymentMethod: 'Cash', tripDate: '2026-01-02T12:00:00Z' };
afterEach(async () => {
  for (const close of screen.queryAllByRole('button', { name: 'Close receipt' })) {
    await act(async () => { fireEvent.click(close); });
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('receipt payment evidence', () => {
  it('opens an in-app receipt without a popup and treats addresses as text', async () => {
    const open = vi.spyOn(window, 'open');
    await act(async () => { await openTripReceipt(receipt); });
    const dialog = screen.getByRole('dialog', { name: 'Ride receipt' });
    expect(dialog.textContent).toContain(receipt.pickupAddress);
    expect(dialog.textContent).toContain('A & B');
    expect(dialog.querySelector('img[src="x"], [onerror]')).toBeNull();
    expect(within(dialog).getByRole('status')).toHaveTextContent('Payment pending confirmation');
    expect(within(dialog).getByRole('button', { name: 'Download receipt' })).toBeVisible();
    expect(open).not.toHaveBeenCalled();
  });
  it('waits for refreshed saved fare and confirmation before showing the receipt', async () => {
    let resolve!: (value: { fare: number; paymentConfirmed: boolean }) => void;
    const fresh = new Promise<{ fare: number; paymentConfirmed: boolean }>((done) => { resolve = done; });
    let opening!: Promise<void>;
    await act(async () => { opening = openTripReceipt(receipt, () => fresh); });
    expect(screen.queryByRole('dialog')).toBeNull();
    await act(async () => { resolve({ fare: 9, paymentConfirmed: true }); await opening; });
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('$9.00');
    expect(within(dialog).getByRole('status')).toHaveTextContent('Payment confirmed');
    expect(dialog).not.toHaveTextContent('$6.00');
  });
  it('offers HTML download as an additional action with escaped saved content', async () => {
    const blobs: Blob[] = [];
    const create = vi.fn((blob: Blob) => { blobs.push(blob); return 'blob:receipt'; });
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await act(async () => { await openTripReceipt(receipt); });
    fireEvent.click(screen.getByRole('button', { name: 'Download receipt' }));
    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    const html = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsText(blobs[0]); });
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('A &amp; B');
    expect(html).toContain('Payment pending confirmation');
    expect(screen.getByRole('dialog')).toBeVisible();
  });
  it('does not open stale receipt details when refresh fails', async () => {
    await act(async () => { await openTripReceipt(receipt, async () => { throw new Error('offline'); }); });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
it('refreshes reopened history receipts from saved fare and collection marker', async () => {
  vi.mocked(fetchRideById).mockResolvedValue({ fare: 7, payment_method: 'cash', driver_collected_at: '2026-11-11T13:00:00Z' } as Awaited<ReturnType<typeof fetchRideById>>);
  await expect(refreshTripReceiptPayment('ride-1')).resolves.toEqual({ fare: 7, paymentMethod: 'cash', paymentConfirmed: true });
  expect(fetchRideById).toHaveBeenCalledWith('ride-1');
});

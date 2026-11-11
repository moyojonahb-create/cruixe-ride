import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRideById } from '@/lib/rideMatching';
import { openTripReceipt, refreshTripReceiptPayment } from '@/components/ride/TripReceiptButton';
vi.mock('@/lib/rideMatching', () => ({ fetchRideById: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const receipt = { rideId: 'ride-1', pickupAddress: '<img src=x onerror=alert(1)>', dropoffAddress: 'A & B', fare: 6, distanceKm: 2, durationMinutes: 5, paymentMethod: 'Cash' };
afterEach(() => vi.restoreAllMocks());
describe('receipt payment evidence', () => {
  it('escapes user input and does not claim unconfirmed cash was paid', async () => {
    const write = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({ document: { body: {}, write, close: vi.fn() } } as unknown as Window);
    await openTripReceipt(receipt);
    const html = write.mock.calls[0][0];
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('A &amp; B');
    expect(html).toContain('Payment pending confirmation');
    expect(html).not.toContain('<span class="badge">Paid</span>');
  });
  it('reserves a popup before refreshing and renders the fresh confirmation', async () => {
    const write = vi.fn();
    const open = vi.spyOn(window, 'open').mockReturnValue({ document: { body: {}, write, close: vi.fn() } } as unknown as Window);
    await openTripReceipt(receipt, async () => {
      expect(open).toHaveBeenCalledOnce();
      return { paymentConfirmed: true };
    });
    expect(write.mock.calls[0][0]).toContain('<span class="badge">Paid</span>');
  });
});

it('refreshes reopened history receipts from the saved collection marker', async () => {
  vi.mocked(fetchRideById).mockResolvedValue({ fare: 7, payment_method: 'cash', driver_collected_at: '2026-11-11T13:00:00Z' } as Awaited<ReturnType<typeof fetchRideById>>);
  await expect(refreshTripReceiptPayment('ride-1')).resolves.toEqual({ fare: 7, paymentMethod: 'cash', paymentConfirmed: true });
  expect(fetchRideById).toHaveBeenCalledWith('ride-1');
});

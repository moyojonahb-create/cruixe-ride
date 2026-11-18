import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DriverOfferWaiting from '@/components/driver/DriverOfferWaiting';
import type { EnrichedRideRequest } from '@/lib/driverRideRequests';
import type { Offer } from '@/lib/offerHelpers';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { from } }));

function lookup(status: string) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { status }, error: null }),
  };
  return query;
}

describe('Driver offer waiting', () => {
  it('keeps a sent offer pending and opens the trip only once assigned by the backend', async () => {
    const offer: Offer = {
      id: 'offer', ride_id: 'ride', driver_id: 'driver-user', status: 'pending',
      price: 5, eta_minutes: 10, message: null, created_at: '2026-11-18T12:00:00Z',
    };
    const ride = { pickup_address: 'Montrose', dropoff_address: 'Tower Block' } as EnrichedRideRequest;
    const onAccepted = vi.fn();
    const pending = lookup('pending');
    const accepted = lookup('accepted');
    const assigned = lookup('arrived');
    from.mockReturnValueOnce(pending).mockReturnValueOnce(accepted).mockReturnValueOnce(assigned);
    render(<DriverOfferWaiting offer={offer} ride={ride} driverRowId="driver-row" onAccepted={onAccepted} />);

    expect(screen.getByRole('status').textContent).toBe('Awaiting decision');
    fireEvent(window, new Event('online'));
    await waitFor(() => expect(pending.maybeSingle).toHaveBeenCalledOnce());
    expect(onAccepted).not.toHaveBeenCalled();

    await waitFor(() => {
      fireEvent(window, new Event('online'));
      expect(onAccepted).toHaveBeenCalledOnce();
    });
    expect(assigned.eq).toHaveBeenCalledWith('driver_id', 'driver-row');
  });
});

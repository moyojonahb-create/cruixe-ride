import { beforeEach, expect, it, vi } from 'vitest';
import { saveParcelDetails } from '@/lib/saveParcelDetails';

const { write } = vi.hoisted(() => ({ write: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => ({ upsert: (row: unknown) => write(table, row) }) },
}));

const details = {
  ride_id: 'parcel-ride',
  package_size: 'small',
  recipient_name: 'QA recipient',
  delivery_note: null,
  who_pays: 'sender',
  photo_path: null,
} as const;
const phone = '+263771000000';

beforeEach(() => write.mockReset());

it('stops when the private contact cannot be saved', async () => {
  write.mockResolvedValueOnce({ error: { message: 'denied' } });

  await expect(saveParcelDetails(details, phone)).rejects.toThrow('recipient phone');
  expect(write).toHaveBeenCalledExactlyOnceWith('ride_parcel_contacts', {
    ride_id: details.ride_id,
    recipient_phone: phone,
  });
});

it('reports a failed details write and can retry against the same ride', async () => {
  write.mockResolvedValue({ error: null })
    .mockResolvedValueOnce({ error: null })
    .mockResolvedValueOnce({ error: { message: 'temporarily unavailable' } });

  await expect(saveParcelDetails(details, phone)).rejects.toThrow('parcel details');
  await expect(saveParcelDetails(details, phone)).resolves.toBeUndefined();
  expect(write).toHaveBeenNthCalledWith(3, 'ride_parcel_contacts', {
    ride_id: details.ride_id,
    recipient_phone: phone,
  });
  expect(write).toHaveBeenNthCalledWith(4, 'ride_parcel_details', details);
});

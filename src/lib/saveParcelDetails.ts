import { supabase } from '@/integrations/supabase/client';

export async function saveParcelDetails(
  details: {
    ride_id: string;
    package_size: 'small' | 'medium' | 'large';
    recipient_name: string;
    delivery_note: string | null;
    who_pays: 'sender' | 'recipient';
    photo_path: string | null;
  },
  recipientPhone: string,
) {
  // The generated database types predate the parcel tables.
  const db = supabase as any;
  const { error: contactError } = await db.from('ride_parcel_contacts').upsert({
    ride_id: details.ride_id,
    recipient_phone: recipientPhone,
  });
  if (contactError) throw new Error('Could not save the recipient phone. Please retry.');

  const { error: detailsError } = await db.from('ride_parcel_details').upsert(details);
  if (detailsError) throw new Error('Could not save parcel details. Please retry.');
}

import { supabase } from '@/lib/supabaseClient';
import { normalizePhoneZW } from '@/lib/region';

export interface RiderEmergencyContact { name: string; phone: string }

async function authenticatedUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Sign in to manage your trusted contact.');
  return data.user.id;
}

export async function loadRiderEmergencyContact(): Promise<RiderEmergencyContact | null> {
  const userId = await authenticatedUserId();
  const { data, error } = await supabase.from('profiles')
    .select('emergency_contact_name, emergency_contact_phone').eq('user_id', userId).maybeSingle();
  if (error) throw new Error('Could not load your trusted contact. Please try again.');
  // Existing emergency-contact migration predates the generated profile types.
  const fields = data as unknown as { emergency_contact_name?: string; emergency_contact_phone?: string } | null;
  return fields?.emergency_contact_phone ? { name: fields.emergency_contact_name || 'Trusted contact', phone: fields.emergency_contact_phone } : null;
}

export async function saveRiderEmergencyContact(contact: RiderEmergencyContact | null): Promise<RiderEmergencyContact | null> {
  const userId = await authenticatedUserId();
  const name = contact?.name.trim() || '';
  const phone = contact ? normalizePhoneZW(contact.phone.trim()) : null;
  if (contact && (!name || name.length > 120 || !/^\+[1-9]\d{7,14}$/.test(phone || ''))) {
    throw new Error('Enter a name and valid phone number with country code.');
  }
  const { data, error } = await supabase.from('profiles').update({
    emergency_contact_name: contact ? name : null,
    emergency_contact_phone: phone,
  } as never).eq('user_id', userId).select('user_id').maybeSingle();
  if (error || !data) throw new Error('Your trusted contact was not saved. Please try again.');
  return contact ? { name, phone: phone! } : null;
}

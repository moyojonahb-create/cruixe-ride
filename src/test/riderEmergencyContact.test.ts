import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn(), update: vi.fn(), eq: vi.fn(), maybe: vi.fn() }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { auth: { getUser: mocks.auth }, from: mocks.from } }));
import { saveRiderEmergencyContact } from '@/lib/riderEmergencyContact';
describe('Rider contact persistence', () => {
  beforeEach(() => {
    vi.resetAllMocks(); mocks.auth.mockResolvedValue({ data: { user: { id: 'signed-in-rider' } } });
    mocks.from.mockReturnValue({ update: mocks.update });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ select: () => ({ maybeSingle: mocks.maybe }) });
    mocks.maybe.mockResolvedValue({ data: { user_id: 'signed-in-rider' }, error: null });
  });
  it('scopes contact updates to authenticated user and normalizes the phone', async () => {
    await expect(saveRiderEmergencyContact({ name: ' Person ', phone: '077 123 4567' })).resolves.toEqual({ name: 'Person', phone: '+263771234567' });
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'signed-in-rider');
  });
  it('rejects unauthenticated writes', async () => {
    mocks.auth.mockResolvedValue({ data: { user: null } });
    await expect(saveRiderEmergencyContact(null)).rejects.toThrow('Sign in');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('does not report success for a write affecting no visible row', async () => {
    mocks.maybe.mockResolvedValue({ data: null, error: null });
    await expect(saveRiderEmergencyContact(null)).rejects.toThrow('not saved');
  });
  it('rejects malformed phone input without writing it', async () => {
    await expect(saveRiderEmergencyContact({ name: 'Person', phone: 'not-a-phone' })).rejects.toThrow('valid phone');
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

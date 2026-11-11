import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ post: vi.fn(), configured: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/goBackendClient', () => ({ goBackend: { post: mocks.post } }));
vi.mock('@/lib/rideMatching', () => ({ isGoBackendConfigured: mocks.configured }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { from: mocks.from } }));
import { confirmCashCollection } from '@/lib/confirmCashCollection';

describe('cash collection persistence', () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.configured.mockReturnValue(true); });
  it('waits for an authoritative paid acknowledgement', async () => {
    mocks.post.mockResolvedValue({ payment_status: 'paid', driver_collected_at: '2026-11-11T12:00:00Z' });
    await expect(confirmCashCollection('ride-1')).resolves.toBeUndefined();
    expect(mocks.post).toHaveBeenCalledWith('/api/rides/ride-1/confirm-cash');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('does not bypass a rejected backend confirmation through direct database writes', async () => {
    mocks.post.mockRejectedValue(new Error('Forbidden'));
    await expect(confirmCashCollection('ride-1')).rejects.toThrow('Forbidden');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('rejects a successful HTTP response without persisted cash confirmation', async () => {
    mocks.post.mockResolvedValue({ payment_status: 'pending' });
    await expect(confirmCashCollection('ride-1')).rejects.toThrow('not saved');
  });
  it('rejects a legacy update that silently affects no visible rows', async () => {
    mocks.configured.mockReturnValue(false);
    const update = { eq: vi.fn().mockReturnThis(), is: vi.fn().mockResolvedValue({ error: null }) };
    const read = { eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
    mocks.from.mockReturnValueOnce({ update: vi.fn(() => update) }).mockReturnValueOnce({ select: vi.fn(() => read) });
    await expect(confirmCashCollection('ride-1')).rejects.toThrow('not saved');
  });
});

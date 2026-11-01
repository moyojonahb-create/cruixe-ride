import { beforeEach, describe, expect, it, vi } from 'vitest';
import { goBackend, GoBackendError } from '@/lib/goBackendClient';
import { invalidateDriverProfileCache } from '@/lib/offerHelpers';
import { setDriverOnline } from '@/lib/driverPresence';

vi.mock('@/lib/goBackendClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/goBackendClient')>();
  return { ...actual, goBackend: { post: vi.fn() } };
});
vi.mock('@/lib/offerHelpers', () => ({ invalidateDriverProfileCache: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

describe('driver presence writes', () => {
  it.each([
    [401, 'UNAUTHENTICATED' as const],
    [403, 'FORBIDDEN' as const],
  ])('fails closed on backend status %i without a database fallback', async (status, code) => {
    vi.mocked(goBackend.post).mockRejectedValue(new GoBackendError('denied', code, status));

    await expect(setDriverOnline(true, { lat: -17.8, lng: 31.0 })).rejects.toMatchObject({ status });
    expect(invalidateDriverProfileCache).not.toHaveBeenCalled();
  });

  it('rejects a response that does not confirm the requested state', async () => {
    vi.mocked(goBackend.post).mockResolvedValue({ is_online: false });

    await expect(setDriverOnline(true, { lat: -17.8, lng: 31.0 })).rejects.toThrow(
      'Server did not confirm the requested status change',
    );
    expect(invalidateDriverProfileCache).not.toHaveBeenCalled();
  });
});

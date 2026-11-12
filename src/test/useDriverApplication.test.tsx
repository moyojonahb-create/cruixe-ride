import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { useDriverApplication } from '@/hooks/useDriverApplication';

vi.mock('@tanstack/react-query', () => ({ useQuery: vi.fn() }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'driver-auth-id' } }) }));
beforeEach(() => vi.mocked(useQuery).mockReset());

describe('Driver application current document evidence', () => {
  it('counts latest submissions rather than inventing four submitted documents or retaining replaced rejections', () => {
    vi.mocked(useQuery).mockReturnValueOnce({ data: { id: 'driver-row-id' }, isLoading: false, refetch: vi.fn() } as never)
      .mockReturnValueOnce({ data: [
        { document_type: 'license', status: 'approved' },
        { document_type: 'personal_photo', status: 'pending' },
        { document_type: 'insurance', status: 'rejected' },
        { document_type: 'license', status: 'rejected' },
      ], isLoading: false } as never);
    const { result } = renderHook(useDriverApplication);
    expect(result.current.documentsStatus).toEqual({ total: 3, approved: 1, pending: 1, rejected: 1 });
  });
  it('returns query errors and zero actual document counts', () => {
    const error = new Error('Request unavailable');
    vi.mocked(useQuery).mockReturnValueOnce({ data: null, isLoading: false, error, refetch: vi.fn() } as never)
      .mockReturnValueOnce({ data: [], isLoading: false } as never);
    const { result } = renderHook(useDriverApplication);
    expect(result.current.error).toBe(error);
    expect(result.current.documentsStatus.total).toBe(0);
  });
});

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import DocumentUpload from '@/components/driver/DocumentUpload';

vi.mock('@tanstack/react-query', () => ({ useQuery: vi.fn(), useMutation: () => ({ mutate: vi.fn() }), useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'auth-user' } }) }));
vi.mock('@/lib/businessApi', () => ({ createDriverDocument: vi.fn() }));
beforeEach(() => vi.mocked(useQuery).mockReset());
afterEach(cleanup);

describe('Driver application document recovery', () => {
  it('can replace every document type submitted by the registration wizard, without marking it approved', () => {
    vi.mocked(useQuery).mockReturnValue({ data: [], isLoading: false } as never);
    render(<DocumentUpload driverId="driver-row" />);
    for (const label of ['Profile photo', 'Identity document', 'Selfie with ID', "Driver's License · Front", "Driver's License · Back", 'Vehicle photo', 'Insurance']) {
      expect(screen.getByRole('button', { name: `Upload ${label}` })).toBeInTheDocument();
    }
    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
  });
  it('does not render an empty-document state when the document query failed', () => {
    vi.mocked(useQuery).mockReturnValue({ data: undefined, isLoading: false, error: new Error('permission denied') } as never);
    render(<DocumentUpload driverId="driver-row" />);
    expect(screen.getByRole('alert')).toHaveTextContent('We could not load your application documents.');
    expect(screen.queryByRole('button', { name: 'Upload Profile photo' })).not.toBeInTheDocument();
  });
});

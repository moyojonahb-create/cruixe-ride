import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DriverCaseStatusPage from '@/pages/driver/DriverCaseStatusPage';

const query = vi.hoisted(() => ({ eq: vi.fn(), limit: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'current-driver' } }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: query.eq, order: () => ({ limit: query.limit }) }) }) },
}));

afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe('Driver case status', () => {
  it.each([
    ['fare', 'fare_dispute', 'Fare Dispute Status'],
    ['safety', 'safety_concern', 'Safety Case Status'],
  ])('scopes the %s case query to the authenticated Driver and renders its saved state', async (route, category, heading) => {
    query.eq.mockReturnValue({ eq: query.eq, order: () => ({ limit: query.limit }) });
    query.limit.mockResolvedValue({ data: [{ id: 'case-1', ride_id: 'ride-1', status: 'resolved', admin_response: 'Reviewed by support' }], error: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/driver/cases/${route}`]}><Routes>
        <Route path="/driver/cases/:kind" element={<DriverCaseStatusPage />} />
      </Routes></MemoryRouter>
    </QueryClientProvider>);
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(await screen.findByText('Reviewed by support')).toBeInTheDocument();
    expect(screen.getByText('resolved')).toBeInTheDocument();
    expect(query.eq.mock.calls).toEqual([
      ['reporter_id', 'current-driver'], ['reporter_role', 'driver'], ['category', category],
    ]);
  });
});

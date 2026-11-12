import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AuthGuard from '@/components/AuthGuard';
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: null, loading: false }) }));
function SignInDestination() {
  const location = useLocation();
  return <output>{new URLSearchParams(location.search).get('next')}</output>;
}
describe('guarded journey continuation', () => {
  it('keeps the requested Driver trip after redirecting to sign-in', () => {
    render(<MemoryRouter initialEntries={['/driver/ride/test-trip?view=pickup#details']}><Routes>
      <Route path="/driver/ride/:id" element={<AuthGuard><div>Trip</div></AuthGuard>} />
      <Route path="/auth" element={<SignInDestination />} />
    </Routes></MemoryRouter>);
    expect(screen.getByRole('status')).toHaveTextContent('/driver/ride/test-trip?view=pickup#details');
  });
});

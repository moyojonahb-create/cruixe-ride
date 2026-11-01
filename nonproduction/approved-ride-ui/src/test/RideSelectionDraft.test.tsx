import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RiderNavigationProvider, useRiderNavigation } from '@/components/RiderNavigationProvider';
import { DEFAULT_TOWN } from '@/lib/towns';
const identity = vi.hoisted(() => ({ id: 'draft-test-user' as string | undefined }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: identity.id ? { id: identity.id } : null }) }));
beforeEach(() => { identity.id = 'draft-test-user'; });
function Editor() {
 const { draft, saveDraft } = useRiderNavigation(); const navigate = useNavigate();
 return <><output data-testid="draft">{draft ? `${draft.selectedTier}:${draft.pickup?.name}:${draft.passengerCount}` : 'empty'}</output>
 <button onClick={() => { saveDraft({ selectedTier: 'share', pickup: { name: 'Chosen pickup', lat: -20.93, lng: 29.01 }, dropoff: null, stops: [], scheduledAt: null, passengerCount: 3, town: DEFAULT_TOWN }); navigate('/profile'); }}>Leave with draft</button></>;
}
function Account() { const navigate=useNavigate(); return <button onClick={() => navigate(-1)}>Return to selection</button>; }
describe('selection draft across rider routes', () => {
 it('restores the chosen places, tier and passengers after the ride editor unmounts and browser back remounts it', () => {
  render(<MemoryRouter initialEntries={['/ride?view=choose']}><RiderNavigationProvider><Routes><Route path="/ride" element={<Editor />} /><Route path="/profile" element={<Account />} /></Routes></RiderNavigationProvider></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Leave with draft' }));
  expect(screen.queryByTestId('draft')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Return to selection' }));
  expect(screen.getByTestId('draft')).toHaveTextContent('share:Chosen pickup:3');
 });
});

function DraftLifecycleProbe() {
 const { draft, saveDraft } = useRiderNavigation();
 return <><output data-testid="lifecycle">{draft?.selectedTier ?? 'empty'}</output><button onClick={() => saveDraft({ selectedTier: 'parcel', pickup: null, dropoff: null, stops: [], scheduledAt: null, passengerCount: 1, town: DEFAULT_TOWN })}>Save selection</button></>;
}
function lifecycle() { return <RiderNavigationProvider><DraftLifecycleProbe /></RiderNavigationProvider>; }
describe('draft identity boundaries', () => {
 it('preserves a guest selection through sign-in', () => {
  identity.id = undefined;
  const view = render(lifecycle());
  fireEvent.click(screen.getByRole('button', { name: 'Save selection' }));
  identity.id = 'signed-in-rider'; view.rerender(lifecycle());
  expect(screen.getByTestId('lifecycle')).toHaveTextContent('parcel');
 });
 it('clears a signed-in selection on sign-out', () => {
  const view = render(lifecycle());
  fireEvent.click(screen.getByRole('button', { name: 'Save selection' }));
  identity.id = undefined; view.rerender(lifecycle());
  expect(screen.getByTestId('lifecycle')).toHaveTextContent('empty');
 });
});

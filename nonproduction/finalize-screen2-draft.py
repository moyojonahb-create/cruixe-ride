from pathlib import Path
u=Path('nonproduction/approved-ride-ui')
p=u/'src/components/RiderNavigationProvider.tsx';s=p.read_text();s=s.replace('    if (identity.current !== user?.id) saveDraft(null);', '    // Keep a guest draft through sign-in; clear it on sign-out or account switch.\n    if (identity.current && identity.current !== user?.id) saveDraft(null);');p.write_text(s,encoding='utf-8')
p=u/'src/components/ride/approvedRide.css';b=p.read_bytes();p.write_bytes(b.rstrip(b'\r\n')+b'\n')
p=Path('nonproduction/package-screen2.py');s=p.read_text(encoding='utf-8-sig').replace("'src/components/ride/rideSelection.css','src/test", "'src/components/ride/rideSelection.css','src/components/ride/approvedRide.css','src/test");p.write_text(s,encoding='utf-8')
p=u/'src/test/RideSelectionDraft.test.tsx';s=p.read_text(encoding='utf-8-sig')
s=s.replace("import { describe, expect, it, vi } from 'vitest';", "import { beforeEach, describe, expect, it, vi } from 'vitest';")
s=s.replace("vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'draft-test-user' } }) }));", "const identity = vi.hoisted(() => ({ id: 'draft-test-user' as string | undefined }));\nvi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: identity.id ? { id: identity.id } : null }) }));\nbeforeEach(() => { identity.id = 'draft-test-user'; });")
s += '''
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
'''
p.write_text(s,encoding='utf-8')
print('Preserved guest draft across sign-in; added identity regressions. Normalized CSS EOF only, without changing style declarations.')

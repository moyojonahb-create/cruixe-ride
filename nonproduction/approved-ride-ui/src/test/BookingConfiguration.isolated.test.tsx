import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RideView from '@/components/ride/RideView';
import { RiderNavigationProvider } from '@/components/RiderNavigationProvider';
import { fixtureEvents } from '../../qa-stabilization/fixture-services';

vi.mock('@/hooks/useAuth', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/hooks/useWallet', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/hooks/usePricingSettings', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/hooks/useOSRMRoute', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/hooks/useLandmarks', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/hooks/useStreets', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/hooks/useAppBootstrap', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/hooks/useNearbyDrivers', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/hooks/useRideRealtime', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/hooks/useStudentProfile', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/hooks/use-toast', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/lib/haptics', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/lib/supabaseClient', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/integrations/supabase/client', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/lib/goBackendClient', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/lib/requestRide', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/lib/placeCache', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/lib/geo_osm', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/lib/luggageStorage', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/lib/offerHelpers', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/lib/backendSocketClient', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/lib/businessApi', () => import('../../qa-stabilization/fixture-services'));
vi.mock('@/components/settings/RiderPreferencesSettings', () => import('../../qa-stabilization/fixture-services'));

vi.mock('@/hooks/useTownPricing', async () => ({
  ...await vi.importActual<typeof import('@/hooks/useTownPricing')>('@/hooks/useTownPricing'),
  useTownPricing: (await import('../../qa-stabilization/fixture-services')).useTownPricing,
}));
vi.mock('@/components/map/LazyMapboxMap', () => import('../../qa-stabilization/fixture-map'));

// Keep state/DOM behavior real; unit tests do not wait on animation frames.
// The separate browser suite exercises the actual motion implementation.
vi.mock('framer-motion', async () => {
 const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
 const React = await import('react');
 const cache = new Map();
 const omitted = new Set(['initial','animate','exit','transition','whileTap','whileHover','drag','dragConstraints','dragElastic','onDragEnd','layout','layoutId','variants']);
 return { ...actual, AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: new Proxy({}, { get: (_target, tag: string) => {
   if (!cache.has(tag)) cache.set(tag, React.forwardRef((props: Record<string, unknown>, ref) => React.createElement(tag, { ...Object.fromEntries(Object.entries(props).filter(([key]) => !omitted.has(key))), ref })));
   return cache.get(tag);
  } }),
 };
});

beforeAll(() => {
 vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
 HTMLElement.prototype.scrollTo = vi.fn();
 window.scrollTo = vi.fn();
 URL.createObjectURL = vi.fn(() => 'data:image/png;base64,iVBORw0KGgo=');
 URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);
beforeEach(() => { cleanup(); fixtureEvents.length = 0; window.history.replaceState({}, '', '/'); });
async function configure() {
 render(<MemoryRouter initialEntries={['/ride?view=choose']}><RiderNavigationProvider><RideView /></RiderNavigationProvider></MemoryRouter>);
 fireEvent.click(screen.getByRole('button', { name: 'Choose Economy' }));
 const input = screen.getByRole('textbox', { name: 'Destination' });
 fireEvent.change(input, { target: { value: 'Fixture' } });
 await waitFor(() => expect(document.querySelector('.destination-option')).not.toBeNull());
 fireEvent.click(document.querySelector('.destination-option')!);
 await waitFor(() => expect(document.querySelector('.ride-booking-sheet--configuration')).not.toBeNull());
}
const attempts = () => fixtureEvents.filter(event => event.action === 'requestRide denied');

describe('MOCKED/ISOLATED booking configuration (no successful backend responses)', () => {
 it('preserves tier/places, clamps passengers and returns from payment selection without booking', async () => {
  await configure();
  expect(screen.getByLabelText('Trip route')).toHaveTextContent('Fixture destination');
  expect(screen.queryByText(/Travelling with luggage/)).not.toBeInTheDocument();
  const more = screen.getByRole('button', { name: 'More passengers' });
  const fewer = screen.getByRole('button', { name: 'Fewer passengers' });
  expect(fewer).toBeDisabled();
  for (let i = 0; i < 5; i++) fireEvent.click(more);
  expect(more).toBeDisabled();
  fireEvent.click(document.querySelector('.ride-config-utility--cash')!);
  fireEvent.click(await screen.findByRole('radio', { name: /CruiXe wallet/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Pay from wallet' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Choose payment method' })).not.toBeInTheDocument());
  expect(document.querySelector('.ride-config-utility--cash')).toHaveTextContent('Wallet');
  expect(attempts()).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Confirm location & continue' }));
  await waitFor(() => expect(attempts()).toHaveLength(1));
  expect(attempts()[0].detail).toMatchObject({ passenger_count: 4, payment_method: 'wallet', vehicle_type: 'economy', dropoff_address: 'Fixture destination' });
  expect(fixtureEvents.some(event => event.action === 'toast' && JSON.stringify(event.detail).includes('ISOLATED FIXTURE'))).toBe(true);
 }, 20000);
 it('supports optional photo preview/save/remove entirely in memory', async () => {
  await configure();
  fireEvent.click(document.querySelector('.ride-config-utility--luggage')!);
  await screen.findByRole('heading', { name: 'Add Luggage' });
  fireEvent.change(document.querySelector('input[type="file"][multiple]')!, { target: { files: [new File(['isolated fixture'], 'luggage.png', { type: 'image/png' })] } });
  await screen.findByText('Photos (1/5)');
  fireEvent.click(screen.getByRole('button', { name: 'Save Luggage Details' }));
  await waitFor(() => expect(document.querySelector('.ride-config-utility--luggage')).toHaveTextContent('Photo added'));
  fireEvent.click(document.querySelector('.ride-config-utility--luggage')!);
  await screen.findByText('Photos (1/5)');
  expect(screen.getByLabelText('What are you transporting?')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Remove luggage photo 1' }));
  await screen.findByText('Photos (0/5)');
  expect(fixtureEvents.some(event => event.action === 'in-memory photo removed')).toBe(true);
  expect(attempts()).toHaveLength(0);
 }, 20000);
 it('keeps insufficient Wallet disabled and EcoCash unavailable', async () => {
  window.history.replaceState({}, '', '/?wallet=0');
  await configure();
  fireEvent.click(document.querySelector('.ride-config-utility--cash')!);
  expect(await screen.findByRole('radio', { name: /CruiXe wallet/i })).toBeDisabled();
  expect(screen.getByText('Coming soon')).toBeVisible();
  expect(screen.queryByRole('radio', { name: /EcoCash/i })).not.toBeInTheDocument();
  expect(attempts()).toHaveLength(0);
 }, 20000);
 it('opens Schedule and preserves a chosen date on a denied isolated booking attempt', async () => {
  await configure();
  fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));
  await screen.findByText('Schedule your ride');
  fireEvent.click(screen.getByRole('button', { name: /Tomorrow/ }));
  const confirm = screen.getByRole('button', { name: /^Schedule for / });
  fireEvent.click(confirm);
  await waitFor(() => expect(attempts()).toHaveLength(1));
  expect((attempts()[0].detail as Record<string, unknown>).scheduled_at).toEqual(expect.any(String));
  expect(new Date(String((attempts()[0].detail as Record<string, unknown>).scheduled_at)).getTime()).toBeGreaterThan(Date.now());
 }, 20000);
});

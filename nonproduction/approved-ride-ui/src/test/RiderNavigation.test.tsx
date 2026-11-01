import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import BottomNavBar from '@/components/BottomNavBar';
import { RiderNavigationProvider } from '@/components/RiderNavigationProvider';
import { activeRiderTab } from '@/lib/riderNavigation';
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'unit-test-rider' } }) }));
vi.mock('@/lib/haptics', () => ({ haptic: vi.fn() }));
function RouteProbe() {
 const location = useLocation(); const navigate = useNavigate();
 return <><output data-testid="route">{location.pathname}{location.search}</output><button onClick={() => navigate(-1)}>Browser back</button><BottomNavBar /></>;
}
function app(entry = '/ride?view=choose') {
 return render(<MemoryRouter initialEntries={[entry]}><RiderNavigationProvider><RouteProbe /><BottomNavBar persistent /></RiderNavigationProvider></MemoryRouter>);
}
describe('route-driven floating rider navigation', () => {
 it('starts on Ride with one bar, one selected icon and all five accessible tab names', () => {
  app();
  expect(screen.getAllByRole('navigation', { name: 'Rider navigation' })).toHaveLength(1);
  for (const name of ['Home', 'Activity', 'Ride', 'Wallet', 'Account']) expect(screen.getByRole('button', { name })).toBeVisible();
  expect(document.querySelectorAll('[data-selected="true"]')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Ride' })).toHaveAttribute('aria-current', 'page');
 });
 it.each([['Activity', '/history'], ['Wallet', '/wallet'], ['Account', '/profile']])('transfers selection to %s from the real destination route and restores it on back', async (name, route) => {
  app(); const bar = screen.getByRole('navigation');
  const initialCurve = document.querySelector('.rider-navigation__background path')?.getAttribute('d');
  fireEvent.click(screen.getByRole('button', { name }));
  expect(screen.getByTestId('route')).toHaveTextContent(route);
  expect(document.querySelector('.rider-navigation__background path')?.getAttribute('d')).not.toBe(initialCurve);
  expect(screen.getByRole('navigation')).toBe(bar);
  expect(screen.getByRole('button', { name })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('button', { name: 'Ride' })).not.toHaveAttribute('aria-current');
  expect(document.querySelectorAll('[data-selected="true"]')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Ride' })).toHaveAttribute('aria-current', 'page'));
 });
 it('uses the existing ride-home route and hides the bar after its exit transition', async () => {
  app(); fireEvent.click(screen.getByRole('button', { name: 'Home' }));
  expect(screen.getByTestId('route')).toHaveTextContent('/ride');
  expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
 });
 it.each([['/wallet', 'Wallet'], ['/profile', 'Account'], ['/history', 'Activity']])('derives active selection after deep linking/reloading %s', (route, name) => {
  app(route); expect(screen.getByRole('button', { name })).toHaveAttribute('aria-current', 'page');
 });
 it('preserves home and derives Ride for location entry', () => {
  expect(activeRiderTab('/ride', '?view=choose')).toBe('ride');
  expect(activeRiderTab('/ride', '')).toBe('home');
  const rendered = app('/ride'); expect(screen.queryByRole('navigation')).not.toBeInTheDocument(); rendered.unmount();
  expect(activeRiderTab('/ride', '?view=locations&tier=share')).toBe('ride');
 });
});

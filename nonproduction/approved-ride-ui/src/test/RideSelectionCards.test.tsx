import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RideTierSelector, { type RideTierOption } from '@/components/ride/RideTierSelector';
const options: RideTierOption[] = [
  { id: 'economy', name: 'Economy', capacity: 4, etaMinutes: null, price: null, badge: 'Fast pickup', badgeVariant: 'primary' },
  { id: 'share', name: 'Share Ride', capacity: 4, etaMinutes: null, price: null, badge: 'Save more', badgeVariant: 'accent' },
  { id: 'parcel', name: 'Parcel', capacity: 1, etaMinutes: null, price: null, badge: 'Send anything', badgeVariant: 'accent' },
];
describe('pre-route ride selection', () => {
 it('shows three fully named categories with actual capacities and verified vehicle paths', () => {
  const { container } = render(<RideTierSelector presentation="selection" options={options} selected="economy" onSelect={() => {}} currencySymbol="$" />);
  expect(screen.getByRole('button', { name: 'Choose Economy' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('Shared')).toBeVisible();
  expect(screen.getByText('Parcel')).toBeVisible();
  expect(screen.getAllByLabelText('4 passengers')).toHaveLength(2);
  expect(Array.from(container.querySelectorAll('img')).map(i => i.getAttribute('src'))).toEqual([
   '/brand/cruize-economy-car.webp', '/brand/cruize-shared-car.webp', '/brand/cruize-parcel-van.webp',
  ]);
 });
 it.each([['Economy', 'economy'], ['Shared', 'share'], ['Parcel', 'parcel']])('forwards %s to its existing service ID exactly once', (name, id) => {
  const select = vi.fn();
  render(<RideTierSelector presentation="selection" options={options} selected="economy" onSelect={select} currencySymbol="$" />);
  fireEvent.click(screen.getByRole('button', { name: `Choose ${name}` }));
  expect(select).toHaveBeenCalledExactlyOnceWith(id);
 });
 it('omits unsupported claims and pre-route fare/ETA/payment content even when metadata contains it', () => {
  render(<RideTierSelector presentation="selection" options={options.map(o => ({ ...o, price: 12, etaMinutes: 3 }))} selected="economy" onSelect={() => {}} currencySymbol="$" />);
  expect(screen.queryByText(/Fast pickup|Save more|Send anything|See fare next|12\.00|3 min|payment/i)).not.toBeInTheDocument();
 });
 it('keeps the later booking presentation and passenger stepper available', () => {
  render(<RideTierSelector options={options} selected="economy" onSelect={() => {}} currencySymbol="$" onPassengerCountChange={() => {}} />);
  expect(screen.getByText('Passengers')).toBeVisible();
  expect(screen.getAllByText('See fare next', { selector: 'p' })).toHaveLength(3);
 });
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DestinationSearchScreen from '@/components/ride/DestinationSearchScreen';

vi.mock('@/hooks/useAppBootstrap', () => ({
  useAppBootstrap: () => ({
    favorites: [{ id: 'home', name: 'Home', address: '12 Main Road', latitude: -17.825, longitude: 31.033, icon: 'home' }],
    recentRides: [{ pickup_address: 'Market, Harare', pickup_lat: -17.83, pickup_lon: 31.04, dropoff_address: 'Clinic, Harare', dropoff_lat: -17.84, dropoff_lon: 31.05 }],
  }),
}));

afterEach(cleanup);

function props() {
  return {
    activeField: 'pickup' as 'pickup' | 'dropoff',
    onActiveFieldChange: vi.fn(), pickupName: 'Selected pickup', dropoffName: 'Selected destination',
    query: '', onQueryChange: vi.fn(), onClose: vi.fn(), onUseMyLocation: vi.fn(),
    onChooseOnMap: vi.fn(), onSelectPlace: vi.fn(), results: [], onRequestSetFavorite: vi.fn(),
  };
}

describe('DestinationSearchScreen', () => {
  it.each([['pickup', 'Pickup'], ['dropoff', 'Destination']] as const)(
    'labels, autofocuses, edits and clears the %s field without nested controls',
    (field, label) => {
      const callbacks = props();
      const { rerender } = render(<DestinationSearchScreen {...callbacks} activeField={field} />);
      const input = screen.getByRole('textbox', { name: label });
      expect(input).toHaveFocus();
      expect(input.closest('button')).toBeNull();
      fireEvent.change(input, { target: { value: 'Harare' } });
      expect(callbacks.onQueryChange).toHaveBeenLastCalledWith('Harare');
      rerender(<DestinationSearchScreen {...callbacks} activeField={field} query="Harare" />);
      expect(screen.getByRole('textbox', { name: label })).toHaveValue('Harare');
      const clear = screen.getByRole('button', { name: `Clear ${label.toLowerCase()}` });
      expect(clear.tagName).toBe('BUTTON');
      expect(clear.parentElement?.closest('button')).toBeNull();
      clear.focus();
      expect(clear).toHaveFocus();
      fireEvent.click(clear); // Keyboard/assistive technology also synthesize native click.
      expect(callbacks.onQueryChange).toHaveBeenLastCalledWith('');
      expect(callbacks.onActiveFieldChange).not.toHaveBeenCalled();
      expect(screen.getByRole('textbox', { name: label })).toHaveFocus();
    },
  );

  it('switches fields through a native focusable button and autofocuses the new input', () => {
    const callbacks = props();
    const { rerender } = render(<DestinationSearchScreen {...callbacks} />);
    const destination = screen.getByRole('button', { name: 'Edit destination' });
    destination.focus();
    expect(destination).toHaveFocus();
    expect(destination).toHaveAccessibleDescription('Selected destination');
    expect(destination.tagName).toBe('BUTTON');
    fireEvent.click(destination);
    expect(callbacks.onActiveFieldChange).toHaveBeenCalledWith('dropoff');
    rerender(<DestinationSearchScreen {...callbacks} activeField="dropoff" />);
    expect(screen.getByRole('textbox', { name: 'Destination' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Edit pickup' }));
    expect(callbacks.onActiveFieldChange).toHaveBeenLastCalledWith('pickup');
  });

  it('preserves suggestion selection callbacks', () => {
    const callbacks = props();
    const onSelect = vi.fn();
    render(<DestinationSearchScreen {...callbacks} query="Harare" results={[{ id: '1', name: 'Harare Gardens', secondary: 'Harare', onSelect }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Harare Gardens Harare' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(callbacks.onSelectPlace).not.toHaveBeenCalled();
  });

  it('preserves favorite and recent address/coordinate payloads', () => {
    const callbacks = props();
    render(<DestinationSearchScreen {...callbacks} />);
    fireEvent.click(screen.getByRole('button', { name: 'Home 12 Main Road' }));
    expect(callbacks.onSelectPlace).toHaveBeenLastCalledWith({ name: 'Home', lat: -17.825, lng: 31.033 });
    fireEvent.click(screen.getByRole('button', { name: 'Market Harare' }));
    expect(callbacks.onSelectPlace).toHaveBeenLastCalledWith({ name: 'Market', lat: -17.83, lng: 31.04, secondary: 'Harare' });
  });
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DriverDestinationReached from '@/components/driver/DriverDestinationReached';

afterEach(cleanup);
const props = () => ({
  passengerName: 'Passenger Test',
  passengerCount: 2,
  destination: 'Central Market',
  fare: 7.5,
  paymentMethod: 'cash',
  confirming: false,
  farFromDropoff: false,
  onBack: vi.fn(),
  onConfirm: vi.fn(),
});
describe('Driver destination reached', () => {
  it('shows the live trip details and preserves explicit confirmation', () => {
    const p = props();
    render(<DriverDestinationReached {...p} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-figma-node', '1185:115');
    expect(screen.getByRole('heading', { name: "You've reached Central Market" })).toBeInTheDocument();
    expect(screen.getByText('Passenger Test')).toBeInTheDocument();
    expect(screen.getByText('$7.50')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'End trip' }));
    expect(p.onConfirm).toHaveBeenCalledOnce();
  });
  it('allows closing without ending the trip', () => {
    const p = props();
    render(<DriverDestinationReached {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to active trip' }));
    expect(p.onBack).toHaveBeenCalledOnce();
    expect(p.onConfirm).not.toHaveBeenCalled();
  });
  it('shows the distance warning when outside the end-trip boundary', () => {
    render(<DriverDestinationReached {...props()} farFromDropoff />);
    expect(screen.getByRole('alert')).toHaveTextContent('far from the drop-off');
  });
  it('prevents duplicate confirmation while completing', () => {
    render(<DriverDestinationReached {...props()} confirming />);
    expect(screen.getByRole('button', { name: 'Ending trip…' })).toBeDisabled();
  });
});

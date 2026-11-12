import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DriverDetailScreen from '@/components/driver/DriverDetailScreen';
afterEach(cleanup);
const profile = { gender: null, status: 'pending', vehicle_make: 'Toyota', vehicle_model: 'Aqua', vehicle_color: 'White', vehicle_type: 'economy', plate_number: 'ABC123' };
const props = { fullName: 'Test Driver', phone: null, email: null, profile, onBack: vi.fn(), onDocuments: vi.fn() };
describe('Driver detail screens', () => {
  it('shows actual application status without inventing approval', () => {
    render(<DriverDetailScreen {...props} kind="personal" />);
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to Driver profile' }));
    expect(props.onBack).toHaveBeenCalled();
  });
  it('shows absent contact values honestly and exposes support', () => {
    render(<DriverDetailScreen {...props} kind="contact" />);
    expect(screen.getAllByText('Not provided')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', 'mailto:support@pickme.co.zw');
  });
  it('shows the actual vehicle and connects the documents action', () => {
    render(<DriverDetailScreen {...props} kind="vehicle" />);
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View application and documents' }));
    expect(props.onDocuments).toHaveBeenCalled();
  });
});

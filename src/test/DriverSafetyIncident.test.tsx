import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import DisputeForm from '@/components/ride/DisputeForm';

const mocks = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'driver-1' } }) }));
vi.mock('@/lib/businessApi', () => ({ submitDispute: mocks.submit }));

it('shows Driver safety confirmation only after the server acknowledges the report', async () => {
  mocks.submit.mockResolvedValueOnce({ success: false }).mockResolvedValueOnce({ success: true });
  render(<MemoryRouter><DisputeForm rideId="ride-1" role="driver" /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Report Issue' }));
  fireEvent.click(screen.getByRole('button', { name: 'Safety Concern' }));
  fireEvent.change(screen.getByPlaceholderText('Describe the issue in detail...'), { target: { value: 'Test safety report for this ride.' } });
  const submit = screen.getByRole('button', { name: 'Submit Report' });
  fireEvent.click(submit);
  await waitFor(() => expect(submit).toBeEnabled());
  expect(screen.queryByText('Safety Incident Submitted')).toBeNull();
  fireEvent.click(submit);
  expect(await screen.findByText('Safety Incident Submitted')).toBeInTheDocument();
  expect(mocks.submit).toHaveBeenCalledWith(expect.objectContaining({ ride_id: 'ride-1', reporter_role: 'driver', category: 'safety_concern' }));
  expect(screen.getByRole('link', { name: 'Track Safety Report' })).toHaveAttribute('href', '/driver/cases/safety');
});

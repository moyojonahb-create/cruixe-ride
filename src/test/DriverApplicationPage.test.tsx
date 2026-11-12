import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DriverApplication from '@/pages/DriverApplication';

const state = vi.hoisted(() => ({ error: null as Error | null }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'driver-user' }, loading: false }) }));
vi.mock('@/hooks/useDriverApplication', () => ({ useDriverApplication: () => ({
  driverProfile: { id: 'driver-row', status: 'pending', vehicle_type: 'economy' },
  documentsStatus: { total: 0, approved: 0, pending: 0, rejected: 0 },
  isLoading: false, refetchDriver: vi.fn(), hasApplied: true, error: state.error,
}) }));
vi.mock('@/components/Header', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/auth/AuthModalWrapper', () => ({ default: () => null }));
vi.mock('@/components/driver/DriverRegistrationWizard', () => ({ default: () => <div>New application form</div> }));
vi.mock('@/components/driver/DocumentUpload', () => ({ default: () => <div>Document upload controls</div> }));
afterEach(() => { cleanup(); state.error = null; vi.restoreAllMocks(); });

describe('Driver application route', () => {
  it('fails closed when status cannot be verified instead of displaying stale approval', () => {
    state.error = new Error('private database diagnostic');
    render(<MemoryRouter><DriverApplication /></MemoryRouter>);
    expect(screen.getByRole('alert')).toHaveTextContent('Your application status could not be checked');
    expect(screen.queryByRole('heading', { name: 'Application received' })).not.toBeInTheDocument();
    expect(screen.queryByText('New application form')).not.toBeInTheDocument();
    expect(screen.queryByText('private database diagnostic')).not.toBeInTheDocument();
  });
  it('takes the review action to the real document upload section', () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(<MemoryRouter><DriverApplication /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Review application' }));
    const section = screen.getByRole('region', { name: 'Application documents' });
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(section).toHaveFocus();
    expect(section).toHaveTextContent('Document upload controls');
  });
});

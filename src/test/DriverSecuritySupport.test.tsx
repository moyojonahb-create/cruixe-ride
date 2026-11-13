import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const auth = vi.hoisted(() => ({ getUser: vi.fn(), signInWithPassword: vi.fn(), updateUser: vi.fn() }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { auth } }));
import DriverSecuritySupport from '@/components/driver/DriverSecuritySupport';

beforeEach(() => {
  vi.clearAllMocks();
  auth.getUser.mockResolvedValue({ data: { user: { id: 'driver-id', email: 'driver@example.test' } }, error: null });
  auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'driver-id' } }, error: null });
  auth.updateUser.mockResolvedValue({ data: { user: { id: 'driver-id' } }, error: null });
});
afterEach(cleanup);
function fill() {
  fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'Current123!' } });
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Changed123!' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Changed123!' } });
}
describe('Driver security and support flow', () => {
  it('blocks all auth writes and email actions in preview', () => {
    const view = render(<DriverSecuritySupport preview onBack={vi.fn()} initialScreen="password" />);
    fill(); fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(screen.getByRole('status')).toHaveTextContent('No password has been changed');
    expect(auth.getUser).not.toHaveBeenCalled(); expect(auth.updateUser).not.toHaveBeenCalled();
    view.unmount(); render(<DriverSecuritySupport preview onBack={vi.fn()} initialScreen="support" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open email draft' }));
    expect(screen.getByRole('status')).toHaveTextContent('No email was opened');
  });
  it('retains inputs and prevents update when current password verification fails', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({ data: { user: null }, error: { message: 'invalid' } });
    render(<DriverSecuritySupport initialScreen="password" onBack={vi.fn()} />); fill();
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be verified');
    expect(screen.getByLabelText('New password')).toHaveValue('Changed123!');
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it('rejects invalid confirmation before any authentication call', () => {
    render(<DriverSecuritySupport initialScreen="password" onBack={vi.fn()} />); fill();
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Different123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(screen.getByRole('alert')).toHaveTextContent('do not match');
    expect(auth.getUser).not.toHaveBeenCalled();
  });
  it('prevents duplicate requests and shows review only after server success', async () => {
    let resolve!: (result: unknown) => void;
    auth.updateUser.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    render(<DriverSecuritySupport initialScreen="password" onBack={vi.fn()} />); fill();
    const save = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(save); fireEvent.click(save);
    await waitFor(() => expect(auth.updateUser).toHaveBeenCalledTimes(1));
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'driver@example.test', password: 'Current123!' });
    expect(screen.queryByRole('heading', { name: 'Password Change Review' })).not.toBeInTheDocument();
    resolve({ data: {}, error: null });
    await screen.findByRole('heading', { name: 'Password Change Review' });
    expect(screen.getByText('Updated successfully')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Account Security' }));
    expect(screen.getByLabelText('New password')).toHaveValue('');
  });
  it('allows retry after a failed update without displaying a false confirmation', async () => {
    auth.updateUser.mockResolvedValueOnce({ error: { message: 'unavailable' } });
    render(<DriverSecuritySupport initialScreen="password" onBack={vi.fn()} />); fill();
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('was not changed');
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await screen.findByRole('heading', { name: 'Password Change Review' });
    expect(auth.updateUser).toHaveBeenCalledTimes(2);
  });
  it('routes Help topics and keeps unsupported two-step verification disabled', () => {
    const navigate = vi.fn(); const view = render(<DriverSecuritySupport initialScreen="help" onBack={vi.fn()} onNavigate={navigate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Driver profile Verification and account' }));
    expect(navigate).toHaveBeenCalledWith('documents');
    fireEvent.click(screen.getByRole('button', { name: 'Contact Support' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open email draft' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a category');
    view.unmount(); render(<DriverSecuritySupport onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Two-Step Verification/ })).toBeDisabled();
  });
});

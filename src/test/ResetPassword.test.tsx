import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
const auth = vi.hoisted(() => ({ updateUser: vi.fn(), signOut: vi.fn(), getSession: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { ...auth, onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }) } } }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
import ResetPassword from '@/pages/ResetPassword';
function renderPage() { render(<MemoryRouter initialEntries={['/reset-password']}><Routes><Route path="/reset-password" element={<ResetPassword />} /><Route path="/auth" element={<h1>Sign in</h1>} /></Routes></MemoryRouter>); }
async function submit(password='Secure123!') {
  fireEvent.change(await screen.findByLabelText('New password'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
}
describe('password recovery screens', () => {
  beforeEach(() => { vi.clearAllMocks(); auth.getSession.mockResolvedValue({data:{session:{user:{id:'test'}}}}); auth.updateUser.mockResolvedValue({error:null}); auth.signOut.mockResolvedValue({error:null}); });
  it('shows success only after save and returns to login with a local sign-out', async () => {
    renderPage(); await submit();
    expect(await screen.findByText('Password changed')).toBeInTheDocument();
    expect(auth.updateUser).toHaveBeenCalledWith({password:'Secure123!'});
    fireEvent.click(screen.getByRole('button',{name:'Continue to login'}));
    expect(await screen.findByRole('heading',{name:'Sign in'})).toBeInTheDocument();
    expect(auth.signOut).toHaveBeenCalledWith({scope:'local'});
  });
  it('keeps the existing number AND special character requirement', async () => {
    renderPage(); await submit('Secure123');
    expect(await screen.findByRole('alert')).toHaveTextContent('special character');
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it('shows retryable network failure without false success', async () => {
    auth.updateUser.mockRejectedValueOnce(new Error('offline'));
    renderPage(); await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('connection');
    expect(screen.queryByText('Password changed')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Update password'}));
    expect(await screen.findByText('Password changed')).toBeInTheDocument();
  });
  it('does not render the update form without a session', async () => {
    auth.getSession.mockResolvedValue({data:{session:null}}); renderPage();
    expect(await screen.findByText('Code expired')).toBeInTheDocument();
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  });
});

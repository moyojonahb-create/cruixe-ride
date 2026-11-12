import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
const mocks = vi.hoisted(() => ({ signUp: vi.fn(), lookup: vi.fn(), toast: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ signUp: mocks.signUp }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/integrations/lovable/index', () => ({ lovable: { auth: {} } }));
vi.mock('@/lib/businessApi', () => ({ updateMyProfile: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.lookup }) }) }),
  auth: { getUser: vi.fn().mockResolvedValue({ data: {} }) },
} }));
import Signup from '@/pages/Signup';
const fetchMock = vi.fn();
function reply(success: boolean) { return { ok: success, json: async () => ({ success, message: success ? undefined : 'SMS unavailable' }) }; }
function mount() {
  return render(<MemoryRouter initialEntries={['/signup?next=%2Fdriver%2Fregister']}><Routes>
    <Route path="/signup" element={<Signup />} />
    <Route path="/driver/register" element={<h1>Driver registration</h1>} />
  </Routes></MemoryRouter>);
}
async function submit(phone = '0771234567') {
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Driver' } });
  fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: phone } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Secure123!' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Secure123!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
  await screen.findByRole('heading', { name: 'Verify your phone' });
}
describe('signup verification recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.lookup.mockResolvedValue({ data: null });
    mocks.signUp.mockResolvedValue({ error: null });
    fetchMock.mockResolvedValue(reply(true));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  });
  afterEach(async () => {
    cleanup();
    // input-otp schedules selection work up to 50ms after focus. Drain it
    // after unmount while JSDOM still exists.
    await new Promise(resolve => setTimeout(resolve, 60));
    vi.unstubAllGlobals();
  });
  it('reports send failure honestly, permits retry, and never creates an account', async () => {
    fetchMock.mockResolvedValueOnce(reply(false));
    mount(); await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not send your code');
    expect(screen.queryByText(/We sent a 6-digit/)).not.toBeInTheDocument();
    expect(mocks.signUp).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Resend code' }));
    await screen.findByText(/We sent a 6-digit/);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ action: 'send', phone: '+263771234567' });
  });
  it('releases the submission guard after a lookup exception so the form can retry', async () => {
    mocks.lookup.mockRejectedValueOnce(new Error('offline'));
    mount();
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Driver' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '0771234567' } });
    for (const label of ['Password', 'Confirm password']) fireEvent.change(screen.getByLabelText(label), { target: { value: 'Secure123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Unable to continue' })));
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await screen.findByRole('heading', { name: 'Verify your phone' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('recovers from a transport failure without starting a cooldown or claiming delivery', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    mount(); await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('offline');
    expect(screen.getByRole('button', { name: 'Resend code' })).toBeEnabled();
    expect(screen.queryByText(/We sent a 6-digit/)).not.toBeInTheDocument();
  });
  it('blocks duplicate submissions during the profile lookup', async () => {
    let resolve!: (value: {data:null}) => void;
    mocks.lookup.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    mount();
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Driver' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '0771234567' } });
    for (const label of ['Password', 'Confirm password']) fireEvent.change(screen.getByLabelText(label), { target: { value: 'Secure123!' } });
    const button = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    fireEvent.submit(button.closest('form')!);
    expect(mocks.lookup).toHaveBeenCalledTimes(1);
    resolve({ data: null });
    await screen.findByRole('heading', { name: 'Verify your phone' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('sends immediately to a changed number without retaining the previous cooldown', async () => {
    mount(); await submit();
    await screen.findByRole('button', { name: /Resend in/ });
    fireEvent.click(screen.getByRole('button', { name: 'Change number' }));
    await submit('0777654321');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).phone).toBe('+263777654321');
  });
  it('keeps voice unavailable and preserves the SMS cooldown through methods navigation', async () => {
    mount(); await submit();
    await screen.findByRole('button', { name: /Resend in/ });
    fireEvent.click(screen.getByRole('button', { name: 'Other verification methods' }));
    expect(screen.getByText('Automated phone call').parentElement).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: /Text message/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Back to phone verification' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
});

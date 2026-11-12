import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
const mocks = vi.hoisted(() => ({ signUp: vi.fn(), lookup: vi.fn(), rpc: vi.fn(), getUser: vi.fn(), toast: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ signUp: mocks.signUp }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/integrations/lovable/index', () => ({ lovable: { auth: {} } }));
vi.mock('@/lib/businessApi', () => ({ updateMyProfile: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.lookup }) }) }),
  rpc: mocks.rpc,
  auth: { getUser: mocks.getUser },
} }));
import Signup from '@/pages/Signup';
const fetchMock = vi.fn();
function reply(success: boolean) { return { ok: success, json: async () => ({ success, message: success ? undefined : 'SMS unavailable' }) }; }
function mount(next = '/driver/register') {
  return render(<MemoryRouter initialEntries={[`/signup?next=${encodeURIComponent(next)}`]}><Routes>
    <Route path="/signup" element={<Signup />} />
    <Route path="/driver/register" element={<h1>Driver registration</h1>} />
    <Route path="/ride" element={<h1>Rider home</h1>} />
  </Routes></MemoryRouter>);
}
async function advanceIdentity() {
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Driver' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('heading', { name: 'Secure your account' });
}
function fillSecurity(phone = '0771234567', password = 'Secure123!', confirmation = password) {
  fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: phone } });
  fireEvent.change(screen.getByLabelText('Create password'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: confirmation } });
}
async function submit(phone = '0771234567') {
  if (screen.queryByLabelText('Full name')) await advanceIdentity();
  fillSecurity(phone);
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('heading', { name: 'Verify your phone' });
}
describe('signup verification recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    mocks.lookup.mockResolvedValue({ data: null });
    mocks.getUser.mockResolvedValue({ data: {} });
    mocks.rpc.mockResolvedValue({ data: false });
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
    vi.restoreAllMocks();
  });
  it('keeps Rider signup as one form with its existing account action', async () => {
    mount('/ride');
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Rider' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '0771234567' } });
    for (const label of ['Password', 'Confirm password']) fireEvent.change(screen.getByLabelText(label), { target: { value: 'Secure123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await screen.findByRole('heading', { name: 'Verify your phone' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('does not advance invalid driver identity or send a code before security', async () => {
    mount();
    expect(screen.queryByLabelText('Mobile number')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Full Name is required')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Secure your account' })).not.toBeInTheDocument();
    expect(mocks.lookup).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    ['weak password', 'weakpass', 'weakpass', 'Must include uppercase, lowercase, number, and special character'],
    ['mismatched confirmation', 'Secure123!', 'Different123!', 'Passwords must match'],
  ])('blocks %s on the driver security step', async (_case, password, confirmation, message) => {
    mount(); await advanceIdentity();
    fillSecurity('0771234567', password, confirmation);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(mocks.lookup).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('retains identity and security inputs when navigating back through driver signup', async () => {
    mount(); await advanceIdentity();
    fillSecurity();
    fireEvent.click(screen.getByRole('button', { name: 'Back to personal details' }));
    expect(await screen.findByLabelText('Full name')).toHaveValue('Test Driver');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByLabelText('Mobile number')).toHaveValue('0771234567');
    expect(screen.getByLabelText('Create password')).toHaveValue('Secure123!');
    expect(screen.getByLabelText('Confirm password')).toHaveValue('Secure123!');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/auth?next=%2Fdriver%2Fregister');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('returns a taken nickname error to the visible identity step without sending OTP', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: true });
    mount();
    fireEvent.change(screen.getByLabelText(/Nickname/), { target: { value: 'taken_driver' } });
    await advanceIdentity(); fillSecurity();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('That nickname is already taken.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nickname/)).toHaveValue('taken_driver');
    expect(screen.getByLabelText('Full name')).toHaveValue('Test Driver');
    expect(screen.queryByRole('heading', { name: 'Secure your account' })).not.toBeInTheDocument();
    expect(mocks.rpc).toHaveBeenCalledWith('nickname_is_taken', { _nickname: 'taken_driver' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('disables security Back while the account lookup is pending', async () => {
    let resolve!: (value: { data: null }) => void;
    mocks.lookup.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    mount(); await advanceIdentity(); fillSecurity();
    const back = screen.getByRole('button', { name: 'Back to personal details' });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(back).toBeDisabled());
    fireEvent.click(back);
    expect(screen.getByRole('heading', { name: 'Secure your account' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    resolve({ data: null });
    await screen.findByRole('heading', { name: 'Verify your phone' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
    mount(); await advanceIdentity(); fillSecurity();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Unable to continue' })));
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
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
    mount(); await advanceIdentity(); fillSecurity();
    const button = screen.getByRole('button', { name: 'Continue' });
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
    await screen.findByRole('heading', { name: 'Secure your account' });
    await submit('0777654321');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).phone).toBe('+263777654321');
  });
  it('keeps voice unavailable and preserves the SMS cooldown through methods navigation', async () => {
    mount(); await submit();
    await screen.findByRole('button', { name: /Resend in/ });
    fireEvent.click(screen.getByRole('button', { name: 'Other verification methods' }));
    expect(await screen.findByRole('heading', { name: 'Choose verification' })).toBeInTheDocument();
    expect(screen.getByText('Automated phone call').parentElement).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: /Text message/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Back to phone verification' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
  it('rejects an invalid OTP without creating an account', async () => {
    const { container } = mount(); await submit();
    fetchMock.mockResolvedValueOnce(reply(false));
    fireEvent.change(container.querySelector('input[autocomplete="one-time-code"]')!, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify Code' }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Invalid code' })));
    expect(mocks.signUp).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Verify Code' })).toBeDisabled();
  });
  it('retries failed account creation after phone verification without requesting another OTP', async () => {
    mocks.signUp.mockResolvedValueOnce({ error: { message: 'Account service unavailable' } });
    const { container } = mount(); await submit();
    fireEvent.change(container.querySelector('input[autocomplete="one-time-code"]')!, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify Code' }));
    expect(await screen.findByRole('alert', {}, { timeout: 2000 })).toHaveTextContent('Account service unavailable');
    expect(screen.queryByRole('heading', { name: 'Driver registration' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Driver registration' })).toBeInTheDocument();
    expect(mocks.signUp).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('creates an account only after OTP verification and preserves the driver destination', async () => {
    const { container } = mount(); await submit();
    const code = container.querySelector('input[autocomplete="one-time-code"]');
    expect(code).not.toBeNull();
    fireEvent.change(code!, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify Code' }));
    expect(await screen.findByRole('heading', { name: 'Driver registration' }, { timeout: 2000 })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ action: 'verify', phone: '+263771234567', code: '123456' });
    expect(mocks.signUp).toHaveBeenCalledWith('263771234567@pickme.phone', 'Secure123!', 'Test Driver', { nickname: undefined, phone: '+263771234567' });
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ update: vi.fn(), contact: vi.fn() }));
vi.mock('@/lib/businessApi', () => ({ updateMyProfile: mocks.update }));
vi.mock('@/lib/riderEmergencyContact', () => ({ saveRiderEmergencyContact: mocks.contact }));
import DriverAccountForms, { DriverAccountFormsScreen } from '@/components/driver/DriverAccountForms';
beforeEach(() => { vi.clearAllMocks(); mocks.update.mockResolvedValue({ success: true }); mocks.contact.mockResolvedValue({ name: 'Trusted Person', phone: '+263771234567' }); });
afterEach(cleanup);
const name = () => screen.getByLabelText('Full legal name');
describe('Driver account forms', () => {
  it('persists only supported personal fields and reviews only after success', async () => {
    render(<DriverAccountForms initialFullName="Old Name" onBack={vi.fn()} />);
    expect(screen.getByLabelText('Date of birth')).toBeDisabled();
    expect(screen.getByLabelText('Home address')).toBeDisabled();
    fireEvent.change(name(), { target: { value: '  New Name  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await screen.findByText('Profile changes saved');
    expect(mocks.update).toHaveBeenCalledWith({ full_name: 'New Name' });
    expect(screen.queryByText('Pending review')).not.toBeInTheDocument();
  });
  it('keeps entered personal values on failure and allows retry', async () => {
    mocks.update.mockRejectedValueOnce(new Error('Save unavailable'));
    render(<DriverAccountForms initialFullName="Test Driver" onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Save unavailable');
    expect(name()).toHaveValue('Test Driver');
    expect(screen.queryByText('Profile changes saved')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await screen.findByText('Profile changes saved');
    expect(mocks.update).toHaveBeenCalledTimes(2);
  });
  it('blocks duplicate saves and Back while a save is pending', async () => {
    let finish!: () => void;
    mocks.update.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    render(<DriverAccountForms initialFullName="Test Driver" onBack={vi.fn()} />);
    const form = name().closest('form')!;
    fireEvent.submit(form); fireEvent.submit(form);
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('button', { name: 'Back to Profile' }).every(button => button.hasAttribute('disabled'))).toBe(true);
    finish(); await screen.findByText('Profile changes saved');
  });
  it('saves trusted contact through the existing validated helper and uses its normalized result', async () => {
    render(<DriverAccountForms initialScreen="emergency" onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Emergency Contact' }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Trusted Person' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '0771234567' } });
    expect(screen.getByLabelText('Relationship')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await screen.findByText('Emergency contact saved');
    expect(mocks.contact).toHaveBeenCalledWith({ name: 'Trusted Person', phone: '0771234567' });
    expect(screen.getByText('+263771234567')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to Contact' }));
    expect(screen.getByText('Contact saved')).toBeInTheDocument();
  });
  it('does not show contact success when the helper rejects', async () => {
    mocks.contact.mockRejectedValueOnce(new Error('Your trusted contact was not saved.'));
    render(<DriverAccountForms initialScreen="emergency" initialContact={{ name: 'Trusted Person', phone: '+263771234567' }} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Emergency Contact' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('not saved'));
    expect(screen.queryByText('Emergency contact saved')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toHaveValue('Trusted Person');
  });
  it('pure review screen has no persistence capability and distinguishes unsaved data', () => {
    render(<DriverAccountFormsScreen screen="personal-review" values={{ fullName: 'Sample Driver', contactName: '', contactPhone: '' }} onBack={vi.fn()} onPrimary={vi.fn()} onChange={vi.fn()} />);
    expect(screen.getByText('Not submitted')).toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.contact).not.toHaveBeenCalled();
  });
});

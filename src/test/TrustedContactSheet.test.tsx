import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
const api = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn() }));
vi.mock('@/lib/riderEmergencyContact', () => ({ loadRiderEmergencyContact: api.load, saveRiderEmergencyContact: api.save }));
vi.mock('@/components/ui/ModalBottomSheet', () => ({ default: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div>{children}</div> : null }));
import TrustedContactSheet from '@/components/ride/TrustedContactSheet';
const contact = { name: 'Emergency Person', phone: '+263771234567' };
describe('Rider trusted contact live entry', () => {
  beforeEach(() => { vi.resetAllMocks(); });
  it('loads a real contact and opens its own telephone action', async () => {
    api.load.mockResolvedValue(contact);
    render(<TrustedContactSheet open onClose={vi.fn()} />);
    expect(await screen.findByText(contact.name)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Call trusted contact' })).toHaveAttribute('href', `tel:${contact.phone}`);
    expect(screen.getByText(/does not automatically send/)).toBeInTheDocument();
  });
  it('adds a contact only after persistence succeeds', async () => {
    api.load.mockResolvedValue(null); api.save.mockResolvedValue(contact);
    render(<TrustedContactSheet open onClose={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add new contact' }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: contact.name } });
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: contact.phone } });
    fireEvent.click(screen.getByRole('button', { name: 'Save contact' }));
    await screen.findByText(contact.name);
    expect(api.save).toHaveBeenCalledWith(contact);
  });
  it('does not delete until confirmed and keeps failed removal visible', async () => {
    api.load.mockResolvedValue(contact); api.save.mockRejectedValue(new Error('Could not save contact.'));
    render(<TrustedContactSheet open onClose={vi.fn()} />);
    await screen.findByText(contact.name);
    fireEvent.click(screen.getByRole('button', { name: 'Remove contact' }));
    expect(api.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove contact' }));
    await screen.findByRole('alert');
    expect(api.save).toHaveBeenCalledWith(null);
    expect(screen.getByText(contact.name)).toBeInTheDocument();
  });
  it('allows retry after a failed contact read without showing fabricated contacts', async () => {
    api.load.mockRejectedValueOnce(new Error('Load failed')).mockResolvedValueOnce(contact);
    render(<TrustedContactSheet open onClose={vi.fn()} />);
    await screen.findByRole('alert');
    expect(screen.queryByText('Tariro Moyo')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByText(contact.name)).toBeInTheDocument());
  });
});

it('ignores an old save after the sheet closes and reopens', async () => {
  const newer = { name: 'Newly loaded contact', phone: '+263779876543' };
  api.load.mockResolvedValueOnce(contact).mockResolvedValueOnce(newer);
  let finish!: (value: typeof contact) => void;
  api.save.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const { rerender } = render(<TrustedContactSheet open onClose={vi.fn()} />);
  await screen.findByText(contact.name);
  fireEvent.click(screen.getByRole('button', { name: 'Edit contact' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save contact' }));
  rerender(<TrustedContactSheet open={false} onClose={vi.fn()} />);
  rerender(<TrustedContactSheet open onClose={vi.fn()} />);
  await screen.findByText(newer.name);
  finish(contact);
  await waitFor(() => expect(screen.queryByText(contact.name)).not.toBeInTheDocument());
});

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NoteToDriverSheet from '@/components/ride/NoteToDriverSheet';
vi.mock('@/lib/haptics', () => ({ haptic: vi.fn() }));
afterEach(cleanup);
function show(onSave: (note: string, reuse: boolean) => void | boolean | Promise<void | boolean>) {
  const props = { open: true, onClose: vi.fn(), note: '', onNoteChange: vi.fn(), reuseEveryTrip: false, onReuseEveryTripChange: vi.fn(), onSave };
  render(<NoteToDriverSheet {...props} />);
  fireEvent.change(screen.getByRole('textbox', { name: 'Note for your driver' }), { target: { value: 'Meet at the gate' } });
  return props;
}
describe('driver note save lifecycle', () => {
  it('allows one pending save and closes only after success', async () => {
    let resolve!: (value: boolean) => void;
    const save = vi.fn(() => new Promise<boolean>(done => { resolve = done; }));
    const props = show(save);
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
    fireEvent.click(screen.getByRole('button', { name: /Saving note/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Close', exact: true }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toBeDisabled();
    await act(async () => resolve(true));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onNoteChange).toHaveBeenCalledWith('Meet at the gate');
  });
  it.each(['denied', 'rejected'] as const)('retains the draft on a %s save and allows retry', async outcome => {
    const save = vi.fn<() => Promise<boolean>>();
    if (outcome === 'denied') save.mockResolvedValueOnce(false);
    else save.mockRejectedValueOnce(new Error('Isolated failure'));
    save.mockResolvedValueOnce(true);
    const props = show(save);
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
    await screen.findByRole('alert');
    expect(props.onClose).not.toHaveBeenCalled();
    expect(props.onNoteChange).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveValue('Meet at the gate');
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
    await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledTimes(2);
  });
});

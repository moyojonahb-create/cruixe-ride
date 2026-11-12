import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FileUploadBox } from '@/components/driver/DriverRegistrationWizard';

vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/lib/businessApi', () => ({ upsertDriverApplication: vi.fn(), createDriverDocument: vi.fn() }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Private application upload previews', () => {
  it('revokes each image preview when replaced and on unmount', () => {
    const createObjectURL = vi.fn().mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const first = new File(['one'], 'first.jpg', { type: 'image/jpeg' });
    const second = new File(['two'], 'second.jpg', { type: 'image/jpeg' });
    const { rerender, unmount } = render(<FileUploadBox label="Identity document" file={first} onSelect={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'Identity document' })).toHaveAttribute('src', 'blob:first');
    rerender(<FileUploadBox label="Identity document" file={second} onSelect={vi.fn()} />);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first');
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:second');
  });
  it('shows a PDF filename instead of a broken image', () => {
    const createObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
    render(<FileUploadBox label="Insurance" file={new File(['pdf'], 'insurance.pdf', { type: 'application/pdf' })} onSelect={vi.fn()} />);
    expect(screen.getByText('insurance.pdf')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Choose Insurance' })).toBeInTheDocument();
  });
});

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DriverSelfieCheck from '@/components/driver/DriverSelfieCheck';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  upload: vi.fn(),
  getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.test/selfie.jpg' } })),
  insert: vi.fn(),
  maybeSingle: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
}));

mocks.eq.mockImplementation(() => ({ maybeSingle: mocks.maybeSingle }));
mocks.select.mockImplementation(() => ({ eq: mocks.eq }));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: mocks.getUser, onAuthStateChange: mocks.onAuthStateChange },
    storage: { from: vi.fn(() => ({ upload: mocks.upload, getPublicUrl: mocks.getPublicUrl })) },
    from: vi.fn((table: string) => table === 'drivers' ? { select: mocks.select } : { insert: mocks.insert }),
  },
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const { getUser, upload, insert, maybeSingle } = mocks;

const track = { stop: vi.fn() };

async function capturePhoto() {
  fireEvent.click(screen.getByRole('button', { name: 'Open Camera' }));
  await screen.findByRole('button', { name: 'Take Photo' });
  fireEvent.click(screen.getByRole('button', { name: 'Take Photo' }));
  await screen.findByRole('button', { name: 'Confirm' });
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track] }) },
  });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,selfie');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: vi.fn().mockResolvedValue(new Blob(['selfie'])) }));
  getUser.mockResolvedValue({ data: { user: { id: 'driver-a' } } });
  upload.mockResolvedValue({ error: null });
  insert.mockResolvedValue({ error: null });
  maybeSingle.mockResolvedValue({ data: { id: 'driver-profile-a' }, error: null });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('DriverSelfieCheck', () => {
  it('treats a successful upload as pending evidence and never approves automatically', async () => {
    const submitted = vi.fn();
    render(<DriverSelfieCheck open onSubmitted={submitted} onCancel={vi.fn()} />);
    await capturePhoto();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await screen.findByText('Submitted for review');
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      status: 'pending',
      driver_id: 'driver-profile-a',
      document_type: 'personal_photo',
    }));
    expect(submitted).not.toHaveBeenCalled();
    const close = screen.getAllByRole('button', { name: 'Close' }).find((button) => button.textContent === 'Close');
    expect(close).toBeDefined();
    fireEvent.click(close!);
    expect(submitted).toHaveBeenCalledTimes(1);
  });

  it('invalidates an in-flight upload when the dialog closes', async () => {
    let finishUpload!: (value: { error: null }) => void;
    upload.mockReturnValue(new Promise((resolve) => { finishUpload = resolve; }));
    const submitted = vi.fn();
    const view = render(<DriverSelfieCheck open onSubmitted={submitted} onCancel={vi.fn()} />);
    await capturePhoto();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));

    view.rerender(<DriverSelfieCheck open={false} onSubmitted={submitted} onCancel={vi.fn()} />);
    finishUpload({ error: null });

    await waitFor(() => expect(insert).not.toHaveBeenCalled());
    expect(submitted).not.toHaveBeenCalled();
  });

  it('rejects an account switch before recording pending evidence', async () => {
    getUser
      .mockResolvedValueOnce({ data: { user: { id: 'driver-a' } } })
      .mockResolvedValueOnce({ data: { user: { id: 'driver-b' } } });
    render(<DriverSelfieCheck open onSubmitted={vi.fn()} onCancel={vi.fn()} />);
    await capturePhoto();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await screen.findByText('Upload failed');
    expect(insert).not.toHaveBeenCalled();
  });

  it('treats camera permission failure as cancellation', async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(new Error('denied'));
    const cancel = vi.fn();
    render(<DriverSelfieCheck open onSubmitted={vi.fn()} onCancel={cancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Camera' }));
    await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
    expect(insert).not.toHaveBeenCalled();
  });

  it('shows a failure and never submits when upload fails', async () => {
    upload.mockResolvedValue({ error: new Error('upload failed') });
    const submitted = vi.fn();
    render(<DriverSelfieCheck open onSubmitted={submitted} onCancel={vi.fn()} />);
    await capturePhoto();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await screen.findByText('Upload failed');
    expect(insert).not.toHaveBeenCalled();
    expect(submitted).not.toHaveBeenCalled();
  });
});

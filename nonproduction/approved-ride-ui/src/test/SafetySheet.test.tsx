import type { ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SafetySheet from '@/components/ride/SafetySheet';
import { createEmergencyEvent } from '@/lib/businessApi';

vi.mock('@/lib/businessApi', () => ({ createEmergencyEvent: vi.fn().mockResolvedValue({}) }));
vi.mock('@/lib/supabaseClient', () => ({
  supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } },
}));
vi.mock('@/lib/haptics', () => ({ haptic: vi.fn() }));
vi.mock('@/components/ride/ShareTripButton', () => ({ default: () => null }));
vi.mock('@/components/ride/DisputeForm', () => ({ default: () => null }));
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: { div: ({ children, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => <div {...props}>{children}</div> },
}));

const props = {
  open: true, onClose: vi.fn(), rideId: 'ride-123', counterpartName: 'Driver',
  plateNumber: 'ABC 123', startedAt: null, pickupAddress: 'Pickup', dropoffAddress: 'Destination',
};
const dialTarget = { href: '' };
const locate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  dialTarget.href = '';
  // No real dialing, GPS, alerts, haptics, profile requests, sharing or reports.
  vi.stubGlobal('location', dialTarget);
  vi.stubGlobal('PointerEvent', MouseEvent);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 16));
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: locate } });
  locate.mockImplementation((success: PositionCallback) => success({ coords: { latitude: -17.8, longitude: 31 } } as GeolocationPosition));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function renderSheet() {
  const view = render(<SafetySheet {...props} />);
  await act(async () => {}); // Flush the mocked contact lookup before interacting.
  return view;
}
function advance(ms: number) { act(() => { vi.advanceTimersByTime(ms); }); }
function expectDispatchedOnce() {
  expect(dialTarget.href).toBe('tel:999');
  expect(locate).toHaveBeenCalledTimes(1);
  expect(createEmergencyEvent).toHaveBeenCalledExactlyOnceWith({ ride_id: 'ride-123', latitude: -17.8, longitude: 31 });
}

describe('SafetySheet emergency activation', () => {
  it('requires a full hold and dispatches once even after repeated presses', async () => {
    await renderSheet();
    const hold = screen.getByRole('button', { name: /hold for emergency/i });
    fireEvent.pointerDown(hold, { button: 0 });
    fireEvent.pointerDown(hold, { button: 0 });
    advance(1500);
    expect(createEmergencyEvent).not.toHaveBeenCalled();
    expect(screen.getByRole('progressbar', { name: /emergency activation/i })).toHaveAttribute('aria-valuenow');
    advance(1600);
    fireEvent.pointerUp(hold);
    fireEvent.click(hold);
    fireEvent.pointerDown(hold, { button: 0 });
    advance(3100);
    expectDispatchedOnce();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it.each(['pointerUp', 'pointerLeave', 'pointerCancel', 'blur'] as const)('cancels an incomplete hold on %s', async (event) => {
    await renderSheet();
    const hold = screen.getByRole('button', { name: /hold for emergency/i });
    fireEvent.pointerDown(hold, { button: 0 });
    advance(1000);
    fireEvent[event](hold);
    advance(4000);
    expect(createEmergencyEvent).not.toHaveBeenCalled();
    expect(dialTarget.href).toBe('');
  });

  it('offers a named native click/keyboard path with confirmation and cancellation', async () => {
    await renderSheet();
    const call = screen.getByRole('button', { name: /^call emergency services$/i });
    call.focus();
    expect(call).toHaveFocus();
    act(() => { call.click(); });
    const confirmation = screen.getByRole('alertdialog', { name: /call emergency services/i });
    expect(within(confirmation).getByRole('button', { name: /cancel/i })).toHaveFocus();
    expect(createEmergencyEvent).not.toHaveBeenCalled();
    fireEvent.click(within(confirmation).getByRole('button', { name: /cancel/i }));
    advance(4000);
    expect(createEmergencyEvent).not.toHaveBeenCalled();
    fireEvent.click(call);
    const confirm = within(screen.getByRole('alertdialog')).getByRole('button', { name: /call 999/i });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expectDispatchedOnce();
  });

  it('does not activate on an ordinary short pointer click', async () => {
    await renderSheet();
    const hold = screen.getByRole('button', { name: /hold for emergency/i });
    fireEvent.pointerDown(hold, { button: 0 });
    advance(250);
    fireEvent.pointerUp(hold);
    fireEvent.click(hold, { detail: 1 });
    advance(4000);
    expect(createEmergencyEvent).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('cancels pending holds when closed, and permits a fresh hold after reopening', async () => {
    const { rerender } = await renderSheet();
    fireEvent.pointerDown(screen.getByRole('button', { name: /hold for emergency/i }), { button: 0 });
    advance(1000);
    rerender(<SafetySheet {...props} open={false} />);
    advance(4000);
    expect(createEmergencyEvent).not.toHaveBeenCalled();
    await act(async () => { rerender(<SafetySheet {...props} />); });
    fireEvent.pointerDown(screen.getByRole('button', { name: /hold for emergency/i }), { button: 0 });
    advance(3100);
    expectDispatchedOnce();
  });

  it('removes a pending confirmation on sheet dismissal', async () => {
    const { rerender } = await renderSheet();
    fireEvent.click(screen.getByRole('button', { name: /^call emergency services$/i }));
    rerender(<SafetySheet {...props} open={false} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    advance(4000);
    expect(createEmergencyEvent).not.toHaveBeenCalled();
  });

  it('cancels pending activation on unmount', async () => {
    const { unmount } = await renderSheet();
    fireEvent.pointerDown(screen.getByRole('button', { name: /hold for emergency/i }), { button: 0 });
    advance(1000);
    unmount();
    advance(4000);
    expect(createEmergencyEvent).not.toHaveBeenCalled();
  });
  it('opens confirmation from a synthesized click on the hold control', async () => {
    await renderSheet();
    fireEvent.click(screen.getByRole('button', { name: /hold for emergency/i }), { detail: 0 });
    expect(screen.getByRole('alertdialog', { name: /call emergency services/i })).toBeInTheDocument();
    expect(createEmergencyEvent).not.toHaveBeenCalled();
  });

  it('cancels confirmation with Escape', async () => {
    await renderSheet();
    fireEvent.click(screen.getByRole('button', { name: /^call emergency services$/i }));
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(createEmergencyEvent).not.toHaveBeenCalled();
  });

  it('uses native Back to close the emergency confirmation before the safety sheet', async () => {
    const onClose = vi.fn();
    render(<SafetySheet {...props} onClose={onClose} />);
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: /^call emergency services$/i }));
    act(() => { document.dispatchEvent(new Event('backbutton', { cancelable: true })); });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Safety' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('immediately cancels a pending hold when the close action is requested', async () => {
    await renderSheet();
    fireEvent.pointerDown(screen.getByRole('button', { name: /hold for emergency/i }), { button: 0 });
    advance(1000);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    advance(4000);
    expect(props.onClose).toHaveBeenCalledOnce();
    expect(createEmergencyEvent).not.toHaveBeenCalled();
  });

  it('ignores a non-primary pointer button', async () => {
    await renderSheet();
    fireEvent.pointerDown(screen.getByRole('button', { name: /hold for emergency/i }), { button: 2 });
    advance(4000);
    expect(createEmergencyEvent).not.toHaveBeenCalled();
    expect(dialTarget.href).toBe('');
  });

  it('still opens the dialer when GPS fails, without posting fabricated coordinates', async () => {
    locate.mockImplementation((_success: PositionCallback, failure: PositionErrorCallback) => failure({ code: 1 } as GeolocationPositionError));
    await renderSheet();
    fireEvent.pointerDown(screen.getByRole('button', { name: /hold for emergency/i }), { button: 0 });
    advance(3100);
    expect(dialTarget.href).toBe('tel:999');
    expect(createEmergencyEvent).not.toHaveBeenCalled();
  });});

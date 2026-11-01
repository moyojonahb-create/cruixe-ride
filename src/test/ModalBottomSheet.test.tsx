import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ModalBottomSheet from '@/components/ui/ModalBottomSheet';

afterEach(cleanup);

describe('ModalBottomSheet', () => {
  it('exposes dialog semantics, traps focus, closes on Escape and restores focus', async () => {
    const close = vi.fn();
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const view = render(<ModalBottomSheet open onClose={close} title="Payment" description="Choose payment"><button>First action</button></ModalBottomSheet>);
    expect(screen.getByRole('dialog', { name: 'Payment' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(close).toHaveBeenCalledTimes(1);
    view.rerender(<ModalBottomSheet open={false} onClose={close} title="Payment" description="Choose payment"><button>First action</button></ModalBottomSheet>);
    await waitFor(() => expect(trigger).toHaveFocus());
    trigger.remove();
  });

  it('closes once for the native back event', () => {
    const close = vi.fn();
    render(<ModalBottomSheet open onClose={close} title="Safety" description="Safety actions"><button>Action</button></ModalBottomSheet>);
    document.dispatchEvent(new Event('backbutton', { cancelable: true }));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('closes on the WebView history event used by Android Back', () => {
    const close = vi.fn();
    render(<ModalBottomSheet open onClose={close} title="Payment" description="Payment actions"><button>Action</button></ModalBottomSheet>);
    fireEvent.popState(window);
    expect(close).toHaveBeenCalledTimes(1);
  });
});

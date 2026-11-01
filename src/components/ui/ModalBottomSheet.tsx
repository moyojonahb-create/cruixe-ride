import { useEffect, useRef, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import RideGlassPanel from '@/components/ride/RideGlassPanel';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  maxWidth?: number;
}

export default function ModalBottomSheet({ open, onClose, title, description, children, className, maxWidth = 480 }: Props) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const returnFocusRef = useRef<HTMLElement | null>(typeof document !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const wasOpenRef = useRef(open);
  useEffect(() => {
    if (open && !wasOpenRef.current) returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    wasOpenRef.current = open;
    if (!open) returnFocusRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const closeTopLayer = (event?: Event) => {
      event?.preventDefault();
      const alertDialog = document.querySelector('[role="alertdialog"]');
      if (alertDialog) {
        alertDialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return false;
      }
      onCloseRef.current();
      return true;
    };
    const onBack = (event: Event) => { closeTopLayer(event); };
    document.addEventListener('backbutton', onBack);
    return () => document.removeEventListener('backbutton', onBack);
  }, [open]);
  useEffect(() => {
    if (!open || typeof history === 'undefined') return;
    const token = `sheet-${Date.now()}-${Math.random()}`;
    let closedFromHistory = false;
    history.pushState({ ...(history.state ?? {}), __cruixeModalSheet: token }, '', window.location.href);
    const onPopState = () => {
      closedFromHistory = true;
      const alertDialog = document.querySelector('[role="alertdialog"]');
      if (alertDialog) {
        alertDialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        history.pushState({ ...(history.state ?? {}), __cruixeModalSheet: token }, '', window.location.href);
        closedFromHistory = false;
      } else {
        onCloseRef.current();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      if (!closedFromHistory && history.state?.__cruixeModalSheet === token) history.back();
    };
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/45 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn('fixed inset-x-0 bottom-0 z-[70] mx-auto w-full outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom', className)}
          style={{ maxWidth, maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 12px)' }}
          onCloseAutoFocus={(event) => { event.preventDefault(); returnFocusRef.current?.focus(); }}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
          <RideGlassPanel style={{ maxHeight: 'inherit', paddingBottom: 'env(safe-area-inset-bottom)' }} onRibbonClick={onClose}>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </RideGlassPanel>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

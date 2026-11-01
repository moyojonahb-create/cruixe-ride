import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Banknote, ChevronRight, Wallet, X } from 'lucide-react';
import type { PaymentMethod } from './PaymentMethodSelector';
import { RIDE_TEXT, RIDE_TEXT_2 } from './rideGlass';

interface Props {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  walletBalance: number;
  estimatedFare: number;
  restrictToCash?: boolean;
  restrictReason?: string;
}

/** Local preference editor. Opening, selecting and closing never submit a ride. */
export default function TripPaymentSelector({ selected, onSelect, walletBalance, estimatedFare, restrictToCash = false, restrictReason }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const walletDisabled = restrictToCash || walletBalance < estimatedFare;
  useEffect(() => {
    if (restrictToCash && selected !== 'cash') onSelect('cash');
  }, [restrictToCash, selected, onSelect]);
  useEffect(() => { if (open) closeButton.current?.focus(); }, [open]);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  const choice = (method: PaymentMethod): CSSProperties => ({
    minHeight: 48, width: '100%', padding: '12px', borderRadius: 16,
    display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' as const,
    background: selected === method ? '#fff8ce' : '#fff',
    border: `1px solid ${selected === method ? '#b08700' : '#d5d7db'}`,
    color: RIDE_TEXT,
  });
  return <>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={id}
      aria-label={`Payment method: ${selected === 'cash' ? 'Cash' : 'Wallet'}`}
      onClick={() => setOpen(value => !value)}
      className="ride-config-utility ride-config-utility--cash focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, minHeight: 68, padding: '9px 10px', borderRadius: 20, background: '#ffe849', color: '#171717', textAlign: 'left' }}>
      <span className="ride-config-utility__icon"><Banknote aria-hidden="true" size={20} /></span>
      <span style={{ flex: 1, minWidth: 0 }}><strong style={{ display: 'block', fontSize: 14 }}>{selected === 'cash' ? 'Cash' : 'Wallet'}</strong><small style={{ display: 'block', fontSize: 10 }}>{selected === 'cash' ? 'Pay the driver' : 'Use wallet balance'}</small></span>
      <ChevronRight aria-hidden="true" size={18} />
    </button>
    {open && <section id={id} aria-labelledby={id + '-title'}
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); } }}
      style={{ gridColumn: '1 / -1', minWidth: 0, padding: 12, borderRadius: 20, background: '#fff', border: '1px solid #d5d7db' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <h3 id={id + '-title'} style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>Payment method</h3>
        <button ref={closeButton} type="button" onClick={close} aria-label="Close payment choices"
          className="focus-visible:outline focus-visible:outline-2" style={{ width: 44, height: 44, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 22, background: '#f2f3f5' }}><X aria-hidden="true" size={18} /></button>
      </div>
      <div role="group" aria-label="Payment choices" style={{ display: 'grid', gap: 10 }}>
        <button type="button" aria-pressed={selected === 'cash'} onClick={() => onSelect('cash')} style={choice('cash')} className="focus-visible:outline focus-visible:outline-2"><Banknote aria-hidden="true" size={20} /><span>Cash</span></button>
        <button type="button" aria-pressed={selected === 'wallet'} disabled={walletDisabled} onClick={() => onSelect('wallet')} style={choice('wallet')} className="disabled:opacity-60 focus-visible:outline focus-visible:outline-2"><Wallet aria-hidden="true" size={20} /><span>Wallet{walletDisabled ? ' (unavailable for this trip)' : ''}</span></button>
      </div>
      {restrictToCash && restrictReason && <p style={{ fontSize: 13, color: RIDE_TEXT_2, marginTop: 10 }}>{restrictReason}</p>}
    </section>}
  </>;
}

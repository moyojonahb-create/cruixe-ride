import type { ReactNode } from 'react';

const ink = '#1f2129';
const finishActionClass = 'min-h-12 min-w-0 flex-1 rounded-[14px] px-2.5 py-2 text-[15px] font-semibold leading-tight disabled:opacity-60';
const finishMoney = (value: number) => Number.isFinite(value) ? `$${value.toFixed(2)}` : 'Fare unavailable';

function FinishHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <>
    <p className="mt-[7px] flex min-h-[25px] w-[168px] items-center justify-center rounded-[13px] bg-[#fff1f2] px-2 text-center text-[9.6px] font-bold text-[#111]">{eyebrow}</p>
    <h1 className="mt-1 flex min-h-10 items-center text-[21px] font-bold leading-[30px] text-[#1f2129]">{title}</h1>
    <p className="flex min-h-[31px] items-center text-[11.3px] leading-[17px] text-[#667085]">{description}</p>
  </>;
}

export function DriverDestinationBody({ passengerName, passengerCount, destination, fare, paymentMethod, confirming, farFromDropoff, onConfirm }: {
  passengerName: string; passengerCount: number | null; destination: string; fare: number; paymentMethod: string; confirming: boolean; farFromDropoff: boolean; onConfirm: () => void;
}) {
  const count = passengerCount == null ? 'Passenger count unavailable' : `${passengerCount} passenger${passengerCount === 1 ? '' : 's'}`;
  return <div>
    <FinishHeading eyebrow="AT DESTINATION" title={`You've reached ${destination}`} description="Confirm the passengers have safely exited." />
    <div className="mt-[10px] min-h-[97px] rounded-[16px] border border-[#e7eaf0] px-[15px] py-2">
      <p className="min-h-[15px] text-[10px] font-bold leading-[15px] text-[#667085]">DROP-OFF POINT</p>
      <p className="flex min-h-[34px] items-center break-words text-[19px] font-bold leading-7">{destination}</p>
      <p className="min-h-[22px] text-[11.4px] font-medium leading-[22px] text-[#667085]"><span>{passengerName}</span> · {count}</p>
    </div>
    <div className="mt-[11px] flex min-h-[57px] items-center justify-between gap-3 rounded-[14px] px-[14px] py-2 text-white" style={{background:ink}}>
      <span className="text-[12.5px] font-semibold">Agreed fare · {paymentMethod || 'Payment method pending'}</span><strong className="shrink-0 text-[21px]">{finishMoney(fare)}</strong>
    </div>
    <p className="mt-[7px] flex min-h-[42px] items-center text-[11px] leading-[17px] text-[#667085]">Check everyone has exited and belongings are collected.</p>
    {farFromDropoff && <p role="alert" className="my-2 text-[12px] font-semibold leading-5 text-[#c32e1d]">You appear far from the drop-off. Select End trip again only if all passengers have safely exited.</p>}
    <button type="button" disabled={confirming} onClick={onConfirm} className={`${finishActionClass} mt-[10px] w-full bg-[#ff000d] text-white`}>{confirming ? 'Ending trip…' : 'End trip'}</button>
  </div>;
}

export function DriverCashBody({ fare, isCash, paymentMethod, confirming, notReceived, error, onNotReceived, onConfirm }: {
  fare: number; isCash: boolean; paymentMethod: string; confirming: boolean; notReceived: boolean; error: string | null; onNotReceived: () => void; onConfirm: () => void;
}) {
  return <div>
    <FinishHeading eyebrow="PAYMENT DUE" title={isCash ? 'Collect cash payment' : 'Payment confirmation pending'} description={isCash ? 'Confirm payment only after receiving the cash.' : 'The platform must confirm this payment method.'} />
    <div className="mt-1 min-h-[101px] rounded-[17px] border border-[#e7eaf0] px-[15px] py-[9px]">
      <p className="flex min-h-[25px] items-center text-[10.4px] font-bold text-[#667085]">{isCash ? 'AMOUNT TO COLLECT' : 'TRIP FARE'}</p>
      <strong className="flex min-h-[55px] items-center text-[34px] leading-tight">{finishMoney(fare)}</strong>
    </div>
    <p className="mt-[9px] flex min-h-12 items-center rounded-[14px] bg-[#1f2129] px-[15px] py-2 text-[13px] font-semibold text-white">Payment method: {isCash ? 'Cash' : paymentMethod || 'Not confirmed'}</p>
    <p className="mt-[6px] flex min-h-[35px] items-center text-[11px] leading-[17px] text-[#667085]" aria-live="polite">{!isCash ? 'Cash collection cannot confirm a non-cash payment.' : notReceived ? 'Payment is still due. Keep this screen open until you receive the cash.' : 'Never mark the fare paid before collecting it.'}</p>
    {error && <p role="alert" className="my-2 text-[12px] leading-5 text-[#c32e1d]">{error}</p>}
    <div className="mt-[6px] flex gap-3">
      <button type="button" disabled={confirming} className={`${finishActionClass} border-[1.5px] border-[#ff000d] bg-white text-[#111]`} onClick={onNotReceived}>Not received</button>
      <button type="button" disabled={confirming || !isCash || !Number.isFinite(fare)} className={`${finishActionClass} bg-[#ff000d] text-white`} onClick={onConfirm}>{confirming ? 'Confirming…' : 'Cash received'}</button>
    </div>
  </div>;
}

export function DriverReceiptBody({ pickup, destination, passengerName, fare, settled, children, onRate, showRating, onDone }: {
  pickup: string; destination: string; passengerName: string; fare: number; settled: {commission:number;keep:number} | null; children?: ReactNode; onRate: () => void; showRating: boolean; onDone: () => void;
}) {
  return <div>
    <FinishHeading eyebrow="TRIP COMPLETED" title="Trip completed" description="Thanks for completing this CruiXe ride." />
    <div className="mt-[3px] min-h-[113px] rounded-[17px] border border-[#e7eaf0] px-[13px] pb-1 pt-[7px]">
      <p className="flex min-h-[23px] items-center text-[10.2px] font-bold text-[#667085]">TRIP SUMMARY</p>
      <div className="flex min-h-[29px] items-center justify-between gap-3 text-[14.3px] font-semibold"><span className="min-w-0 break-words">{pickup}</span><span aria-hidden="true" className="pr-2 text-base text-[#111]">↓</span></div>
      <p className="flex min-h-[27px] items-center break-words text-[14.3px] font-semibold">{destination}</p>
      <p className="min-h-5 text-[10.4px] leading-5 text-[#667085]">{passengerName} · Cash collected</p>
    </div>
    <div className="mt-[9px] flex min-h-[57px] items-center justify-between gap-3 rounded-[15px] bg-[#1f2129] px-[14px] py-2 text-white"><span className="text-[10px] font-bold">TOTAL FARE</span><strong className="text-[24px] leading-tight">{finishMoney(fare)}</strong></div>
    {settled ? <details className="mt-2 min-h-[31px] text-[11px] leading-[17px] text-[#667085]"><summary>Driver earnings</summary><dl className="mt-2 space-y-2"><div className="flex justify-between gap-3"><dt>Platform fee</dt><dd>{finishMoney(settled.commission)}</dd></div><div className="flex justify-between gap-3"><dt>Net earnings</dt><dd>{finishMoney(settled.keep)}</dd></div></dl></details> : <p className="mt-2 flex min-h-[31px] items-center text-[10.5px] leading-[17px] text-[#667085]">Platform fees and driver net earnings require ledger data.</p>}
    {children}
    <div className="mt-1 flex gap-3"><button type="button" className={`${finishActionClass} border-[1.5px] border-[#ff000d] bg-white text-[#111]`} aria-expanded={showRating} onClick={onRate}>Rate rider</button><button type="button" className={`${finishActionClass} bg-[#ff000d] text-white`} onClick={onDone}>Return to Waiting Room</button></div>
  </div>;
}

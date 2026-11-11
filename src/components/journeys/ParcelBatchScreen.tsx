import { ArrowLeft, CheckCircle2, Clock3, MapPin, Package, ShieldCheck, Truck, UserRound, AlertCircle } from 'lucide-react';
import type { ParcelScreenDefinition } from '@/lib/parcelBatch20Screens';

export interface ParcelScreenData {
  pickup?: string;
  destination?: string;
  senderName?: string;
  recipientName?: string;
  courierName?: string;
  vehicle?: string;
  reference?: string;
  packageDescription?: string;
  fare?: number | null;
  etaMinutes?: number | null;
  collectionCode?: string | null;
  deliveryCode?: string | null;
  collectionVerified?: boolean;
  deliveryVerified?: boolean;
  paymentConfirmed?: boolean;
  deliveredAt?: string | null;
  photoUrl?: string | null;
}
interface Props {
  screen: ParcelScreenDefinition;
  data: ParcelScreenData;
  onPrimary: (screenId: string) => void;
  onSecondary: (screenId: string) => void;
}
/** Figma parcel screen renderer. Does not create codes, validate codes,
 * perform payments, authorize delivery or mutate the database.
 */
export default function ParcelBatchScreen({ screen, data, onPrimary, onSecondary }: Props) {
  const privateCode = screen.id === 'rider-pickup'
    ? data.collectionCode
    : screen.id === 'recipient-verify' ? data.deliveryCode : null;
  const codeMayDisplay = screen.id === 'rider-pickup' || screen.id === 'recipient-verify';
  const inTransit = screen.stage === 'navigation';
  const isProblem = screen.stage === 'issue';
  const isComplete = screen.stage === 'delivered';
  const isVerification = screen.stage === 'verify' || screen.stage === 'proof';
  const safeFare = data.fare != null && Number.isFinite(data.fare) && data.fare >= 0;
  const canShowCompletion = isComplete && Boolean(data.deliveryVerified);
  return (
    <section data-figma-node={screen.figmaNode} aria-label={screen.title}
      className="flex min-h-[100dvh] w-full flex-col overflow-hidden bg-white font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
      <header className="relative min-h-[228px] shrink-0 bg-[#1f2129] px-6 pt-[max(27px,env(safe-area-inset-top))] text-white">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => onSecondary(screen.id)} aria-label="Back to parcel journey"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#1f2129]">
            <ArrowLeft className="h-5 w-5"/>
          </button>
          <span className="rounded-full bg-white px-3 py-2 text-[10px] font-bold text-[#1f2129]">CruiXe {screen.role === 'driver' ? 'DRIVER' : 'RIDE'}</span>
        </div>
        <div className="mt-9 flex items-center gap-3">
          <Package className="h-7 w-7 text-[#ffd11c]"/>
          <span className="text-[25px] font-semibold">CruiXe Parcel</span>
        </div>
        <div className="mt-2 h-1 w-14 rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]"/>
        <div className="absolute inset-x-0 bottom-0 h-10 rounded-t-[48%] bg-[#ff000d]" aria-hidden="true"/>
        <div className="absolute inset-x-0 -bottom-3 h-10 rounded-t-[48%] bg-white" aria-hidden="true"/>
      </header>
      <main className="relative flex flex-1 flex-col px-[22px] pb-[max(24px,env(safe-area-inset-bottom))] pt-8">
        <p className="text-[10px] font-bold tracking-[.1em] text-[#ff000d]">{screen.eyebrow}</p>
        <h1 className="mt-2 text-[24px] font-bold leading-[1.3]">{screen.title}</h1>
        <p className="mt-2 text-[12px] leading-5 text-[#667080]">{screen.description}</p>
        <div className="mt-6 flex items-center gap-3 text-[10px] font-semibold tracking-wide">
          <span className="h-1 w-9 rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]"/>
          {screen.role === 'driver' ? 'COURIER JOURNEY' : screen.role === 'recipient' ? 'RECIPIENT ACCESS' : 'PARCEL DELIVERY'}
        </div>
        {isProblem && (
          <div className="mt-6 flex gap-3 rounded-[17px] border border-[#ffdde2] bg-[#fff7f8] p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-[#ff000d]"/>
            <p className="text-[12px] leading-5">The delivery has not been confirmed. Contact the courier or support before requesting another attempt or a return.</p>
          </div>
        )}
        {isComplete && (
          <div className="mt-6 flex items-center gap-3 rounded-[17px] bg-[#f6f6f8] p-4">
            {canShowCompletion ? <CheckCircle2 className="h-6 w-6 shrink-0 text-[#15803d]"/> : <Clock3 className="h-6 w-6 shrink-0 text-[#d27b09]"/>}
            <div><p className="text-[13px] font-semibold">{canShowCompletion ? 'Handover verified' : 'Awaiting verified delivery'}</p>
              <p className="mt-1 text-[11px] text-[#667080]">{canShowCompletion ? (data.deliveredAt || 'Delivery confirmation received') : 'No delivery confirmation available in the current trip record.'}</p></div>
          </div>
        )}
        {(data.pickup || data.destination) && (
          <div className="mt-5 rounded-[18px] border border-[#e2e6ed] bg-white px-4 py-4">
            {data.pickup && <div className="flex items-start gap-3"><MapPin className="mt-1 h-4 w-4 shrink-0 text-[#ff000d]"/><div><p className="text-[10px] font-bold tracking-wide text-[#667080]">SENDER PICKUP</p><p className="mt-1 break-words text-[13px] font-semibold">{data.pickup}</p></div></div>}
            {data.pickup && data.destination && <div className="my-3 ml-[7px] h-4 border-l border-dashed border-[#d5d9df]"/>}
            {data.destination && <div className="flex items-start gap-3"><MapPin className="mt-1 h-4 w-4 shrink-0 text-[#1f2129]"/><div><p className="text-[10px] font-bold tracking-wide text-[#667080]">RECIPIENT DELIVERY</p><p className="mt-1 break-words text-[13px] font-semibold">{data.destination}</p></div></div>}
          </div>
        )}
        {(data.senderName || data.recipientName || data.courierName) && <div className="mt-3 rounded-[17px] bg-[#f6f6f8] px-4 py-3">
          {data.senderName && <p className="text-[12px] font-semibold">Sender · {data.senderName}</p>}
          {data.recipientName && <p className="mt-1 text-[12px] font-semibold">Recipient · {data.recipientName}</p>}
          {data.courierName && <p className="mt-1 text-[12px] font-semibold">Courier · {data.courierName}</p>}
          {data.vehicle && <p className="mt-2 text-[11px] text-[#667080]">{data.vehicle}</p>}
        </div>}
        {data.packageDescription && <div className="mt-3 flex items-center gap-3 rounded-[17px] border border-[#e2e6ed] px-4 py-3">
          <Package className="h-5 w-5 text-[#ff000d]"/><span className="text-[12px] font-semibold">{data.packageDescription}</span>
        </div>}
        {data.photoUrl && <div className="mt-3 overflow-hidden rounded-[17px] border border-[#e2e6ed]">
          <img src={data.photoUrl} alt="Parcel photo provided by sender" className="max-h-[210px] w-full object-contain"/>
        </div>}
        {data.reference && <div className="mt-3 rounded-[17px] bg-[#f6f6f8] px-4 py-3">
          <p className="text-[10px] font-semibold tracking-wide text-[#667080]">PARCEL REFERENCE</p>
          <p className="mt-1 text-[14px] font-bold">{data.reference}</p>
        </div>}
        {(safeFare || inTransit) && <div className="mt-3 flex items-center justify-between gap-3 rounded-[17px] border border-[#e2e6ed] px-4 py-4">
          <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-[#ff000d]"/><span className="text-[12px] font-semibold">{inTransit ? 'Courier journey' : 'Agreed fare'}</span></div>
          <span className="text-[15px] font-bold tabular-nums">{inTransit && data.etaMinutes != null ? `${data.etaMinutes} min` : safeFare ? `$${data.fare!.toFixed(2)}` : 'ETA unavailable'}</span>
        </div>}
        {codeMayDisplay && (
          <div className="mt-3 rounded-[18px] bg-[#fff8df] px-4 py-5 text-center">
            <p className="text-[11px] font-bold tracking-wide">{screen.id === 'rider-pickup' ? 'PICKUP CODE' : 'YOUR DELIVERY CODE'}</p>
            {privateCode ? <p className="mt-3 text-[27px] font-bold tracking-[.24em]">{privateCode}</p> : <p className="mt-3 text-[12px] text-[#667080]">Verification code not available</p>}
            <p className="mt-3 text-[11px] text-[#667080]">Share only with your verified courier at the appropriate handover stage.</p>
          </div>
        )}
        {isVerification && !codeMayDisplay && <div className="mt-4 flex gap-3 rounded-[17px] border border-[#e2e6ed] bg-[#f6f6f8] p-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-[#ff000d]"/><p className="text-[12px] leading-5">The code must be validated by the secure delivery service. This screen does not generate or verify codes.</p>
        </div>}
        <div className="mt-auto pt-10">
          <div className="flex items-start gap-2 rounded-[14px] bg-[#f6f6f8] px-3 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#ff000d]"/>
            <p className="text-[11px] leading-5 text-[#667080]">{screen.stage === 'cash' ? 'Only acknowledge cash after the amount is actually collected.' : isVerification ? 'Keep all delivery verification codes private until handover.' : 'Trip status is determined by the live courier service, not by this presentation.'}</p>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={()=>onSecondary(screen.id)} className="min-h-[54px] flex-1 rounded-[17px] border border-[#ff000d] bg-white px-2 text-[13px] font-semibold text-[#ff000d]">{screen.secondary}</button>
            <button type="button" onClick={()=>onPrimary(screen.id)} className="min-h-[54px] flex-[2] rounded-[17px] bg-[#ff000d] px-2 text-[13px] font-semibold text-white">{screen.primary}</button>
          </div>
        </div>
      </main>
    </section>
  );
}

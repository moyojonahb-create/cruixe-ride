import { useState } from 'react';
import { ArrowLeft, ArrowRight, Layers3, ShieldAlert } from 'lucide-react';
import { PARCEL_BATCH_20 } from '@/lib/parcelBatch20Screens';
import ParcelBatchScreen from '@/components/journeys/ParcelBatchScreen';

/** Staging-only, privacy-preserving Figma review of 20 states. All actions deliberately inert.
 * No fake payments, handovers, courier locations, phone numbers, PINs or notifications.
 */
export default function ParcelBatch20Review() {
  const [index,setIndex] = useState(0);
  const [notice,setNotice] = useState('');
  const screen = PARCEL_BATCH_20[index];
  const navigateTo = (next:number) => { setIndex(Math.min(PARCEL_BATCH_20.length-1,Math.max(0,next))); setNotice(''); };
  const showInert = (id:string) => setNotice(`This is a visual review of ${id}. The real action needs an authenticated backend connection and is not executed here.`);
  const fixture = {
    pickup: 'Pickup address', destination: 'Delivery destination',
    packageDescription: 'Package details from booking',
    fare: null, etaMinutes: null,
    collectionCode: null, deliveryCode: null,
    deliveryVerified: false, paymentConfirmed: false,
  };
  return (
    <div className="min-h-[100dvh] bg-[#f3f4f6] text-[#1f2129]">
      <header className="sticky top-0 z-50 border-b border-[#e2e6ed] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-[#ff000d]"/>
            <div><h1 className="text-[14px] font-bold">CruiXe · Parcel batch 20</h1><p className="text-[11px] text-[#667080]">Staging visual review · not live delivery</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>navigateTo(index-1)} disabled={index===0} className="flex min-h-11 items-center gap-1 rounded-xl border px-3 disabled:opacity-40"><ArrowLeft size={15}/> Previous</button>
            <button onClick={()=>navigateTo(index+1)} disabled={index===PARCEL_BATCH_20.length-1} className="flex min-h-11 items-center gap-1 rounded-xl bg-[#ff000d] px-3 text-white disabled:opacity-40">Next <ArrowRight size={15}/></button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1100px] gap-5 px-3 py-5 md:grid-cols-[270px_minmax(0,1fr)]">
        <nav aria-label="Parcel Figma screens" className="max-h-[70dvh] overflow-y-auto rounded-2xl bg-white p-2">
          {PARCEL_BATCH_20.map((item,i)=>(
            <button type="button" key={item.id} onClick={()=>navigateTo(i)} aria-current={i===index?'page':undefined}
              className={`mb-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-[12px] ${i===index?'bg-[#fff1f2] font-semibold text-[#d6000c]':'hover:bg-[#f6f6f8]'}`}>
              <span className="w-6 shrink-0 tabular-nums">{String(i+1).padStart(2,'0')}</span>
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-3">
          <div role="note" className="flex w-full max-w-[440px] gap-2 rounded-xl border border-[#ffe0e5] bg-white px-3 py-3">
            <ShieldAlert className="h-4 w-4 shrink-0 text-[#ff000d]"/>
            <p className="text-[11px] leading-5">Visual QA only. Real parcel handover, private codes, cash and courier status are not simulated. This gallery is not a completed parcel feature.</p>
          </div>
          {notice && <p role="status" className="w-full max-w-[440px] rounded-xl bg-[#fff5e6] p-3 text-[12px]">{notice}</p>}
          <div className="w-full max-w-[440px] overflow-hidden rounded-[30px] border-[5px] border-[#1f2129] shadow-xl">
            <ParcelBatchScreen key={screen.id} screen={screen} data={fixture} onPrimary={showInert} onSecondary={showInert}/>
          </div>
        </div>
      </div>
    </div>
  );
}

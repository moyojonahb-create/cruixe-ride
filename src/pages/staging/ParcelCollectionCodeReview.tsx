import { useState } from 'react';
import DriverLifecycleLayout from '@/components/driver/DriverLifecycleLayout';
import DriverBottomNav from '@/components/driver/DriverBottomNav';

export const collectionCodeReview = {
  id: 'driver-collection-code',
  figmaNode: '1182:115',
  title: 'Verify parcel collection',
};

export default function ParcelCollectionCodeReview({ previewOnly }: { previewOnly: () => void }) {
  const [showError, setShowError] = useState(false);
  return <DriverLifecycleLayout
    frameId={collectionCodeReview.figmaNode}
    map={<div className="h-full bg-[#eef2f3] [background-image:linear-gradient(#d4dce3_1px,transparent_1px),linear-gradient(90deg,#d4dce3_1px,transparent_1px)] [background-size:48px_48px]">
      <span className="absolute left-5 top-28 rounded-xl bg-white px-3 py-2 text-xs">Sample map · Bulawayo</span>
    </div>}
    onBack={previewOnly} onNotifications={previewOnly} onRecenter={previewOnly}
    footer={<DriverBottomNav embedded activeTab="Requests" disabled />}
  >
    <p className="w-fit rounded-full bg-[#fdefef] px-6 py-1 text-[10px] font-bold">PARCEL COLLECTION</p>
    <h1 className="mt-3 text-[22px] font-bold">{collectionCodeReview.title}</h1>
    <p className="mt-4 text-xs text-[#667085]">Enter the collection code shared by the parcel sender.</p>
    <section className="mt-1 rounded-[17px] border border-[#e2e6ed] p-4">
      <h2 className="font-bold">Parcel pickup</h2>
      <p className="mt-2 text-xs text-[#667085]">Confirm collection before transporting parcel</p>
    </section>
    <p className="mt-4 text-[10px] font-bold text-[#667085]">ENTER 4-DIGIT COLLECTION CODE</p>
    <div className="mt-3 grid grid-cols-4 gap-3" aria-hidden="true">
      {['first', 'second', 'third', 'fourth'].map((position, index) =>
        <span className="grid h-14 place-items-center rounded-xl border border-[#e2e6ed] bg-[#f5f6f8] text-xl" key={position}>{index < 3 ? '•' : ''}</span>
      )}
    </div>
    <p className="mt-1 text-[11px] text-[#667085]">Compare the sender’s code before confirming collection.</p>
    {showError && <p role="status" className="mt-2 text-xs font-semibold text-[#b50012]">Sample error · the collection code did not match.</p>}
    <div className="mt-5 grid grid-cols-2 gap-3">
      <button type="button" className="min-h-12 rounded-[14px] border border-primary px-2 text-xs font-semibold" onClick={() => setShowError(true)}>Test incorrect code</button>
      <button type="button" className="min-h-12 rounded-[14px] bg-primary px-2 text-sm font-semibold text-white" onClick={previewOnly}>Verify</button>
    </div>
  </DriverLifecycleLayout>;
}

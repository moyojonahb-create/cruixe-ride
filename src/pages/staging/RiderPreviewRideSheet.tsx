import type { ReactNode } from 'react';
import { ArrowLeft, Crosshair } from 'lucide-react';
import '@/components/driver/driverOnboardingFonts.css';

export default function RiderPreviewRideSheet({ node, compact, preview, children }: { node: string; compact: boolean; preview: () => void; children: ReactNode }) {
  return <main data-figma-node={node} className="relative mx-auto w-full max-w-[400px] overflow-hidden rounded-[32px] bg-white font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
    <div className={compact ? 'relative h-[177px] bg-[#eef2f3]' : 'relative h-[477px] bg-[#eef2f3]'} style={{
      backgroundImage: 'linear-gradient(#d4dce3 1px,transparent 1px),linear-gradient(90deg,#d4dce3 1px,transparent 1px)', backgroundSize: '48px 48px',
    }}>
      <button aria-label="Back" type="button" onClick={preview} className="absolute left-4 top-10 grid size-12 place-items-center rounded-full bg-white shadow"><ArrowLeft /></button>
      {!compact && <button aria-label="Recenter map" type="button" onClick={preview} className="absolute right-4 top-10 grid size-12 place-items-center rounded-full bg-white shadow"><Crosshair /></button>}
      <p className="absolute left-5 top-28 rounded-lg bg-white px-3 py-2 text-xs">{compact ? 'Montrose → Tower block, Bulawayo' : 'Sample map · Bulawayo'}</p>
    </div>
    <div className="relative -mt-[18px] pt-[18px]">
      <img src="/brand/ride/red-ribbon.svg" alt="" className="pointer-events-none absolute inset-x-0 top-0 w-full" />
      <img src="/brand/ride/white-ribbon.svg" alt="" className="pointer-events-none absolute inset-x-0 top-[17px] w-full" />
      <span aria-hidden="true" className="absolute left-1/2 top-[13px] h-1.5 w-16 -translate-x-1/2 rounded-full bg-white" />
      <div className="relative space-y-3 px-4 pb-4 pt-4">{children}</div>
    </div>
  </main>;
}

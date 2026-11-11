import { ArrowLeft, CheckCircle2, Camera, ShieldCheck } from 'lucide-react';

export type DriverCaptureKind = 'profile' | 'identity' | 'licence' | 'documents' | 'vehicle';

const GUIDES: Record<DriverCaptureKind, { title: string; description: string; tip: string; frame: string }> = {
  profile: {
    title: 'Capture profile photo',
    description: 'Choose a clear image for review.',
    tip: 'Use your camera or upload a current front-facing selfie.',
    frame: '1102:105',
  },
  identity: {
    title: 'Capture identity document',
    description: 'Choose a clear image for review.',
    tip: 'Keep the full front or back of your ID in the frame.',
    frame: '1102:155',
  },
  licence: {
    title: 'Capture driver licence',
    description: 'Choose a clear image for review.',
    tip: 'Use clear photos with every number and date readable.',
    frame: '1102:206',
  },
  documents: {
    title: 'Capture vehicle documents',
    description: 'Choose a clear image for review.',
    tip: 'Capture readable insurance and other required vehicle documents.',
    frame: '1102:259',
  },
  vehicle: {
    title: 'Capture vehicle photos',
    description: 'Choose a clear image for review.',
    tip: 'Photograph your actual car in daylight, showing the plate and bodywork.',
    frame: '1102:312',
  },
};

/** Five distinct, reachable photo-guidance screens adapted from Figma frames 1102:105–312.
 * These show instructions only; the existing wizard owns camera/gallery and secure upload.
 */
export default function DriverCaptureGuide({
  kind,
  onBack,
}: {
  kind: DriverCaptureKind;
  onBack: () => void;
}) {
  const guide = GUIDES[kind];
  return (
    <div data-figma-node={guide.frame} className="flex min-h-[100dvh] w-full flex-col bg-white font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
      <header className="relative min-h-[244px] shrink-0 bg-[#1f2129] px-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <div className="flex items-center justify-between gap-3">
          <button onClick={onBack} type="button" aria-label="Back to upload checklist" className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#1f2129]">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[10px] font-bold text-[#1f2129]">
            <ShieldCheck className="h-4 w-4 text-[#ff000d]" /> DRIVER CHECK
          </span>
        </div>
        <p className="mt-9 text-[30px] font-bold tracking-tight">CruiXe DRIVER</p>
        <div className="mt-1 h-1 w-[52px] rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-9 rounded-t-[50%] bg-[#ff000d]" />
        <div aria-hidden="true" className="absolute inset-x-0 -bottom-3 h-9 rounded-t-[50%] bg-white" />
      </header>
      <main className="relative flex flex-1 flex-col px-[22px] pb-5 pt-9">
        <h1 className="text-[24px] font-bold">{guide.title}</h1>
        <p className="mt-2 text-[12px] text-[#667080]">{guide.description}</p>
        <div className="mt-6 flex items-center gap-3 text-[10px] font-semibold tracking-wide">
          <span className="h-1 w-[34px] rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />
          UPLOAD GUIDANCE
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-[15px] border border-[#e2e6ed] p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[#f7f8fa] text-[#ff000d]">
            <Camera className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-[13px] font-semibold">Photo checklist</h2>
            <p className="mt-2 text-[12px] leading-5 text-[#667080]">{guide.tip}</p>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-3 rounded-[15px] bg-[#f7f8fa] p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#ff000d]" />
          <p className="text-[12px] leading-5 text-[#667080]">Avoid glare, show the whole subject, and keep the image sharp and readable.</p>
        </div>
        <p className="mt-5 text-[11px] leading-5 text-[#667080]">
          Return to your application to choose a file or take a photo. Document submission remains private and subject to verification.
        </p>
        <div className="mt-auto pt-12">
          <button type="button" onClick={onBack} className="min-h-[55px] w-full rounded-[18px] bg-[#ff000d] px-5 text-[15px] font-semibold text-white">
            Back to checklist
          </button>
        </div>
      </main>
    </div>
  );
}

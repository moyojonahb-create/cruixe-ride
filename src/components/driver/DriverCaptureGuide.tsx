import './driverOnboardingFonts.css';
import { useEffect, useRef, useState } from 'react';
import redWave from '@/assets/driver-onboarding/red-wave.svg';
import paper from '@/assets/driver-onboarding/paper.svg';
import shield from '@/assets/driver-onboarding/shield.svg';
import back from '@/assets/driver-onboarding/back.svg';
import camera from '@/assets/driver-onboarding/camera.svg';

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
    tip: 'Capture readable registration, insurance and other required documents.',
    frame: '1102:259',
  },
  vehicle: {
    title: 'Capture vehicle photos',
    description: 'Choose a clear image for review.',
    tip: 'Photograph the real car in daylight, including plate and bodywork.',
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
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => { if (element.clientWidth) setWidth(element.clientWidth); };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  // Scale the artwork's wrapper while preserving the exported SVG root dimensions.
  const artworkStyle = { transform: `scaleX(${width / 400})`, transformOrigin: 'top left' };
  return (
    <div ref={container} data-figma-node={guide.frame} className="relative isolate flex min-h-[max(845px,100dvh)] w-full flex-col overflow-x-clip bg-white font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[246px] bg-[#1f2129]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-0 top-[216px] w-[400px]" style={artworkStyle}>
        <img src={redWave} alt="" className="block max-w-none" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute left-0 top-[237px] w-[400px]" style={artworkStyle}>
        <img src={paper} alt="" className="block max-w-none" />
      </div>
      <header className="relative h-[237px] shrink-0 text-white">
        <button onClick={onBack} type="button" aria-label="Back to upload checklist" className="absolute left-[19px] top-[max(27px,env(safe-area-inset-top))] grid h-[47px] w-[47px] place-items-center rounded-full bg-white shadow-[0_3px_4px_rgba(0,0,0,.07)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff000d]">
          <img src={back} alt="" className="block max-w-none" />
        </button>
        <span className="absolute right-[18px] top-[max(32px,env(safe-area-inset-top))] flex h-9 w-[148px] items-center gap-2 rounded-full bg-white pl-[11px] text-[10px] font-bold text-[#1f2129] shadow-[0_4px_7px_rgba(0,0,0,.06)]">
          <img src={shield} alt="" className="block max-w-none" /> DRIVER CHECK
        </span>
        <p className="absolute left-[26px] top-[96px] text-[30px] font-bold leading-[45px] tracking-tight">CruiXe DRIVER</p>
        <div className="absolute left-[27px] top-[147px] h-1 w-[52px] rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />
        <div aria-hidden="true" className="absolute left-1/2 top-[227px] h-[5px] w-[54px] -translate-x-1/2 rounded-full bg-white" />
      </header>
      <main className="relative flex flex-1 flex-col px-5 pb-[max(47px,env(safe-area-inset-bottom))] pt-[38px]">
        <h1 className="px-0.5 text-[22px] font-bold leading-[37px]">{guide.title}</h1>
        <p className="mt-2 px-0.5 text-[11.7px] leading-7 text-[#667080]">{guide.description}</p>
        <div className="mt-[15px] flex min-h-[22px] items-center gap-[10px] px-0.5 text-[10px] font-semibold">
          <span className="h-1 w-[34px] shrink-0 rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />
          UPLOAD GUIDANCE
        </div>
        <div className="mt-[9px] min-h-[190px] rounded-[16px] border border-[#e2e6ed] bg-[#f7f8fa] px-4 pb-5 pt-[19px]">
          <div className="ml-[9px]"><img src={camera} alt="" className="block max-w-none" /></div>
          <p className="mt-[30px] text-[12.7px] font-medium leading-[19px]">{guide.tip}</p>
          <p className="mt-4 text-[10.6px] leading-4 text-[#667080]">Avoid glare · show all edges · keep text readable</p>
        </div>
        <div className="mt-auto pt-10">
          <p className="mb-5 px-0.5 text-[10.1px] font-medium leading-[15.5px] text-[#667080]">Return to your checklist to choose a file or take a photo.</p>
          <button type="button" onClick={onBack} className="min-h-[55px] w-full rounded-[18px] bg-[#ff000d] px-5 text-[15px] font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff000d]">
            Back to checklist
          </button>
        </div>
      </main>
    </div>
  );
}

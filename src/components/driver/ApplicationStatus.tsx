import './driverOnboardingFonts.css';
import { useEffect, useRef, useState } from 'react';
import redWave from '@/assets/driver-onboarding/red-wave.svg';
import paper from '@/assets/driver-onboarding/paper.svg';
import shield from '@/assets/driver-onboarding/shield.svg';
import back from '@/assets/driver-onboarding/back.svg';
import check from '@/assets/driver-onboarding/check.svg';

interface ApplicationStatusProps {
  status: string;
  vehicleInfo: { make: string | null; model: string | null; year: number | null; plateNumber: string | null; type: string };
  documentsStatus: { total: number; approved: number; pending: number; rejected: number };
  onBack?: () => void;
  onReview?: () => void;
  onContinue?: () => void;
}

/** Live application outcomes use Figma 1101:619 / 689 / 759. No outcome preview controls. */
export default function ApplicationStatus({ status, vehicleInfo, documentsStatus, onBack, onReview, onContinue }: ApplicationStatusProps) {
  const frame = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(400);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width || 400);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width || 400));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const isSuspended = status === 'suspended';
  const hasCorrections = !isSuspended && (documentsStatus.rejected > 0 || status === 'rejected');
  const isApproved = status === 'approved' && !hasCorrections && !isSuspended;
  const title = isSuspended ? 'Account suspended' : hasCorrections ? 'Changes requested' : isApproved ? "You're verified!" : 'Application received';
  const description = isSuspended ? 'Your driver access is suspended. Contact support for next steps.' : hasCorrections ? 'Some information needs attention.' : isApproved ? 'Your CruiXe Driver profile is approved.' : 'Your driver profile is awaiting review.';
  const vehicle = [vehicleInfo.make, vehicleInfo.model, vehicleInfo.year].filter(Boolean).join(' ');
  const cards = isSuspended ? [
    { title: 'Access restricted', detail: 'Your account cannot accept trips while suspended.' },
    { title: 'Next step', detail: 'Contact support to review your driver access.' },
  ] : hasCorrections ? [
    { title: 'Documents require changes', detail: `${documentsStatus.rejected} current document(s) require attention.` },
    { title: 'Document review', detail: `${documentsStatus.pending} pending · ${documentsStatus.approved} approved` },
    { title: 'Resubmit documents', detail: 'Review the affected documents and upload corrected versions below.' },
  ] : isApproved ? [
    { title: 'Driver approval', detail: 'Confirmed by your application status.' },
    { title: 'Document review', detail: `${documentsStatus.approved} approved · ${documentsStatus.pending} pending` },
    { title: 'Vehicle', detail: [vehicle || 'Vehicle not specified', vehicleInfo.plateNumber || 'Registration not provided'].join(' · ') },
    { title: 'Next step', detail: 'Set your availability on Driver Home when you are ready.' },
  ] : [
    { title: 'Submission saved', detail: documentsStatus.total > 0 ? `${documentsStatus.total} document(s) submitted · ${documentsStatus.pending} awaiting review` : 'Your application is saved. Add documents for review.' },
    { title: 'Next step', detail: 'Check your application for document review updates.' },
    { title: 'While you wait', detail: "You can review the information you've submitted." },
  ];
  const action = isApproved ? onContinue : onReview;
  return (
    <section ref={frame} aria-label="Driver application status" data-figma-node={isApproved ? '1101:759' : hasCorrections ? '1101:689' : '1101:619'} className="relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden bg-white font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
      <header className="relative h-[237px] shrink-0 bg-[#1f2129]">
        {onBack && <button type="button" onClick={onBack} aria-label="Back to Driver" className="absolute left-[19px] top-[max(27px,env(safe-area-inset-top))] grid size-[47px] place-items-center rounded-full bg-white shadow-[0_3px_4px_rgba(0,0,0,.07)]"><img src={back} alt="" width="26" height="26" /></button>}
        <span className="absolute right-[18px] top-[max(32px,env(safe-area-inset-top))] flex h-9 w-[148px] items-center gap-2 rounded-full bg-white pl-[11px] text-[10px] font-bold"><img src={shield} alt="" width="20" height="20" />DRIVER CHECK</span>
        <p className="absolute left-[26px] top-[97px] text-[30px] font-bold leading-[1.4] tracking-tight text-white">CruiXe DRIVER</p>
        <span className="absolute left-[27px] top-[147px] h-1 w-[52px] rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />
      </header>
      {/* Keep exact exported SVG dimensions; scale the native artwork in its responsive slot. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[216px] -z-0 h-[65px] overflow-hidden"><img src={redWave} alt="" width="400" height="65" className="max-w-none origin-left" style={{ transform: `scaleX(${width / 400})` }} /></div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[237px] -z-0 h-[608px] overflow-hidden"><img src={paper} alt="" width="400" height="608" className="max-w-none origin-left" style={{ transform: `scaleX(${width / 400})` }} /></div>
      <span aria-hidden="true" className="absolute left-1/2 top-[227px] h-[5px] w-[54px] -translate-x-1/2 rounded-full bg-white" />
      <div className="relative flex flex-1 flex-col px-5 pb-[max(47px,env(safe-area-inset-bottom))] pt-[38px]">
        <h1 className="px-0.5 text-[24px] font-bold leading-[37px]">{title}</h1>
        <p className="mt-1 min-h-[34px] px-0.5 pt-1 text-[11.7px] leading-[18px] text-[#667080]">{description}</p>
        <p className="mb-[9px] mt-[13px] flex min-h-[22px] items-center gap-[10px] px-0.5 text-[10px] font-semibold"><span aria-hidden="true" className="h-1 w-[34px] shrink-0 rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />{hasCorrections ? 'VERIFICATION STATUS · ACTION REQUIRED' : isApproved ? 'VERIFICATION STATUS · APPROVED' : 'VERIFICATION STATUS'}</p>
        <div className="space-y-[11px]">
          {cards.map((card) => <div key={card.title} className="flex min-h-[75px] items-start gap-[13px] rounded-[14px] border border-[#e2e6ed] bg-white p-3">
            <span className={`mt-0.5 grid size-[35px] shrink-0 place-items-center rounded-full ${isApproved ? 'bg-[#1f2129]' : 'bg-[#f7f8fa]'}`}>{isApproved ? <img src={check} alt="" width="18" height="18" /> : <span aria-hidden="true" className="text-[18px] font-bold">•</span>}</span>
            <div className="min-w-0"><h2 className="text-[12.5px] font-semibold leading-5">{card.title}</h2><p className="mt-[5px] text-[10.5px] leading-[17px] text-[#667080]">{card.detail}</p></div>
          </div>)}
        </div>
        <div className="mt-auto pt-7">
          <p className="mb-5 px-0.5 text-[10.1px] leading-[16px] text-[#667080]">{isApproved ? 'Approval follows document review. Availability is checked separately.' : hasCorrections ? 'Review the listed requirements and update your documents.' : 'Your application status reflects the latest available review.'}</p>
          {action && <button type="button" onClick={action} className="min-h-[55px] w-full rounded-[18px] bg-[#ff000d] px-4 py-3 text-[15px] font-semibold text-white">{isApproved ? 'Back to Welcome' : hasCorrections ? 'Fix documents' : 'Review application'}</button>}
        </div>
      </div>
    </section>
  );
}

import { CheckCircle2, Clock3, AlertCircle, CarFront, FileCheck2, ShieldCheck } from 'lucide-react';

interface ApplicationStatusProps {
  status: string;
  vehicleInfo: {
    make: string | null;
    model: string | null;
    year: number | null;
    plateNumber: string | null;
    type: string;
  };
  documentsStatus: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
}

/**
 * Maps the three Figma Driver application states to actual server-supplied
 * application/document status. Never render "verified" from local preview data.
 * Reference frames: 1101:619, 1101:689 and 1101:759.
 */
export default function ApplicationStatus({ status, vehicleInfo, documentsStatus }: ApplicationStatusProps) {
  const isApproved = status === 'approved';
  const hasCorrections = !isApproved && (documentsStatus.rejected > 0 || status === 'rejected');
  const isSuspended = status === 'suspended';
  const Icon = isApproved ? CheckCircle2 : hasCorrections || isSuspended ? AlertCircle : Clock3;
  const title = isApproved ? "You're verified!" : hasCorrections ? 'Changes requested' : isSuspended ? 'Account suspended' : 'Application received';
  const description = isApproved
    ? 'Your CruiXe Driver profile is approved.'
    : hasCorrections
      ? 'Some documents need attention before your application can be approved.'
      : isSuspended
        ? 'Your driver access is suspended. Contact support for next steps.'
        : 'Your driver profile is awaiting review.';
  const label = isApproved ? 'VERIFICATION STATUS · APPROVED' : hasCorrections
    ? 'VERIFICATION STATUS · ACTION REQUIRED' : 'VERIFICATION STATUS';
  const vehicle = [vehicleInfo.make, vehicleInfo.model, vehicleInfo.year].filter(Boolean).join(' ');
  return (
    <section className="overflow-hidden rounded-[28px] bg-white font-['Poppins',system-ui,sans-serif] text-[#1f2129]" aria-label="Driver application status">
      <div className="relative h-[225px] bg-[#1f2129] px-6 pt-7 text-white">
        <div className="flex items-center justify-between">
          <span className="text-[23px] font-bold tracking-tight">CruiXe <span className="font-medium">DRIVER</span></span>
          <span className="rounded-full bg-white px-3 py-2 text-[10px] font-bold text-[#1f2129]">DRIVER CHECK</span>
        </div>
        <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />
        <div className="absolute inset-x-0 bottom-0 h-[32px] rounded-t-[50%] bg-[#ff000d]" />
        <div className="absolute inset-x-0 -bottom-[12px] h-[35px] rounded-t-[50%] bg-white" />
      </div>
      <div className="relative px-[22px] pb-7 pt-6">
        <h1 className="text-[24px] font-bold leading-[1.25]">{title}</h1>
        <p className="mt-2 text-[12px] leading-5 text-[#667080]">{description}</p>
        <div className="mt-5 flex items-center gap-3 text-[10px] font-semibold tracking-wide">
          <span className="h-1 w-[34px] rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]" />
          {label}
        </div>
        <div className="mt-6 rounded-[18px] border border-[#e2e6ed] bg-white px-4 py-4">
          <div className="flex items-start gap-3">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[13px] ${isApproved ? 'bg-[#e8f9ee]' : hasCorrections || isSuspended ? 'bg-[#fff4ed]' : 'bg-[#f7f8fa]'}`}>
              <Icon className={`h-6 w-6 ${isApproved ? 'text-[#168244]' : hasCorrections || isSuspended ? 'text-[#c36519]' : 'text-[#ff000d]'}`} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">
                {isApproved ? 'Ready to drive' : hasCorrections ? 'Documents require changes' : isSuspended ? 'Access restricted' : 'Submission saved'}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-[#667080]">
                {isApproved ? 'Set your availability on Driver Home when you are ready.'
                  : hasCorrections ? 'Review the affected documents and upload corrected versions below.'
                    : isSuspended ? 'Your account cannot accept trips while suspended.'
                      : "We'll update your status after your documents have been reviewed."}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Submitted', value: documentsStatus.total },
            { label: 'Verified', value: documentsStatus.approved },
            { label: 'Needs attention', value: documentsStatus.rejected },
          ].map(({ label: itemLabel, value }) => (
            <div key={itemLabel} className="rounded-[14px] bg-[#f7f8fa] px-2 py-3 text-center">
              <p className="text-[19px] font-semibold tabular-nums">{value}</p>
              <p className="mt-1 text-[10px] leading-4 text-[#667080]">{itemLabel}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-[15px] border border-[#e2e6ed] bg-white p-3">
            <FileCheck2 className="h-5 w-5 shrink-0 text-[#ff000d]" />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold">Document review</p>
              <p className="text-[11px] text-[#667080]">{documentsStatus.pending} pending · {documentsStatus.rejected} require attention</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[15px] border border-[#e2e6ed] bg-white p-3">
            <CarFront className="h-5 w-5 shrink-0 text-[#ff000d]" />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold">{vehicle || 'Vehicle not specified'}</p>
              <p className="text-[11px] text-[#667080]">{vehicleInfo.plateNumber || 'Registration pending'} · {vehicleInfo.type}</p>
            </div>
          </div>
          {isApproved && (
            <div className="flex items-center gap-3 rounded-[15px] bg-[#f7f8fa] p-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-[#168244]" />
              <p className="text-[12px] font-semibold">Driver approval confirmed by your application status.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

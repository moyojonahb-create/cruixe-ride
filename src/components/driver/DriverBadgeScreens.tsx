import { useEffect, useRef } from 'react';
import './driverOnboardingFonts.css';
export type BadgeScreen = 'progress' | 'achievements' | 'requirements';
export interface BadgeActivity { rides: number; parcels: number; status: string; }
const frames = { progress: '1356:232', achievements: '1360:142', requirements: '1360:204' };
const titles = { progress: 'Driver Badge', achievements: 'Achievements', requirements: 'Badge Requirements' };
const asset = (id: string) => `/brand/driver-badges/${id}.svg`;
const button = 'min-h-[52px] rounded-[14px] px-3 text-[12px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#733c23]';
const card = 'rounded-[17px] bg-white p-[17px] shadow-[-5px_6px_0_#161118]';
export default function DriverBadgeScreens({ screen, activity, loading, error, onRetry, onScreen, onProfile }: {
  screen: BadgeScreen; activity: BadgeActivity | null; loading?: boolean; error?: string;
  onRetry: () => void; onScreen: (screen: BadgeScreen) => void; onProfile: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { window.scrollTo({ top: 0 }); heading.current?.focus({ preventScroll: true }); }, [screen]);
  const ready = !loading && !error && activity;
  const count = (key: 'rides' | 'parcels') => ready ? activity[key].toLocaleString() : '—';
  return <div data-figma-node={frames[screen]} className="mx-auto flex min-h-[max(845px,100dvh)] w-full max-w-[440px] flex-col bg-[#f4f5f7] font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
    <header className="flex min-h-[100px] items-start gap-2 bg-white px-[14px] pb-3 pt-[max(43px,env(safe-area-inset-top))]">
      <button aria-label="Back" onClick={screen === 'progress' ? onProfile : () => onScreen('progress')} className="relative h-[47px] w-[47px] shrink-0 rounded-full bg-white shadow-[0_3px_4px_#00000012]"><img alt="" src="/brand/driver-auth/back.svg" className="absolute left-[7.5px] top-[10.5px]" /></button>
      <h1 ref={heading} tabIndex={-1} className="min-w-0 flex-1 pt-1 text-[19px] font-bold leading-7 outline-none">{titles[screen]}</h1>
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#fff0f2]"><img src={asset('1356-243')} alt="" /></span>
    </header>
    <main className="flex flex-1 flex-col px-[18px] pb-8 pt-[16px]">
      <p className="mb-4 text-[12px] leading-[19px] text-[#707582]">{screen === 'progress' ? 'Your achievements and badge progress.' : screen === 'achievements' ? 'Review completed rides, deliveries and verified milestones.' : 'Learn how tier progression will work once rules are approved.'}</p>
      <section className="flex min-h-[97px] items-center gap-[13px] rounded-[19px] border-t-[5px] border-[#cc7d47] bg-[#733c23] px-[18px] py-[14px]">
        {screen === 'progress' ? <span className="flex h-[59px] w-[59px] shrink-0 items-center justify-center rounded-[19px] bg-[#fff5e3]"><img src={asset('1356-260')} alt="" /></span> : <img src={asset('1360-169')} className="shrink-0" alt="" />}
        <div className="min-w-0"><h2 className="text-[18px] font-bold leading-7 text-white">{screen === 'achievements' ? 'Your achievements' : 'Badge status pending'}</h2><p className="mt-1 text-[11px] leading-[17px] text-white">{screen === 'achievements' ? `${count('rides')} rides · ${count('parcels')} parcels` : 'Award eligibility is not yet configured'}</p><p className="mt-1 text-[10px] leading-4 text-white">Badges and identity verification are separate.</p></div>
      </section>
      {loading && <p role="status" className="mt-4 text-sm">Loading your activity…</p>}
      {error && <div role="alert" className="mt-4 rounded-xl bg-white p-4 text-sm"><p>{error}</p><button onClick={onRetry} className="mt-2 min-h-11 font-semibold underline">Try again</button></div>}
      <h2 className="mb-4 mt-[26px] text-[18px] font-bold">{screen === 'progress' ? 'Your achievements' : screen === 'achievements' ? 'Milestone activity' : 'How will tiers advance?'}</h2>
      {screen === 'progress' ? <>
        <dl className="grid min-h-[108px] grid-cols-2 items-center rounded-[17px] bg-white py-4 text-center shadow-[-5px_0_0_#161118]">{(['rides','parcels'] as const).map((key, i) => <div key={key} className={i ? 'border-l border-[#e5e9ed]' : ''}><dd className="text-[26px] font-bold">{count(key)}</dd><dt className="mt-2 text-[11px] text-[#707582]">{key}</dt></div>)}</dl>
        <section className={`${card} mt-[30px] min-h-[153px]`}><h3 className="text-[17px] font-bold">Next badge</h3><p className="mt-4 text-[11px] font-semibold">Eligibility rules not yet configured</p><p className="mt-5 text-[10px] leading-4 text-[#707582]">Safe driving, approved trips and completed jobs may contribute once the platform defines its badge criteria.</p></section>
      </> : screen === 'achievements' ? <div className="rounded-[17px] bg-white p-2">{[
        ['1360-180','Passenger rides',`${count('rides')} completed rides`,'Completed ride totals'],
        ['1360-188','Parcel deliveries',`${count('parcels')} completed deliveries`,'Completed parcel totals'],
        ['1360-196','Driver approval',ready ? (activity.status === 'approved' ? 'Approved' : activity.status.replace(/_/g,' ')) : 'Unavailable','Separate from achievement tier'],
      ].map(([icon,title,value,detail]) => <section key={title} className="flex min-h-[99px] gap-3 rounded-xl border-b border-l-[4px] border-b-[#e5e9ed] border-l-[#ff000d] p-3 last:border-b-0"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#f4f5f7]"><img src={asset(icon)} alt="" /></span><div className="min-w-0"><h3 className="text-[13px] font-semibold">{title}</h3><p className="mt-2 text-[11px] font-semibold">{value}</p><p className="mt-2 text-[9px] text-[#707582]">{detail}</p></div></section>)}</div> : <>
        <ol className={card}>{[
          ['Verified driver','Driver identity and documents must be approved.'],
          ['Completed jobs','The platform can consider completed trips and deliveries.'],
          ['Safety and conduct','Driving and account compliance may matter for eligibility.'],
        ].map(([title,description],i) => <li key={title} className="flex min-h-[84px] gap-4 border-b border-[#e5e9ed] py-3 last:border-0"><span className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff5e3] text-xs font-bold">{i+1}</span><div><h3 className="text-[13px] font-semibold">{title}</h3><p className="mt-2 text-[10px] leading-4 text-[#707582]">{description}</p></div></li>)}</ol>
        <section className={`${card} mt-9 flex gap-4`}><img src={asset('1360-196')} alt="" /><div><h3 className="text-[13px] font-semibold">Progression rules pending</h3><p className="mt-1 text-[11px] leading-4 text-[#707582]">No tier is awarded until approved rules and award records are available.</p></div></section>
      </>}
      {screen !== 'requirements' && <button onClick={() => onScreen('requirements')} className={`${button} mt-auto w-full translate-y-3 ${screen === 'progress' ? 'bg-[#ff000d]' : 'bg-[#121316]'} text-white`}>{screen === 'progress' ? 'View' : 'See'} Badge Requirements</button>}
    </main>
    <footer className="grid grid-cols-2 gap-[10px] bg-white px-[18px] pb-[max(25px,env(safe-area-inset-bottom))] pt-[17px]">
      <button onClick={screen === 'progress' ? onProfile : () => onScreen('progress')} className={`${button} border-[1.5px] border-[#ff000d] bg-white text-[#111]`}>{screen === 'progress' ? 'Back to Profile' : 'Badge Progress'}</button>
      <button onClick={screen === 'progress' ? () => onScreen('achievements') : onProfile} className={`${button} bg-[#ff000d] text-white`}>{screen === 'progress' ? 'View Achievements' : 'Back to Profile'}</button>
    </footer>
  </div>;
}

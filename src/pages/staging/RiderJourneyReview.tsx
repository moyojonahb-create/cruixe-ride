import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Grid3X3, Mic, PhoneOff, Send, Star, Volume2 } from 'lucide-react';
import portrait from '@/assets/driver-avatar-jonah.png';
import { riderJourneyFrames, type RiderJourneyFrame } from '@/lib/riderJourneyFrames';
import { FrameContent } from './RiderAccountReview';
import RiderPreviewRideSheet from './RiderPreviewRideSheet';

type Select = (id?: string) => void;
const button = 'min-h-12 rounded-full border border-[#ff000d] px-4 text-sm font-semibold';
const primary = button + ' bg-[#ff000d] text-white';
const field = 'min-h-12 w-full rounded-2xl border border-[#dde2e9] bg-[#f3f4f6] px-4 text-sm';

function Actions({ frame, select }: { frame: RiderJourneyFrame; select: Select }) {
  return <div className="flex gap-3 pt-4">
    {frame.secondary && <button type="button" className={button + ' flex-1'} onClick={() => select(frame.secondary?.next)}>{frame.secondary.label}</button>}
    {frame.action && <button type="button" className={primary + ' flex-1'} onClick={() => select(frame.action?.next)}>{frame.action.label}</button>}
  </div>;
}

function Calling({ frame, select }: { frame: RiderJourneyFrame; select: Select }) {
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const ended = frame.id === 'call-ended' || frame.id === 'call-failed';
  return <div className="flex min-h-[790px] flex-col text-center">
    <header className="flex items-center gap-4 py-4"><button type="button" aria-label="Back to chat" onClick={() => select('rider-chat')} className="grid size-12 place-items-center rounded-full shadow"><ArrowLeft /></button><h1 className="text-xl font-bold">{frame.title}</h1></header>
    <p className="mx-auto mt-5 rounded-full bg-[#ff000d] px-6 py-1.5 text-xs font-semibold text-white">{frame.badge}</p>
    <p className="mt-3 text-xs text-[#596575]">{frame.subtitle}</p>
    <div className="mx-auto my-8 grid size-[min(66vw,260px)] place-items-center rounded-full bg-[#fff0f1]">
      <div className="grid size-3/4 place-items-center rounded-full bg-[#f9d4da]">
        {frame.id === 'agent-call' ? <span className="text-3xl font-bold">TN</span> : <img src={portrait} alt="" className="size-3/4 rounded-full object-cover" />}
      </div>
    </div>
    <h2 className="text-2xl font-bold">{frame.hero?.heading}</h2><p className="mt-2 text-sm font-semibold text-[#596575]">{frame.hero?.detail}</p>
    <div className="mt-auto pt-6">
      {!ended && <div className="flex justify-around pb-3">
        <button type="button" aria-pressed={muted} className="grid justify-items-center gap-2 p-2 text-xs" onClick={() => setMuted(!muted)}><Mic />Mute</button>
        <button type="button" aria-pressed={speaker} className="grid justify-items-center gap-2 p-2 text-xs" onClick={() => setSpeaker(!speaker)}><Volume2 />Speaker</button>
        <button type="button" className="grid justify-items-center gap-2 p-2 text-xs" onClick={() => select()}><Grid3X3 />Keypad</button>
      </div>}
      {ended ? <Actions frame={frame} select={select} /> : <button type="button" className={primary + ' inline-flex items-center gap-2'} onClick={() => select('call-ended')}><PhoneOff size={18} />End call</button>}
    </div>
  </div>;
}

function Chat({ frame, select }: { frame: RiderJourneyFrame; select: Select }) {
  const [draft, setDraft] = useState('');
  return <div className="flex min-h-[790px] flex-col gap-4">
    <header className="text-center"><h1 className="text-xl font-bold">{frame.title}</h1><p className="text-xs text-[#596575]">● Online · sample</p></header>
    <ol className="space-y-3">{frame.messages?.map((message, i) => <li key={message} className={`max-w-[85%] rounded-2xl p-3 text-xs ${i === 1 ? 'ml-auto bg-[#ff000d] text-white' : 'bg-[#f3f4f6]'}`}>{message}</li>)}</ol>
    <div className="mt-auto space-y-3">
      <div className="flex gap-2">{frame.choice?.options.map(label => <button type="button" key={label} className="min-h-11 flex-1 rounded-2xl bg-[#161118] px-2 text-xs text-white" onClick={() => setDraft(label)}>{label}</button>)}</div>
      <div className="flex gap-2"><input aria-label="Message" className={field} maxLength={300} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Type a message…" /><button type="button" aria-label="Preview message" className={primary} onClick={() => select()}><Send size={18} /></button></div>
      <Actions frame={frame} select={select} /><button type="button" className={primary + ' w-full'} onClick={() => select('cancel-ride')}>Cancel Trip</button>
    </div>
  </div>;
}

function Auth({ frame, select }: { frame: RiderJourneyFrame; select: Select }) {
  const signup = frame.id === 'sign-up';
  return <div className="space-y-4">
    <img src={signup ? '/brand/auth/signup-hero.webp' : '/brand/auth/login-hero.webp'} alt="" className="h-52 w-full rounded-2xl object-cover" />
    <h1 className="text-2xl font-bold">{frame.title}</h1><p className="text-sm text-[#596575]">{frame.subtitle}</p>
    {frame.labels?.map(label => <label key={label} className="block text-xs font-semibold">{label}<input readOnly className={field + ' mt-1'} placeholder="Sample only" /></label>)}
    <Actions frame={frame} select={select} />
    {frame.sections?.flatMap(group => group.rows).map(row => <button type="button" key={row.heading} className="min-h-10 text-sm underline" onClick={() => select(row.next)}>{row.heading}</button>)}
    <div className="grid gap-2">{['Google', 'Apple'].map(provider => <button type="button" key={provider} className={button} onClick={() => select()}>Continue with {provider}</button>)}</div>
  </div>;
}

function JourneyContent({ frame, select }: { frame: RiderJourneyFrame; select: Select }) {
  if (frame.surface === 'call') return <Calling frame={frame} select={select} />;
  if (frame.layout === 'chat') return <Chat frame={frame} select={select} />;
  if (frame.surface === 'auth') return <Auth frame={frame} select={select} />;
  if (frame.surface === 'splash') {
    const brand = frame.id === 'splash-brand';
    return <section className={`flex min-h-[810px] flex-col items-center justify-center rounded-[28px] p-5 ${brand ? 'bg-[#ff000d] text-white' : 'bg-[#f4eae4] text-[#ff000d]'}`}>
      <h1 className="sr-only">{frame.title}</h1>
      <img src={brand ? '/brand/cruixe-logo-white-transparent.png' : '/brand/cruixe-splash-tagline.png'} alt="" className="max-h-[420px] w-full object-contain" />
      <p className="mt-8 text-sm font-semibold">Proudly Zim</p><Actions frame={frame} select={select} />
    </section>;
  }
  if (frame.surface === 'tiers') return <div className="space-y-4"><h1 className="text-2xl font-bold">{frame.title}</h1><p>{frame.subtitle}</p>
    {[['Economy', 'economy-car', 'find-drivers'], ['Shared', 'shared-car', 'find-shared'], ['Parcel', 'parcel-van', 'parcel-photo']].map(([label, asset, next]) =>
      <button type="button" key={label} className={field + ' flex items-center gap-5 py-4 font-bold'} onClick={() => select(next)}><img src={`/brand/cruize-${asset}.webp`} alt="" className="w-24" />{label}</button>)}
  </div>;
  const hasRating = frame.surface === 'rating';
  const hasCode = frame.surface === 'code';
  return <>
    {hasCode && <div aria-label="Four masked sample code digits" className="mb-5 flex justify-center gap-3">{Array.from({ length: 4 }, (_, i) => <span key={i} aria-hidden="true" className="grid size-12 place-items-center rounded-xl bg-[#f3f4f6]">•</span>)}</div>}
    {hasRating && <div aria-hidden="true" className="mb-5 flex justify-center gap-2 text-[#e5aa15]">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="fill-[#ffca31]" />)}</div>}
    <FrameContent frame={frame} select={select} />
  </>;
}

const accountLinks: Record<string, string> = {
  account: '/staging/rider-account',
  'support-cases': '/staging/rider-account?screen=support-cases',
};

export default function RiderJourneyReview() {
  const [params, setParams] = useSearchParams();
  const [notice, setNotice] = useState(false);
  const frame = riderJourneyFrames.find(item => item.id === params.get('screen')) ?? riderJourneyFrames[0];
  const select: Select = id => {
    if (id && riderJourneyFrames.some(item => item.id === id)) {
      setParams({ screen: id });
      setNotice(false);
    } else setNotice(true);
  };
  const content = <JourneyContent key={frame.id} frame={frame} select={id => select(id === 'account' ? 'ride-home' : id === 'support-cases' ? 'ride-activity' : id)} />;
  return <div className="min-h-dvh bg-[#f2f3f5] font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
    <aside className="sticky top-0 z-20 mx-auto max-w-[400px] bg-white p-3 text-sm">
      <p className="font-semibold">Rider journey review · sample data</p>
      <label className="block">Screen
        <select className="mt-1 block min-h-11 w-full rounded-lg border px-2" value={frame.id} onChange={event => select(event.target.value)}>
          {riderJourneyFrames.map(item => <option key={item.id} value={item.id}>{item.title} · {item.node}</option>)}
        </select>
      </label>
      <div className="mt-2 flex gap-4 text-xs"><a className="underline" href={accountLinks.account}>Account gallery</a><a className="underline" href={accountLinks['support-cases']}>Support cases</a></div>
      {notice && <p role="status" className="mt-2">Preview only. No live request was made.</p>}
    </aside>
    {frame.surface === 'map' ? <RiderPreviewRideSheet node={frame.node} compact mapHeight={335} preview={() => select()}>{content}</RiderPreviewRideSheet> :
      <main data-figma-node={frame.node} className="mx-auto min-h-[845px] max-w-[400px] rounded-[30px] bg-white p-4">{content}</main>}
  </div>;
}

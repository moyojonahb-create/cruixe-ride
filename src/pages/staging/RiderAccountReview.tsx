import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Bell, Check, ChevronRight, CircleHelp, FileText, Headphones, Info, Lock, MapPin, Send, ShieldCheck, User } from 'lucide-react';
import home from '@/assets/rider-home/nav-home.svg';
import activity from '@/assets/rider-home/nav-activity.svg';
import ride from '@/assets/rider-home/nav-ride.svg';
import wallet from '@/assets/rider-home/nav-wallet.svg';
import account from '@/assets/rider-home/nav-account.svg';
import { riderAccountFrames, type RiderAccountFrame, type RiderAccountRow } from '@/lib/riderAccountFrames';
import RiderPreviewRideSheet from './RiderPreviewRideSheet';
import '@/components/driver/driverOnboardingFonts.css';

const panel = 'rounded-[16px] border border-[#dde2e9]';
const muted = 'text-xs leading-relaxed text-[#596575]';
const red = 'min-h-[52px] w-full rounded-full bg-[#ff000d] px-3 text-sm font-semibold text-white';
const secondary = 'min-h-[52px] w-full rounded-full border border-[#ff000d] px-3 text-sm font-semibold';
type Select = (id?: string) => void;

function rowIcon(text: string) {
  if (/place|location|route|Montrose/i.test(text)) return MapPin;
  if (/notification|alert|push|news/i.test(text)) return Bell;
  if (/support|case|agent/i.test(text)) return Headphones;
  if (/policy|terms|rules|legal/i.test(text)) return FileText;
  if (/account|privacy|password|security|devices/i.test(text)) return Lock;
  if (/profile/i.test(text)) return User;
  return Info;
}

function Row({ row, select, style }: { row: RiderAccountRow; select: Select; style?: 'policy' | 'timeline' }) {
  const [checked, setChecked] = useState(row.toggle);
  const Icon = rowIcon(row.heading);
  const copy = <span className="min-w-0 flex-1 text-left"><span className="block text-[13px] font-semibold">{row.heading}</span>{row.detail && <span className={muted + ' mt-1 block'}>{row.detail}</span>}</span>;
  if (style === 'policy') return <article className="rounded-xl border-l-[3px] border-[#ff000d] bg-[#f3f4f6] p-3"><h3 className="text-sm font-semibold">{row.heading}</h3><p className={muted + ' mt-3'}>{row.detail}</p></article>;
  if (style === 'timeline') return <div className="flex gap-3 px-3 py-3"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#fff0f1] text-[#cc0010]"><Check aria-hidden="true" className="size-3" /></span>{copy}</div>;
  const content = <><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f3f4f6] text-[#e0000c]"><Icon aria-hidden="true" className="size-5" /></span>{copy}</>;
  const classes = panel + ' flex w-full items-center gap-3 bg-white p-2.5 min-h-[64px]';
  if (checked !== undefined) return <button type="button" role="switch" aria-checked={checked} aria-label={row.heading} onClick={() => setChecked(!checked)} className={classes}>
    {content}<span aria-hidden="true" className={`flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 ${checked ? 'justify-end bg-[#ff000d]' : 'bg-[#788491]'}`}><span className="size-5 rounded-full bg-white" /></span>
  </button>;
  if (row.next || row.button) return <button type="button" onClick={() => select(row.next)} className={classes}>
    {content}{row.button ? <span className="shrink-0 text-xs font-semibold text-[#b9000d]">{row.button}</span> : <ChevronRight className="size-4 shrink-0" aria-hidden="true" />}
  </button>;
  return <div className={classes}>{content}</div>;
}

function RiderNavigation({ active, select }: { active: NonNullable<RiderAccountFrame['nav']>; select: Select }) {
  return <nav aria-label="Rider navigation preview" className="mt-8 flex justify-around gap-1 rounded-[20px] border border-[#dde2e9] p-2 shadow-md">
    {([[home, 'Home'], [activity, 'Activity'], [ride, 'Ride'], [wallet, 'Wallet'], [account, 'Account']] as const).map(([src, label]) =>
      <button type="button" key={label} aria-label={label} aria-current={label === active ? 'page' : undefined}
        onClick={() => select(label === 'Account' ? 'account' : label === 'Activity' ? 'support-cases' : undefined)}
        className={`flex min-h-11 min-w-10 items-center justify-center gap-1 rounded-full ${label === active ? 'bg-[#ff000d] px-3 text-xs font-semibold text-white' : ''}`}>
        <img src={src} alt="" className="size-5" />{label === active && label}
      </button>)}
  </nav>;
}

function PreviewField({ field, chat, select }: { field: NonNullable<RiderAccountFrame['fields']>[number]; chat: boolean; select: Select }) {
  const [value, setValue] = useState(field.value);
  if (chat) return <div className="flex gap-2">
    <input aria-label="Message for support" placeholder={field.label} className={panel + ' min-h-12 min-w-0 flex-1 bg-[#f3f4f6] px-3 text-sm'} value={value} maxLength={500} onChange={e => setValue(e.target.value)} />
    <button type="button" aria-label="Preview send" className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#ff000d] text-white" onClick={() => select()}><Send className="size-5" /></button>
  </div>;
  const classes = panel + ' mt-2 min-h-[52px] w-full bg-[#f5f6f8] p-3 text-sm font-normal text-[#374151]';
  return <label className="block text-[13px] font-semibold">{field.label}
    {field.max ? <><textarea className={classes} rows={4} maxLength={field.max} value={value} onChange={e => setValue(e.target.value)} /><span className={muted + ' block text-right'}>{value.length} / {field.max}</span></> :
      <input className={classes} value={value} maxLength={150} onChange={e => setValue(e.target.value)} />}
  </label>;
}

function FrameContent({ frame, select }: { frame: RiderAccountFrame; select: Select }) {
  const [choice, setChoice] = useState(0);
  const layout = frame.layout;
  const hero = frame.hero;
  const notice = frame.notice;
  const Icon = hero ? rowIcon(hero.heading) : Info;
  const caseStatus = layout === 'timeline';
  const support = layout === 'support';
  const chat = layout === 'chat';
  const profile = layout === 'profile';
  return <div className="space-y-3">
    {profile && <button type="button" onClick={() => select()} className="mx-auto block text-xs font-semibold"><span className="mx-auto mb-2 grid size-16 place-items-center rounded-full border border-[#647084] bg-[#fff0f1] text-xl font-bold text-[#d1000c]">JM</span>Change photo</button>}
    <div className={support || chat || profile ? 'pt-2' : 'flex min-h-[66px] items-center gap-3 border-b border-[#dde2e9] pb-3'}>
      {!support && !chat && !profile && frame.id !== 'account' && <button type="button" aria-label="Back" onClick={() => select(layout === 'policy' ? 'policies' : 'account')} className="grid size-10 shrink-0 place-items-center rounded-full"><ArrowLeft className="size-5" /></button>}
      <h1 className={`font-bold ${support || chat || profile || frame.id === 'account' ? 'text-[23px]' : 'text-[17px]'}`}>{frame.title}</h1>
    </div>
    {frame.subtitle && <p className={muted}>{frame.subtitle}</p>}
    {frame.badge && !caseStatus && <span className="inline-block rounded-full bg-[#fff0f1] px-4 py-1 text-[10px] font-bold text-[#900009]">{frame.badge}</span>}
    {hero && <section className={`rounded-[17px] p-4 ${chat || support || frame.id === 'account' ? 'border border-[#e6c8ca] bg-[#fff0f1]' : 'bg-[#ff000d] text-white'}`}>
      <div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#d5000d]">{layout === 'success' ? <Check /> : <Icon aria-hidden="true" className="size-5" />}</span>
      <div><h2 className="text-lg font-bold">{hero.heading}</h2>{hero.detail && <p className="mt-1 text-xs leading-relaxed">{hero.detail}</p>}{caseStatus && <p className="mt-2 text-xs">{frame.summary?.heading}</p>}</div></div>
      {hero.action && <button type="button" className={red + ' mt-3 min-h-10'} onClick={() => select(hero.action?.next)}>{hero.action.label}</button>}
    </section>}
    {caseStatus && <p className="flex items-center gap-3 text-xs"><span className="rounded-full bg-[#161118] px-5 py-1.5 text-[10px] font-bold text-white">{frame.badge}</span><span>{frame.summary?.detail}</span></p>}
    {frame.choice && !chat && <section className="space-y-2 pt-2">
      {frame.choice.label && <h2 className="text-[10px] font-semibold uppercase text-[#596575]">{frame.choice.label}</h2>}
      <div className="flex flex-wrap gap-2">{frame.choice.options.map((label, index) => <button type="button" key={label} aria-pressed={choice === index} onClick={() => setChoice(index)} className={`min-h-10 flex-1 rounded-full border px-2 text-[11px] font-semibold ${choice === index ? 'border-[#ff000d] bg-[#ff000d] text-white' : 'border-[#dde2e9] bg-[#f3f4f6]'}`}>{label}</button>)}</div>
    </section>}
    {!chat && frame.fields?.map(field => <PreviewField key={field.label} field={field} chat={false} select={select} />)}
    {frame.sections?.map((section, index) => {
      const filter = frame.id === 'support-cases' || frame.id === 'notifications';
      const rows = section.rows.filter(row => !filter || choice === 0 || row.filter === choice);
      if (!rows.length) return null;
      return <section key={section.heading ?? index} className="space-y-2 pt-2">
        {section.heading && <h2 className="text-[11px] font-semibold text-[#596575]">{section.heading}</h2>}
        <div className={`${layout === 'policy' || caseStatus ? panel + ' p-3' : ''} ${support && index === 0 ? 'grid grid-cols-2 gap-2' : 'space-y-2'}`}>
          {rows.map(row => <Row key={row.heading} row={row} select={select} style={caseStatus ? 'timeline' : layout === 'policy' ? 'policy' : undefined} />)}
        </div>
      </section>;
    })}
    {chat && <>
      <ol aria-label="Sample support conversation" className="space-y-2">{frame.messages?.map((message, index) => <li key={message} className={`max-w-[85%] rounded-2xl p-3 text-xs ${index % 2 ? 'ml-auto bg-[#ff000d] text-white' : 'bg-[#f3f4f6]'}`}>{message}</li>)}</ol>
      <div className="flex flex-wrap gap-2">{frame.choice?.options.map((label, i) => <button type="button" key={label} className={panel + ' min-h-10 flex-1 px-2 text-xs'} onClick={() => select(i === 2 ? 'lost-item' : 'report-issue')}>{label}</button>)}</div>
      {frame.fields?.map(field => <PreviewField key={field.label} field={field} chat select={select} />)}
    </>}
    {notice && <section className="rounded-[16px] border-l-[3px] border-[#ff000d] bg-[#f3f4f6] p-3">
      <div className="flex gap-2"><ShieldCheck className="size-5 shrink-0 text-[#d0000b]" aria-hidden="true" /><div><h2 className="text-xs font-semibold">{notice.heading}</h2>{notice.detail && <p className={muted + ' mt-1'}>{notice.detail}</p>}</div></div>
      {notice.action && <button type="button" className="min-h-10 px-6 text-xs font-semibold" onClick={() => select(notice.action?.next)}>{notice.action.label}</button>}
    </section>}
    {(frame.action || frame.secondary) && <div className={`grid gap-2 pt-4 ${frame.action && frame.secondary && frame.id !== 'account' && frame.id !== 'report-issue' ? 'grid-cols-2' : ''}`}>
      {frame.secondary && <button type="button" className={secondary} onClick={() => select(frame.secondary?.next)}>{frame.secondary.label}</button>}
      {frame.action && <button type="button" className={red} onClick={() => select(frame.action?.next)}>{frame.action.label}</button>}
    </div>}
    {frame.nav && <RiderNavigation active={frame.nav} select={select} />}
  </div>;
}

export default function RiderAccountReview() {
  const [params, setParams] = useSearchParams();
  const [notice, setNotice] = useState(false);
  const frame = riderAccountFrames.find(item => item.id === params.get('screen')) ?? riderAccountFrames[0];
  const select: Select = id => {
    if (id) { setParams({ screen: id }); setNotice(false); }
    else setNotice(true);
  };
  const useMap = frame.layout === 'support' || frame.layout === 'chat';
  const content = <FrameContent key={frame.id} frame={frame} select={select} />;
  return <div className="min-h-dvh bg-[#f2f3f5] font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
    <aside className="sticky top-0 z-20 mx-auto max-w-[400px] bg-white p-3 text-sm">
      <p className="flex items-center gap-2 font-semibold"><CircleHelp className="size-4" />Rider account and support · sample data</p>
      <label className="block">Screen
        <select className="mt-1 block min-h-11 w-full rounded-lg border px-2" value={frame.id} onChange={e => select(e.target.value)}>
          {riderAccountFrames.map(item => <option key={item.id} value={item.id}>{item.title} · {item.node}</option>)}
        </select>
      </label>
      {notice && <p role="status" className="mt-2">Preview only. No live request was made.</p>}
    </aside>
    {useMap ? <RiderPreviewRideSheet node={frame.node} compact mapHeight={frame.layout === 'chat' ? 225 : 275} preview={() => select()}>{content}</RiderPreviewRideSheet> :
      <main data-figma-node={frame.node} className="mx-auto min-h-[845px] max-w-[400px] rounded-[30px] bg-white p-4 pt-5">{content}</main>}
  </div>;
}

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Grid3X3, Info, Mail, Mic, PhoneOff, ShieldAlert, ShieldCheck, Smartphone, Volume2 } from 'lucide-react';
import DriverWalletFrame, { walletAction } from '@/components/driver/DriverWalletFrame';
import DriverLifecycleLayout from '@/components/driver/DriverLifecycleLayout';
import DriverBottomNav from '@/components/driver/DriverBottomNav';
import portrait from '@/assets/driver-avatar-jonah.png';
import { accountPreviews, driverPreviewBatch, studentPreviews, type AccountPreview, type StudentPreview } from '@/lib/driverPreviewBatch';

const secondaryAction = 'min-h-12 rounded-[14px] border border-primary bg-white px-3 text-sm font-semibold';
const card = 'rounded-[18px] border border-[#e1e5ed] bg-white p-3';
const subtle = 'text-xs text-[#667085]';
const tag = 'rounded-full bg-[#fdefef] px-4 py-1 text-[10px] font-bold uppercase';
type ReviewActions = { select: (id: string) => void; previewOnly: () => void };

function AccountReview({ screen, select, previewOnly }: ReviewActions & { screen: AccountPreview }) {
  const edit = screen.layout === 'edit';
  const dispute = screen.layout === 'case';
  const verify = screen.layout === 'verify';
  const Symbol = screen.id === 'verify-email' ? Mail : screen.id === 'verify-phone' ? Smartphone : ShieldCheck;
  return <DriverWalletFrame frame={screen.node} title={screen.title} onBack={previewOnly}
    headerIcon={verify ? <Symbol className="size-8 rounded-xl bg-[#ffedf0] p-1.5 text-primary" aria-hidden="true" /> : <span className="size-6 rounded-[10px] bg-primary" aria-hidden="true" />}
    footer={<div className="grid grid-cols-2 gap-2">
      <button type="button" className={secondaryAction} onClick={previewOnly}>Back to Profile</button>
      <button type="button" className={walletAction} onClick={() => screen.next ? select(screen.next) : previewOnly()}>{screen.action}</button>
    </div>}>
    {edit ? <p className="min-h-10 text-xs text-[#667085]">{screen.subtitle}</p> :
      <section className="relative flex min-h-[94px] items-center gap-5 overflow-hidden rounded-[20px] border-t-[7px] border-[#161118] bg-primary px-7 py-4 text-white">
        {dispute ? <span className="absolute -right-5 top-0 size-24 rounded-full bg-black/10" aria-hidden="true" /> :
          verify ? <Symbol className="size-6 shrink-0" aria-hidden="true" /> : <Check className="size-6 shrink-0" aria-hidden="true" />}
        <div className={dispute ? 'relative flex-1 text-center' : 'relative'}>
          <h2 className="text-sm font-bold">{screen.heading}</h2>
          <p className="mt-3 text-[11px]">{screen.subtitle}</p>
        </div>
      </section>}
    <section className={edit ? 'rounded-[18px] bg-white p-3' : 'pt-4'}>
      <h2 className="mb-3 px-1 text-[17px] font-bold">{screen.section}</h2>
      <dl className={edit ? 'space-y-3' : 'divide-y divide-[#e4e7ed] rounded-[18px] border-l-[5px] border-[#161118] bg-white px-4 pb-3'}>
        {screen.fields.map(([label, value]) => <div key={label} className={edit
          ? 'min-h-[73px] rounded-[14px] border-l-4 border-primary bg-[#f2f3f5] px-3 py-2'
          : 'relative min-h-[77px] py-3 before:absolute before:-left-3 before:top-4 before:h-8 before:w-[3px] before:rounded before:bg-primary'}>
          <dt className={dispute ? 'text-[11px] font-semibold' : 'text-[11px] text-[#667085]'}>{label}</dt>
          <dd className={dispute ? 'mt-3 text-[11px] text-[#667085]' : 'mt-2 text-[13px] font-medium'}>{value}</dd>
        </div>)}
      </dl>
    </section>
    <div className="flex min-h-[82px] items-start gap-3 rounded-[18px] border-b-[5px] border-l-[5px] border-[#161118] bg-white p-4 text-[11px] leading-4 text-[#667085]">
      {verify ? <ShieldCheck className="size-9 shrink-0 rounded-xl bg-[#ffedf0] p-2 text-primary" aria-hidden="true" /> :
        !dispute && <Info className="size-9 shrink-0 rounded-xl bg-[#ffedf0] p-2" aria-hidden="true" />}
      <p>{screen.notice}</p>
    </div>
  </DriverWalletFrame>;
}

function StudentRideReview({ screen, select, previewOnly, fare, setFare }: ReviewActions & {
  screen: StudentPreview; fare: number; setFare: React.Dispatch<React.SetStateAction<number>>;
}) {
  const request = screen.id === 'student-request';
  const waiting = screen.id === 'student-offer-waiting';
  const amount = '$' + fare.toFixed(2);
  const map = <div className="h-full bg-[#eef2f3]" style={{backgroundImage:'linear-gradient(#d4dce3 1px,transparent 1px),linear-gradient(90deg,#d4dce3 1px,transparent 1px)',backgroundSize:'48px 48px'}}>
    <span className="absolute left-5 top-28 rounded-xl bg-white px-3 py-2 text-xs">Sample map · Bulawayo</span>
  </div>;
  return <DriverLifecycleLayout frameId={screen.node} map={map} onBack={previewOnly} onRecenter={previewOnly} onNotifications={previewOnly}
    footer={<DriverBottomNav embedded activeTab="Requests" disabled />}>
    <div className="flex items-center justify-between gap-2">
      <span className={tag}>{request ? 'Student ride · College / University' : waiting ? 'Awaiting decision' : 'Offer accepted'}</span>
      {request ? <span className="flex items-center gap-1 rounded-full bg-[#f2f3f5] px-3 py-1 text-[11px] font-semibold"><Clock className="size-4" />25s left</span> :
        waiting ? <button type="button" onClick={previewOnly} className="min-h-8 rounded-full bg-[#f2f3f5] px-3 text-[11px]">Other outcomes</button> : <span className={tag}>Student</span>}
    </div>
    <h1 className="mt-2 text-[22px] font-bold leading-tight">{screen.title}</h1>
    <div className="my-2 flex items-center justify-between gap-2">
      <p className={subtle}>{request ? 'Rumbidzai Ncube · 1 student' : waiting ? 'Rumbidzai Ncube is reviewing your fare.' : 'Student rider accepted your offer.'}</p>
      {request && <button type="button" className="min-h-9 rounded-full bg-[#1f2129] px-6 text-xs text-white" onClick={previewOnly}>Skip</button>}
      {!request && !waiting && <span className="rounded-full bg-[#1f2129] px-6 py-1 text-sm font-bold text-white">{amount}</span>}
    </div>
    <dl className={card + ' space-y-1'}>
      {[['Pickup', 'Montrose'], ['Drop-off', 'Tower Block']].map(([label, value]) => <div key={label} className="flex items-center gap-4">
        <span className="size-3.5 rounded-full border-[3px] border-primary" aria-hidden="true" />
        <div><dt className="text-[9px] font-semibold uppercase text-[#667085]">{label}</dt><dd className="text-sm font-bold">{value}</dd></div>
      </div>)}
    </dl>
    {request ? <div className="mt-1 space-y-1">
      <p className={subtle}>6.8 km · 16 min estimated trip</p>
      <div className="grid grid-cols-[1fr_2fr] gap-3"><span className="grid place-items-center rounded-xl bg-[#161118] text-xs text-white">Cash</span><button type="button" className={walletAction + ' min-h-10'} onClick={previewOnly}>View luggage</button></div>
      <p className="rounded-xl bg-[#f2f3f5] p-2 text-[11px]">Note · Midlands State University · Student ID: MSU--001</p>
      <button type="button" className={secondaryAction + ' w-full'} onClick={previewOnly}>View student details</button>
      <div className="grid grid-cols-[48px_1fr_48px] gap-2">
        <button type="button" className={secondaryAction} aria-label="Decrease fare" onClick={() => setFare(value => Math.max(.5, value - .5))}>−</button>
        <button type="button" className={walletAction} onClick={() => select('student-offer-waiting')}>Accept {amount}</button>
        <button type="button" className={secondaryAction} aria-label="Increase fare" onClick={() => setFare(value => value + .5)}>+</button>
      </div>
    </div> : waiting ? <div className="mt-2 space-y-4">
      <p className="flex items-center justify-between rounded-[14px] bg-[#1f2129] px-4 py-3 text-[10px] font-bold text-white">YOUR OFFER <strong className="text-xl">{amount}</strong></p>
      <p className={subtle}>Waiting for rider response.</p>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className={walletAction} onClick={() => select('student-offer-accepted')}>Rider accepts</button>
        <button type="button" className={walletAction} onClick={() => select('student-request')}>Student request</button>
      </div>
    </div> : <div className="mt-2 space-y-8">
      <div className={card + ' flex items-center gap-3'}><span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#ffe5e7] text-sm font-bold">TM</span><div><p className="text-sm font-bold">Rumbidzai Ncube</p><p className={subtle}>Verified student · Midlands State University</p></div></div>
      <button type="button" className={walletAction} onClick={previewOnly}>Navigate to pickup</button>
    </div>}
  </DriverLifecycleLayout>;
}

const callStates = {
  'student-call-ringing': ['Ringing…', 'Waiting for Rumbidzai Ncube to answer'],
  'student-call-active': ['Call connected · 02:34', 'Private in-app voice call'],
  'student-call-ended': ['Call ended', 'Your call lasted 02:34'],
  'student-call-failed': ["Couldn't connect", 'Check your internet connection or retry'],
} as const;

function StudentCallReview({ screen, select, previewOnly }: ReviewActions & { screen: StudentPreview }) {
  const ringing = screen.id === 'student-call-ringing';
  const active = screen.id === 'student-call-active';
  const failed = screen.id === 'student-call-failed';
  const [status, detail] = callStates[screen.id as keyof typeof callStates];
  const OutcomeIcon = failed ? ShieldAlert : Check;
  return <main data-figma-node={screen.node} className="mx-auto flex min-h-[max(845px,100dvh)] w-full max-w-[440px] flex-col rounded-[28px] bg-white px-4 pb-4 pt-8 font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
    <header className="flex items-center gap-4">
      <button type="button" aria-label="Back" className="grid size-12 shrink-0 place-items-center rounded-full shadow-md" onClick={previewOnly}><ArrowLeft /></button>
      <h1 className="text-[22px] font-bold">Calling Student Rider</h1>
    </header>
    <div className="mt-6 border-b border-[#e1e5ed] pb-3 text-center">
      <p className="mx-auto w-fit rounded-full bg-primary px-7 py-1.5 text-[10px] font-bold text-white">IN-APP CALL</p>
      <p className={subtle + ' mt-2'}>Your CruiXe verified student rider</p>
    </div>
    <div className="relative mx-auto mt-2 grid size-[min(67vw,270px)] place-items-center rounded-full bg-[#fcf4f5]">
      <div className="grid size-[73%] place-items-center rounded-full bg-[#f9d4da]">
        <img src={portrait} alt="" className="size-3/4 rounded-full object-cover" />
      </div>
      {ringing && <p className="absolute bottom-2 rounded-full bg-white px-10 py-2 text-[10px] font-semibold">RINGING</p>}
    </div>
    <div className="mt-6 space-y-2 text-center">
      <h2 className="text-[23px] font-bold">Rumbidzai Ncube</h2>
      <p className={active ? 'text-sm font-semibold text-[#007842]' : 'text-sm font-semibold text-[#667085]'}>{status}</p>
      <p className={subtle}>{detail}</p>
    </div>
    {ringing || active ? <div className="mt-auto space-y-2 pt-6 text-center">
      <div className="flex justify-around">
        {([[Mic, 'Mute'], [Volume2, 'Speaker'], [Grid3X3, 'Keypad']] as const).map(([Control, label]) =>
          <button type="button" key={label} className="grid justify-items-center gap-2 text-xs" onClick={previewOnly}><span className="grid size-[66px] place-items-center rounded-full bg-[#f6f7f9]"><Control /></span>{label}</button>)}
      </div>
      <button type="button" className="inline-grid justify-items-center gap-2 text-xs" onClick={() => select('student-call-ended')}><span className="grid size-20 place-items-center rounded-full bg-primary text-white"><PhoneOff /></span>End call</button>
    </div> : <div className="mt-auto space-y-5 pb-7 pt-6">
      <section className={card + ' flex min-h-28 items-center gap-3 bg-[#f6f7f9]'}>
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#ffedf0] text-primary"><OutcomeIcon /></span>
        <div><h3 className="font-semibold">{failed ? 'Connection unsuccessful' : 'Call completed'}</h3><p className={subtle + ' mt-1'}>{failed ? 'You can retry or use a direct phone call.' : 'Was the conversation helpful?'}</p></div>
      </section>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={secondaryAction} onClick={() => select('student-call-ringing')}>{failed ? 'Try again' : 'Call again'}</button>
        <button type="button" className={walletAction} onClick={previewOnly}>{failed ? 'Use direct call' : 'Done'}</button>
      </div>
    </div>}
  </main>;
}

export default function DriverPreviewBatchReview() {
  const [params, setParams] = useSearchParams();
  const [notice, setNotice] = useState(false);
  const [fare, setFare] = useState(5);
  const screen = driverPreviewBatch.find(item => item.id === params.get('screen')) ?? driverPreviewBatch[0];
  const account = accountPreviews.find(item => item.id === screen.id);
  const student = studentPreviews.find(item => item.id === screen.id);
  const select = (id: string) => { setNotice(false); setParams({ screen: id }); };
  const previewOnly = () => setNotice(true);
  return <div className="bg-[#f2f3f5]">
    <aside className="mx-auto w-full max-w-[440px] space-y-2 bg-white p-4 text-sm">
      <p className="font-semibold">Driver migration review · sample data only</p>
      <label className="block">Screen
        <select className="mt-1 block min-h-11 w-full rounded-lg border px-2" value={screen.id} onChange={event => select(event.target.value)}>
          {driverPreviewBatch.map(item => <option value={item.id} key={item.id}>{item.title} · {item.node}</option>)}
        </select>
      </label>
      {notice && <p role="status" className="sticky top-0">Preview only. No live request was made.</p>}
    </aside>
    {account && <AccountReview key={account.id} screen={account} select={select} previewOnly={previewOnly} />}
    {student?.layout === 'ride' && <StudentRideReview screen={student} select={select} previewOnly={previewOnly} fare={fare} setFare={setFare} />}
    {student?.layout === 'call' && <StudentCallReview key={student.id} screen={student} select={select} previewOnly={previewOnly} />}
  </div>;
}

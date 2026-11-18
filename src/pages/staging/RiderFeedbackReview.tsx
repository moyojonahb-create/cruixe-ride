import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Check, Star } from 'lucide-react';
import home from '@/assets/rider-home/nav-home.svg';
import activity from '@/assets/rider-home/nav-activity.svg';
import ride from '@/assets/rider-home/nav-ride.svg';
import wallet from '@/assets/rider-home/nav-wallet.svg';
import account from '@/assets/rider-home/nav-account.svg';
import portrait from '@/assets/driver-avatar-jonah.png';
import RiderPreviewRideSheet from './RiderPreviewRideSheet';

const cancellations = [
  ['cancel-wait', '850:97', 'Wait time too long'],
  ['cancel-distance', '850:153', 'Driver is too far away'],
  ['cancel-other', '850:209', 'Other'],
  ['cancel-confirm', '850:249', 'Confirm cancellation?'],
  ['cancel-complete', '850:305', 'Ride cancelled'],
] as const;

const ratings = [
  ['rating-1', '864:97', '1 star · Poor', 1],
  ['rating-2', '864:200', '2 stars · Fair', 2],
  ['rating-3', '864:303', '3 stars · Good', 3],
  ['rating-4', '864:406', '4 stars · Very good', 4],
  ['rating-5', '864:509', '5 stars · Excellent', 5],
  ['rating-written', '864:642', 'Written feedback preview', 5],
] as const;

const primary = 'min-h-12 rounded-[15px] bg-[#ff000d] px-4 font-semibold text-white';
const secondary = 'min-h-12 rounded-[15px] border border-[#ff000d] bg-white px-4 font-semibold';
const muted = 'text-sm text-[#626a76]';
const notes = 'w-full rounded-[16px] border border-[#dde2e9] bg-[#f7f8fa] p-3 text-sm';

function CancelReview({ id, select, preview }: { id: string; select: (id: string) => void; preview: () => void }) {
  const [note, setNote] = useState('My plans have changed and I cannot take this ride.');
  const completed = id === 'cancel-complete';
  const confirm = id === 'cancel-confirm';
  const other = id === 'cancel-other';
  const outcome = completed || confirm;
  return <>
    <h1 className="text-xl font-bold">{completed ? 'Ride cancelled' : confirm ? 'Confirm cancellation?' : 'Why cancel ride?'}</h1>
    <p className={muted}>{completed ? 'You can book again after cancellation.' : confirm ? 'This ride will end. The driver will be notified.' : 'Please let us know why you are canceling. This helps us improve our service.'}</p>
    {outcome ? <div className={`!mt-10 min-h-36 space-y-5 rounded-[17px] border p-4 text-[11px] ${completed ? 'border-[#ff000d] bg-[#fff0f1]' : 'border-[#ffcc22] bg-[#fff9df]'}`}>
      <p className="flex items-center gap-2 font-bold"><AlertCircle className="size-5 text-[#ff000d]" />{completed ? 'YOUR RIDE IS CLOSED' : 'BEFORE YOU CANCEL'}</p>
      <p>{completed ? 'This is a sample cancellation. No driver was notified.' : 'Your driver and pickup will be released from this booking.'}</p>
      <p>{completed ? 'Real charges depend on your approved policy.' : 'Fees, if any, must be disclosed before cancellation.'}</p>
    </div> : <div className="space-y-2">
      {cancellations.slice(0, 3).map(([key, , label]) => <button key={key} type="button" aria-pressed={key === id} onClick={() => select(key)} className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-4 text-left text-sm ${key === id ? 'border-[#ff000d] bg-[#fff0f1]' : 'border-[#626a76]'}`}>
        {label}<span aria-hidden="true" className={`size-5 rounded-full border ${key === id ? 'border-[6px] border-[#ff000d]' : 'border-[#ffcc22]'}`} />
      </button>)}
      {other && <textarea aria-label="Other reason" className={notes} rows={2} maxLength={300} value={note} onChange={e => setNote(e.target.value)} />}
    </div>}
    <div className="grid grid-cols-2 gap-3">
      <button type="button" className={secondary} onClick={completed ? preview : () => select(confirm ? 'cancel-complete' : 'cancel-confirm')}>{completed ? 'Find another ride' : confirm ? 'Cancel my ride' : 'Cancel ride'}</button>
      <button type="button" className={primary} onClick={confirm ? () => select('cancel-wait') : other ? () => select('cancel-confirm') : preview}>{completed ? 'View activity' : confirm ? 'Keep my ride' : other ? 'Done' : 'Stay on ride'}</button>
    </div>
    {!outcome && <button type="button" className={muted + ' min-h-10 w-full'} onClick={() => select('cancel-confirm')}>Skip now</button>}
  </>;
}

function RatingReview({ id, value, select, preview }: { id: string; value: number; select: (id: string) => void; preview: () => void }) {
  const [comment, setComment] = useState(id === 'rating-written' ? 'Excellent driving. I felt safe and arrived on time.' : '');
  const [tags, setTags] = useState(['Safe driving', 'Friendly']);
  return <>
    <div><h1 className="text-[22px] font-bold">Rate Driver</h1><p className={muted}>How was your ride with Jonah?</p></div>
    <div className="rounded-[16px] border border-[#dde2e9] bg-[#f7f8fa] p-3">
      <div className="flex items-center gap-3">
        <img src={portrait} alt="" className="size-14 rounded-full object-cover" />
        <div><p className="font-bold">Jonah Moyo</p><p className="text-[11px] text-[#626a76]">☆ 4.95 · 3,913 rides</p></div>
      </div>
      <p className="mt-2 text-[11px] text-[#626a76]">White Toyota Aqua · AFN 0828 · $5.00 fare</p>
    </div>
    <div className="flex justify-center gap-2" role="group" aria-label="Rating">
      {ratings.slice(0, 5).map(([key, , , star]) => <button key={key} type="button" aria-pressed={star === value} aria-label={star === 1 ? '1 star' : `${star} stars`} onClick={() => select(key)} className="grid size-11 place-items-center">
        <Star aria-hidden="true" className={`size-8 text-[#e5aa15] ${star <= value ? 'fill-[#ffca31]' : 'fill-[#e9ecf1]'}`} />
      </button>)}
    </div>
    <p className="text-center text-sm font-semibold">{ratings[value - 1][2]}</p>
    <div>
      <p className="mb-2 flex justify-between text-sm font-semibold">What went well?<span className="text-xs font-normal text-[#626a76]">Optional</span></p>
      <div className="grid grid-cols-3 gap-2">
        {['Safe driving', 'Friendly', 'Clean car'].map(tag => <button key={tag} type="button" aria-pressed={tags.includes(tag)} onClick={() => setTags(previous => previous.includes(tag) ? previous.filter(item => item !== tag) : [...previous, tag])} className={`flex min-h-11 items-center justify-center gap-1 rounded-xl border px-1 text-[11px] font-medium ${tags.includes(tag) ? 'border-black bg-black text-white' : 'border-[#dde2e9]'}`}>{tags.includes(tag) && <Check className="size-3" aria-hidden="true" />}{tag}</button>)}
      </div>
    </div>
    <label className="block text-sm font-semibold">
      <span className="mb-2 flex justify-between">Add a comment<span className="text-xs font-normal text-[#626a76]">Optional</span></span>
      <textarea rows={2} maxLength={300} className={notes} value={comment} onChange={e => setComment(e.target.value)} placeholder="Tell us a little more about your ride…" />
      <span className="block text-right text-[10px] font-normal text-[#626a76]">{comment.length} / 300</span>
    </label>
    <button type="button" className={primary + ' w-full !rounded-full'} onClick={preview}>Submit rating</button>
    <button type="button" className={muted + ' w-full py-2'} onClick={preview}>Not now</button>
    <nav aria-label="Rider navigation preview" className="flex justify-around rounded-full border border-[#dde2e9] p-2 shadow-md">
      {[[home, 'Home'], [activity, 'Activity'], [ride, 'Ride'], [wallet, 'Wallet'], [account, 'Account']].map(([src, label]) => <button type="button" onClick={preview} aria-label={label} key={label} className={`flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full text-xs ${label === 'Ride' ? 'bg-[#ff000d] px-6 font-semibold text-white' : ''}`}><img src={src} alt="" className="size-5" />{label === 'Ride' && label}</button>)}
    </nav>
  </>;
}

export default function RiderFeedbackReview() {
  const [params, setParams] = useSearchParams();
  const [notice, setNotice] = useState(false);
  const screens = [...cancellations, ...ratings];
  const selected = screens.find(([id]) => id === params.get('screen')) ?? cancellations[0];
  const [id, node] = selected;
  const rating = ratings.find(([key]) => key === id);
  const select = (next: string) => { setParams({ screen: next }); setNotice(false); };
  const preview = () => setNotice(true);
  return <div className="min-h-dvh bg-[#f2f3f5]">
    <aside className="sticky top-0 z-20 mx-auto max-w-[400px] bg-white p-3 text-sm">
      <p className="font-semibold">Rider feedback review · sample data</p>
      <label className="block">Screen
        <select value={id} onChange={event => select(event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border px-2">
          {screens.map(([key, frame, title]) => <option value={key} key={key}>{title} · {frame}</option>)}
        </select>
      </label>
      {notice && <p role="status" className="mt-2">Preview only. No live request was made.</p>}
    </aside>
    <RiderPreviewRideSheet node={node} compact={Boolean(rating)} preview={preview}>
      {rating ? <RatingReview key={rating[0]} id={id} value={rating[3]} select={select} preview={preview} /> : <CancelReview id={id} select={select} preview={preview} />}
    </RiderPreviewRideSheet>
  </div>;
}

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, Search } from 'lucide-react';
import { walletPreviewFrames } from '@/lib/walletPreviewFrames';
import { FrameContent } from './RiderAccountReview';

type Frame = typeof walletPreviewFrames[number];
type Select = (id?: string) => void;
const panel = 'rounded-2xl border border-[#dde2e9] bg-[#f5f6f8] p-4';

function PinPreview({ frame, select }: { frame: Frame; select: Select }) {
  const mismatch = frame.id === 'pin-mismatch';
  return <div className="space-y-5">
    <button aria-label="Back" type="button" className="grid size-11 place-items-center rounded-full shadow" onClick={() => select('activation')}><ArrowLeft /></button>
    <h1 className="text-xl font-bold">{frame.title}</h1><p className="text-sm text-[#596575]">{frame.subtitle}</p>
    <div className={panel + ' text-center'}><Lock className="mx-auto mb-3 text-[#d0000b]" /><p className="font-semibold">Never share your wallet PIN.</p></div>
    <div className="grid grid-cols-6 gap-2" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span className={panel + ' grid h-12 place-items-center !p-0'} key={i}>●</span>)}</div>
    <p className={`text-center text-xs ${mismatch ? 'text-[#b50010]' : 'text-[#596575]'}`}>{mismatch ? 'PIN mismatch. Re-enter your new PIN.' : '6 masked sample digits'}</p>
    <div className="grid grid-cols-3 gap-2">{['1','2','3','4','5','6','7','8','9','Help','0','⌫'].map(key =>
      <button type="button" key={key} className={panel + ' min-h-11 font-semibold'} onClick={() => select(key === 'Help' ? 'help' : undefined)} aria-label={key === '⌫' ? 'Delete digit' : key}>{key}</button>)}</div>
    <p className="text-xs text-[#596575]">Forgotten PIN? Recover access using verified account recovery.</p>
    <button type="button" className="min-h-12 w-full rounded-full bg-[#ff000d] font-semibold text-white" onClick={() => select(frame.action?.next)}>{frame.action?.label}</button>
  </div>;
}

export default function WalletPreviewReview() {
  const [params, setParams] = useSearchParams();
  const [notice, setNotice] = useState(false);
  const frame = walletPreviewFrames.find(item => item.id === params.get('screen')) ?? walletPreviewFrames[0];
  const select: Select = id => {
    if (id && walletPreviewFrames.some(item => item.id === id)) { setParams({ screen: id }); setNotice(false); }
    else setNotice(true);
  };
  return <div className="min-h-dvh bg-[#f2f3f5] font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
    <aside className="sticky top-0 z-20 mx-auto max-w-[400px] bg-white p-3 text-sm">
      <p className="font-semibold">Wallet review · sample data</p>
      <label className="block">Screen
        <select className="mt-1 block min-h-11 w-full rounded-lg border px-2" value={frame.id} onChange={event => select(event.target.value)}>
          {walletPreviewFrames.map(item => <option key={item.id} value={item.id}>{item.badge ? `${item.title} · ${item.badge}` : item.title} · {item.node}</option>)}
        </select>
      </label>
      {notice && <p role="status" className="mt-2">Preview only. No payment or account request was made.</p>}
    </aside>
    <main data-figma-node={frame.node} className="mx-auto min-h-[845px] max-w-[400px] rounded-[30px] bg-white p-4">
      {(frame.view === 'balance' || frame.view === 'transactions') && <section className="mb-4 rounded-2xl bg-[#161118] p-5 text-white">
        <p className="text-xs font-semibold">AVAILABLE BALANCE · USD</p><p className="mt-2 text-3xl font-bold">{frame.id === 'insufficient' ? '$2.00' : '$24.50'}</p><p className="mt-1 text-xs">Active · sample balance</p>
      </section>}
      {frame.view === 'transactions' && <div className="mb-4 space-y-2">
        <div className={panel + ' flex gap-2 text-xs text-[#596575]'}><Search size={15} aria-hidden="true" />Search transactions</div>
        <p className="rounded-full bg-[#f5f6f8] p-2 text-center text-xs">This month · All types · All statuses</p>
      </div>}
      {frame.view === 'pin' ? <PinPreview key={frame.id} frame={frame} select={select} /> : <FrameContent key={frame.id} frame={frame} select={id => select(id === 'account' ? 'activation' : id)} />}
    </main>
  </div>;
}

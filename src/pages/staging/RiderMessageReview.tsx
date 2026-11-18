import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Paperclip, Phone, Send } from 'lucide-react';
import RiderPreviewRideSheet from './RiderPreviewRideSheet';

const presets = {
  gate: { label: 'Main gate', chat: "I'm waiting by the main gate near the blue shop.", note: "I'll be waiting near the main gate beside the blue shop.", saved: "I'll wait near the main gate by the blue shop." },
  arrival: { label: 'Call arrival', chat: 'Please call me when you arrive at Montrose.', note: 'Please call me when you reach the pickup.', saved: 'Please call me when you reach the pickup.' },
  luggage: { label: 'Luggage', chat: 'I have two bags. Please leave space in the boot.', note: 'I have two bags. Please allow space in the vehicle.', saved: 'I have two bags. Please allow boot space.' },
} as const;
type Preset = keyof typeof presets;
const presetKeys: Preset[] = ['gate', 'arrival', 'luggage'];

const chatFrames = [
  ['chat-arrival-draft', '847:209', 'Chat · Call arrival drafted', 'arrival', 'draft'],
  ['chat-arrival-sent', '847:262', 'Chat · Call arrival sent', 'arrival', 'sent'],
  ['chat-luggage-draft', '847:321', 'Chat · Luggage drafted', 'luggage', 'draft'],
  ['chat-luggage-sent', '847:374', 'Chat · Luggage sent', 'luggage', 'sent'],
  ['chat-gate-draft', '847:97', 'Chat · Main gate drafted', 'gate', 'draft'],
  ['chat-gate-sent', '847:150', 'Chat · Main gate sent', 'gate', 'sent'],
  ['chat-photo', '847:433', 'Chat · Photo prepared', null, 'photo'],
] as const;
const noteFrames = [
  ['note-arrival-saved', '860:97', 'Note · Call arrival saved', 'arrival', true],
  ['note-luggage', '845:628', 'Note · I have luggage', 'luggage', false],
  ['note-luggage-saved', '860:154', 'Note · Luggage saved', 'luggage', true],
  ['note-gate', '845:522', 'Note · Main gate', 'gate', false],
  ['note-gate-saved', '845:681', 'Note · Main gate saved', 'gate', true],
  ['note-driver', '536:410', 'Note to driver', null, false],
] as const;

const red = 'min-h-12 rounded-[16px] bg-[#ff000d] px-3 font-semibold text-white';
const outline = 'min-h-12 rounded-[16px] border border-[#dce1e9] bg-white px-3 font-semibold';
const muted = 'text-xs text-[#626a76]';
type Actions = { select: (id: string) => void; preview: () => void };

function QuickPresets({ selected, note = false, onPick }: { selected: Preset | null; note?: boolean; onPick: (preset: Preset) => void }) {
  return <div className="grid grid-cols-3 gap-1.5">
    {presetKeys.map(key => <button key={key} type="button" aria-pressed={key === selected} onClick={() => onPick(key)} className={`min-h-11 rounded-[15px] border bg-[#161118] px-1 text-[10px] font-semibold text-white ${key === selected ? 'border-[#ff000d]' : 'border-transparent'}`}>{note && key === 'luggage' ? 'I have luggage' : presets[key].label}</button>)}
  </div>;
}

const messages = [
  ["Hi! I'm about 2 minutes away from Montrose. Traffic is light.", '10:42 AM'],
  ["Great, thanks! I'll be waiting by the main gate.", '10:43 AM'],
  ["Perfect. I'll pull up in a white Toyota Aqua, plate AFN 0828.", '10:44 AM'],
] as const;

function ChatReview({ frame, select, preview }: Actions & { frame: typeof chatFrames[number] }) {
  const [, node, , preset, state] = frame;
  const sent = state === 'sent';
  const [draft, setDraft] = useState(state === 'draft' && preset ? presets[preset].chat : '');
  const send = () => {
    if (preset && draft === presets[preset].chat) select(`chat-${preset}-sent`);
    else preview();
  };
  return <main data-figma-node={node} className="mx-auto flex min-h-[845px] max-w-[400px] flex-col rounded-[30px] bg-[#f5f6f7] px-4 pb-6 pt-6 font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
    <header className="relative flex min-h-16 items-start justify-center">
      <button type="button" aria-label="Back" onClick={preview} className="absolute left-0 grid size-11 place-items-center rounded-full bg-white shadow"><ArrowLeft /></button>
      <div className="pt-2 text-center"><h1 className="text-lg font-bold">Chat with Jonah</h1><p className={muted}>🟢 Online</p></div>
    </header>
    <ol className="space-y-4">
      {messages.map(([body, time], i) => <li key={time} className={`max-w-[85%] ${i === 1 ? 'ml-auto text-right' : ''}`}><p className={`rounded-[16px] p-3 text-left text-xs ${i === 1 ? 'bg-[#ff000d] text-white' : 'bg-white'}`}>{body}</p><p className="mt-1 text-[10px] text-[#687386]">{time}</p></li>)}
      {sent && preset && <li><p className="ml-auto w-fit max-w-[85%] rounded-[16px] bg-[#ff000d] p-3 text-xs text-white">{presets[preset].chat}</p><p className="mt-1 text-right text-[10px] text-[#687386]">Message ready · 10:45</p><p className={muted + ' mt-3'}>✓ Message visible in preview · not delivered</p></li>}
      {state === 'photo' && <li className="ml-auto flex w-fit items-center gap-2 rounded-xl border bg-white p-3 text-xs"><Paperclip className="size-4" />Pickup landmark photo · Attachment</li>}
    </ol>
    <div className="mt-auto space-y-2 pt-10">
      <QuickPresets selected={state === 'draft' ? preset : null} onPick={key => select(`chat-${key}-draft`)} />
      <div className="flex min-h-12 items-center gap-2 rounded-full border border-[#dce1e9] bg-white px-2">
        <button type="button" aria-label="Prepare sample attachment" className="grid size-9 place-items-center" onClick={() => select('chat-photo')}><Paperclip className="size-4" /></button>
        <input className="min-w-0 flex-1 bg-transparent text-xs" aria-label="Message" placeholder="Type a message..." value={draft} onChange={e => setDraft(e.target.value)} maxLength={300} />
        <button type="button" aria-label="Preview message" onClick={send} className="grid size-9 place-items-center rounded-full bg-[#ff000d] text-white"><Send className="size-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className={outline} onClick={preview}><Phone className="mx-auto size-4 text-[#ff000d]" />In-app</button>
        <button type="button" className={red} onClick={preview}><Phone className="mx-auto size-4" />Direct</button>
      </div>
      <button type="button" className={red + ' w-full !rounded-full'} onClick={preview}>Cancel Trip</button>
    </div>
  </main>;
}

function NoteReview({ frame, select, preview, draft, setDraft }: Actions & { frame: typeof noteFrames[number]; draft: string | null; setDraft: (value: string | null) => void }) {
  const [id, node, , preset, saved] = frame;
  const value = draft ?? (preset ? (saved ? presets[preset].saved : presets[preset].note) : "I'll be waiting by the main gate near the blue shop. Please call when outside.");
  const save = () => {
    select(`note-${preset ?? (value === presets.arrival.note ? 'arrival' : 'gate')}-saved`);
    setDraft(value);
  };
  return <RiderPreviewRideSheet node={node} compact mapHeight={308} preview={preview}>
    {!saved && <p className="w-fit rounded-full bg-[#ff000d] px-5 py-1 text-[10px] font-bold text-white">DRIVER MESSAGE</p>}
    <h1 className="text-[22px] font-bold">{saved ? 'Note saved' : 'Note to driver'}</h1>
    <p className={muted}>{saved ? 'Sample instruction shown as attached to the request.' : id === 'note-driver' ? 'Share a clear pickup instruction with your driver.' : 'Choose a preset, then save this pickup message.'}</p>
    {saved ? <div className="min-h-40 rounded-[16px] bg-[#f2f3f5] p-3 text-sm"><p>✓ Note saved for your driver:</p><p>{value}</p></div> :
      <textarea aria-label="Pickup instruction" className="min-h-40 w-full rounded-[16px] bg-[#f2f3f5] p-3 text-sm" maxLength={300} value={value} onChange={e => setDraft(e.target.value)} />}
    <p className={muted + ' text-right'}>{saved ? 'Preview · note saved' : `${value.length} / 300 characters`}</p>
    <p className="pt-1 text-[10px] font-semibold text-[#626a76]">{saved ? 'YOUR NOTE IS READY' : 'QUICK NOTES'}</p>
    <QuickPresets selected={saved ? null : preset} note onPick={key => { select(`note-${key === 'arrival' ? 'driver' : key}`); if (key === 'arrival') setDraft(presets[key].note); }} />
    <div className="grid grid-cols-[1fr_1.6fr] gap-3 pb-9 pt-6">
      <button type="button" className={outline + ' !rounded-full'} onClick={saved ? () => { select('note-driver'); setDraft(value); } : preview}>{saved ? preset === 'arrival' ? 'Back' : 'Edit note' : 'Discard'}</button>
      <button type="button" className={red + ' !rounded-full disabled:opacity-40'} disabled={!saved && !value.trim()} onClick={saved ? preview : save}>{saved ? preset === 'arrival' ? 'Send' : 'Back to drivers' : 'Save note'}</button>
    </div>
  </RiderPreviewRideSheet>;
}

export default function RiderMessageReview() {
  const [params, setParams] = useSearchParams();
  const [notice, setNotice] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const current = params.get('screen');
  const chat = chatFrames.find(([id]) => id === current);
  const note = noteFrames.find(([id]) => id === current) ?? noteFrames[5];
  const select = (id: string) => { setParams({ screen: id }); setNotice(false); setDraft(null); };
  const preview = () => setNotice(true);
  return <div className="min-h-dvh bg-[#f2f3f5]">
    <aside className="sticky top-0 z-20 mx-auto max-w-[400px] bg-white p-3 text-sm">
      <p className="font-semibold">Rider message review · sample data</p>
      <label className="block">Screen
        <select value={chat?.[0] ?? note[0]} onChange={e => select(e.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border px-2">
          {[...noteFrames, ...chatFrames].map(([id, node, title]) => <option key={id} value={id}>{title} · {node}</option>)}
        </select>
      </label>
      {notice && <p role="status" className="mt-2">Preview only. No message, call, or trip change was sent.</p>}
    </aside>
    {chat ? <ChatReview key={chat[0]} frame={chat} select={select} preview={preview} /> : <NoteReview frame={note} select={select} preview={preview} draft={draft} setDraft={setDraft} />}
  </div>;
}

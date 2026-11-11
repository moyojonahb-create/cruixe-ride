import { useState } from 'react';
import { ChevronLeft, ChevronRight, Layers3, ShieldAlert } from 'lucide-react';
import { COMMUNICATION_BATCH_20 } from '@/lib/communicationBatch20Screens';
import CommunicationBatchScreen from '@/components/journeys/CommunicationBatchScreen';

/** Staging-only visual QA. Buttons do not originate calls or contact real people. */
export default function CommunicationBatch20Review(){
 const [index,setIndex]=useState(0);
 const [notice,setNotice]=useState('');
 const [draft,setDraft]=useState('');
 const [muted,setMuted]=useState(false);
 const [speaker,setSpeaker]=useState(false);
 const screen=COMMUNICATION_BATCH_20[index];
 const select=(i:number)=>{setIndex(Math.max(0,Math.min(COMMUNICATION_BATCH_20.length-1,i)));setNotice('');setDraft('');};
 const showInert=()=>setNotice('Visual QA only. No call or message was sent. Real actions require verified trip participants and authenticated transport.');
 return <div className="min-h-[100dvh] bg-[#f4f5f7] text-[#1f2129]">
  <header className="sticky top-0 z-50 border-b border-[#e2e6ed] bg-white px-4 py-3">
   <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3">
    <div><h1 className="flex items-center gap-2 text-[15px] font-bold"><Layers3 className="h-5 w-5 text-[#ff000d]"/> CruiXe · Communication batch 20</h1><p className="text-[11px] text-[#667080]">Internal staging review · not a real calling session</p></div>
    <div className="flex gap-2"><button onClick={()=>select(index-1)} disabled={index===0} className="flex min-h-11 items-center gap-1 rounded-xl border px-3 disabled:opacity-40"><ChevronLeft size={15}/> Previous</button>
     <button onClick={()=>select(index+1)} disabled={index===19} className="flex min-h-11 items-center gap-1 rounded-xl bg-[#ff000d] px-3 text-white disabled:opacity-40">Next <ChevronRight size={15}/></button></div>
   </div>
  </header>
  <div className="mx-auto grid max-w-[1100px] gap-5 px-3 py-5 md:grid-cols-[280px_minmax(0,1fr)]">
   <nav aria-label="Communication Figma screens" className="max-h-[70dvh] overflow-y-auto rounded-2xl bg-white p-2">
    {COMMUNICATION_BATCH_20.map((item,i)=><button type="button" key={item.id} onClick={()=>select(i)} aria-current={i===index?'page':undefined}
     className={`mb-1 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-[12px] ${i===index?'bg-[#fff1f2] font-semibold text-[#d6000c]':'hover:bg-[#f6f6f8]'}`}>
     <span className="w-6 shrink-0 tabular-nums">{String(i+1).padStart(2,'0')}</span><span className="min-w-0 flex-1 truncate">{item.title} · {item.state}</span>
    </button>)}
   </nav>
   <div className="flex flex-col items-center gap-3">
    <div role="note" className="flex w-full max-w-[440px] items-start gap-2 rounded-xl border border-[#ffe0e5] bg-white px-3 py-3">
     <ShieldAlert className="h-4 w-4 shrink-0 text-[#ff000d]"/>
     <p className="text-[11px] leading-5">Figma presentation only. No real calls, messages, call timers, or recipient details are fabricated in this gallery.</p>
    </div>
    {notice && <p role="status" className="w-full max-w-[440px] rounded-xl bg-[#fff5e6] p-3 text-[12px]">{notice}</p>}
    <div className="w-full max-w-[440px] overflow-hidden rounded-[28px] border-[5px] border-[#1f2129] shadow-xl">
      <CommunicationBatchScreen key={screen.id} screen={screen}
       data={{contactName:screen.label,seconds:0,draft,muted,speaker,canSend:false,messages:[]}}
       onBack={showInert} onEnd={showInert} onRetry={showInert} onSend={showInert}
       onToggleMute={()=>setMuted(x=>!x)} onToggleSpeaker={()=>setSpeaker(x=>!x)} onDraftChange={setDraft}/>
    </div>
   </div>
  </div>
 </div>;
}

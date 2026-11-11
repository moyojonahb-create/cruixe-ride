import { ArrowLeft, MessageCircle, Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Send, ShieldCheck, WifiOff } from 'lucide-react';
import type { CommunicationScreenDefinition } from '@/lib/communicationBatch20Screens';

export interface CommunicationViewData {
  contactName?: string;
  liveStatus?: 'connecting'|'ringing'|'connected'|'ended'|'failed';
  seconds?: number;
  muted?: boolean;
  speaker?: boolean;
  messages?: Array<{id:string;text:string;outgoing:boolean;sentAt?:string}>;
  canSend?: boolean;
  draft?: string;
}
interface Props {
  screen: CommunicationScreenDefinition;
  data: CommunicationViewData;
  onBack: ()=>void;
  onEnd: ()=>void;
  onRetry: ()=>void;
  onSend:(text:string)=>void;
  onToggleMute:()=>void;
  onToggleSpeaker:()=>void;
  onDraftChange:(next:string)=>void;
}
export default function CommunicationBatchScreen({
 screen,data,onBack,onEnd,onRetry,onSend,onToggleMute,onToggleSpeaker,onDraftChange,
}:Props){
 const contact=data.contactName || screen.label;
 const state=screen.state;
 const isMessage=state==='message';
 const minutes=Math.floor((data.seconds||0)/60);
 const seconds=Math.floor((data.seconds||0)%60);
 const duration=`${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
 const messageDraft=data.draft||'';
 return <section data-figma-node={screen.figmaNode} aria-label={screen.title}
  className="flex min-h-[100dvh] flex-col bg-white font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
   <header className="relative min-h-[200px] shrink-0 bg-[#1f2129] px-6 pt-[max(24px,env(safe-area-inset-top))] text-white">
    <div className="flex items-center justify-between gap-3">
     <button type="button" onClick={onBack} aria-label="Back to ride" className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#1f2129]"><ArrowLeft className="h-5 w-5"/></button>
     <span className="rounded-full bg-white px-3 py-2 text-[10px] font-bold tracking-wider text-[#1f2129]">CruiXe DRIVER</span>
    </div>
    <p className="mt-8 text-[22px] font-bold">{isMessage?`Chat with ${contact}`:`Calling ${screen.label}`}</p>
    <div className="mt-2 h-1 w-[52px] rounded-full bg-gradient-to-r from-[#ff000d] to-[#ffd11c]"/>
    <div className="absolute inset-x-0 bottom-0 h-8 rounded-t-[48%] bg-[#ff000d]" aria-hidden="true"/>
    <div className="absolute inset-x-0 -bottom-3 h-8 rounded-t-[48%] bg-white" aria-hidden="true"/>
   </header>
   <main className="relative flex flex-1 flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-8">
    {isMessage ? <>
     <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#e2e6ed] bg-white p-3">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#f6f6f8] text-[#ff000d]"><MessageCircle className="h-5 w-5"/></span>
       <div><p className="text-[14px] font-semibold">{contact}</p><p className="text-[11px] text-[#667080]">In-app messages</p></div></div>
      <ShieldCheck className="h-5 w-5 text-[#ff000d]"/>
     </div>
     <div aria-label="Messages" className="mt-5 min-h-[220px] flex-1 space-y-3 overflow-y-auto rounded-[18px] bg-[#f7f8fa] p-4">
      {data.messages?.length ? data.messages.map(m=><div key={m.id} className={`flex ${m.outgoing?'justify-end':'justify-start'}`}>
       <div className={`max-w-[82%] rounded-[17px] px-4 py-3 text-[12px] leading-5 ${m.outgoing?'bg-[#ff000d] text-white':'bg-white text-[#1f2129]'}`}>
        <p>{m.text}</p>{m.sentAt && <p className="mt-1 text-[10px] opacity-70">{m.sentAt}</p>}
       </div></div>) : <p className="text-center text-[12px] text-[#667080]">Messages appear here when your ride conversation starts.</p>}
     </div>
     <form onSubmit={e=>{e.preventDefault();if(messageDraft.trim())onSend(messageDraft.trim());}} className="mt-4 flex items-center gap-2">
      <input aria-label="Type a message" placeholder="Type a message..." value={messageDraft} onChange={e=>onDraftChange(e.target.value)}
       className="min-h-[52px] min-w-0 flex-1 rounded-[15px] border border-[#e2e6ed] bg-white px-4 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff000d]"/>
      <button type="submit" disabled={!data.canSend||!messageDraft.trim()} aria-label="Send message" className="grid h-[52px] w-[52px] place-items-center rounded-[15px] bg-[#ff000d] text-white disabled:opacity-40"><Send className="h-5 w-5"/></button>
     </form>
    </> : <>
      <div className="text-center">
       <span className="inline-block rounded-full bg-[#f6f6f8] px-4 py-2 text-[10px] font-bold tracking-[.08em] text-[#1f2129]">IN-APP CALL</span>
       <div className="mx-auto mt-8 grid h-[118px] w-[118px] place-items-center rounded-full bg-[#fff2f3]"><Phone className="h-12 w-12 text-[#ff000d]"/></div>
       <p className="mt-6 text-[22px] font-bold">{contact}</p>
       <p role="status" aria-live="polite" className="mt-3 text-[13px] text-[#667080]">
        {state==='connecting'?'Connecting securely…':state==='ringing'?'Ringing…':state==='connected'? `Call connected · ${duration}`:state==='ended'?'Call ended':"Couldn't connect"}
       </p>
       <p className="mt-2 text-[11px] text-[#667080]">{state==='failed'?'Check your network or try again':state==='connected'?'Private in-app voice call':state==='ended'?'Your call has finished':'Connecting to your verified trip contact'}</p>
      </div>
      {state==='failed' && <div className="mt-8 flex gap-2 rounded-[15px] bg-[#fff5f5] px-4 py-3 text-[12px]"><WifiOff className="h-5 w-5 shrink-0 text-[#ff000d]"/><span>Connection unsuccessful. You can retry once the network is available.</span></div>}
      {state==='connected'||state==='connecting'||state==='ringing' ? <div className="mt-auto flex justify-around gap-3 pt-12">
        <button type="button" onClick={onToggleMute} aria-label={data.muted?'Unmute':'Mute'} className="flex min-h-[70px] flex-col items-center justify-center gap-1 rounded-[17px] bg-[#f6f6f8] px-5 text-[11px]">{data.muted?<MicOff className="h-5 w-5"/>:<Mic className="h-5 w-5"/>}Mute</button>
        <button type="button" onClick={onToggleSpeaker} aria-label={data.speaker?'Speaker off':'Speaker on'} className="flex min-h-[70px] flex-col items-center justify-center gap-1 rounded-[17px] bg-[#f6f6f8] px-5 text-[11px]">{data.speaker?<Volume2 className="h-5 w-5"/>:<VolumeX className="h-5 w-5"/>}Speaker</button>
        <button type="button" onClick={onEnd} aria-label="End call" className="flex min-h-[70px] flex-col items-center justify-center gap-1 rounded-[17px] bg-[#ff000d] px-5 text-[11px] text-white"><PhoneOff className="h-5 w-5"/>End call</button>
       </div>: <div className="mt-auto flex gap-3 pt-12">
        <button type="button" onClick={onBack} className="min-h-[54px] flex-1 rounded-[17px] border border-[#ff000d] text-[13px] font-semibold text-[#ff000d]">Done</button>
        <button type="button" onClick={onRetry} className="min-h-[54px] flex-[2] rounded-[17px] bg-[#ff000d] text-[13px] font-semibold text-white">{state==='failed'?'Try again':'Call again'}</button>
       </div>}
    </>}
   </main>
  </section>;
}

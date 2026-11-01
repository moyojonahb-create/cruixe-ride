import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';
import NoteToDriverSheet from '../src/components/ride/NoteToDriverSheet';
import ScheduleRide from '../src/components/ride/ScheduleRide';
import BookingForSomeoneElse from '../src/components/ride/BookingForSomeoneElse';
import ParcelBookingSheet from '../src/components/ride/ParcelBookingSheet';
import ShareRideSheet from '../src/components/ride/ShareRideSheet';
import '../src/index.css';
import '../src/components/ride/approvedRide.css';

type LocalEvent = { action: string; detail?: unknown };
function OverlayFixture() {
 const overlay = new URLSearchParams(location.search).get('overlay') || 'note';
 const [open,setOpen]=useState(true),[submitting,setSubmitting]=useState(false);
 const [payment,setPayment]=useState<'cash'|'wallet'>('cash');
 const [events,setEvents]=useState<LocalEvent[]>([]);
 const record=(action:string,detail?:unknown)=>setEvents(old=>[...old,{action,detail}]);
 const close=()=>{record('close');setOpen(false);};
 const [note,setNote]=useState(''),[reuse,setReuse]=useState(false);
 const denyRef=useRef<((value:boolean)=>void)|null>(null);
 const [scheduled,setScheduled]=useState<Date|null>(null);
 const [enabled,setEnabled]=useState(false),[passengerName,setPassengerName]=useState(''),[phone,setPhone]=useState('');
 const [payer,setPayer]=useState<'booker'|'passenger'>('booker'),[notify,setNotify]=useState(true);
 const [size,setSize]=useState<'small'|'medium'|'large'>('small');
 return <main className="approved-ride" style={{minHeight:'100dvh',background:'#edf0f2'}}>
  <aside style={{position:'fixed',top:0,left:0,right:0,zIndex:9999,fontSize:10,background:'#222',color:'white',textAlign:'center'}}>MOCKED / ISOLATED - local callbacks only; no booking</aside>
  <div style={{position:'fixed',top:20,left:6,zIndex:9998,display:'flex',gap:8,fontSize:10}}>
   <button onClick={()=>setOpen(true)}>Fixture reopen</button>
   <button onClick={()=>setPayment(old=>old==='cash'?'wallet':'cash')}>Fixture payment</button>
   <button onClick={()=>setSubmitting(old=>!old)}>Fixture submitting</button>
   <button onClick={()=>denyRef.current?.(false)}>Fixture deny note</button>
  </div>
  <output hidden data-testid="secondary-state">{JSON.stringify({overlay,open,submitting,payment,note,reuse,scheduled,enabled,passengerName,phone,payer,notify,size,events})}</output>
  {overlay==='note'&&<NoteToDriverSheet open={open} onClose={close} note={note} onNoteChange={setNote} reuseEveryTrip={reuse} onReuseEveryTripChange={setReuse} onSave={(draft,reuseDraft)=>{record('note pending',{draft,reuseDraft});return new Promise<boolean>(resolve=>{denyRef.current=resolve;});}}/>}
  {overlay==='schedule'&&<ScheduleRide open={open} onClose={close} onConfirm={(date,remind)=>{record('schedule callback',{at:date.toISOString(),remind});setScheduled(date);setOpen(false);}} scheduledAt={scheduled} onCancelScheduled={()=>{record('cancel scheduled callback');setScheduled(null);}} destinationName="Fixture destination" tierLabel="Economy" fareLabel="$6.00"/>}
  {overlay==='someone'&&<BookingForSomeoneElse open={open} onClose={close} enabled={enabled} onEnabledChange={setEnabled} tierLabel="Economy" pickupName="Fixture pickup" dropoffName="Fixture destination" fare={6} currencySymbol="$" paymentMethod={payment} passengerName={passengerName} onPassengerNameChange={setPassengerName} passengerPhone={phone} onPassengerPhoneChange={setPhone} payer={payer} onPayerChange={setPayer} notifyBooker={notify} onNotifyBookerChange={setNotify} onConfirm={()=>record('third-party callback denied',{passengerName,phone,payer,notify})} submitting={submitting} onOpenContacts={()=>record('contacts callback')}/>}
  {overlay==='parcel'&&<ParcelBookingSheet open={open} onClose={close} onConfirm={data=>record('parcel callback denied',data)} submitting={submitting} pickupName="Fixture pickup" dropoffName="Fixture destination" distanceKm={3} fare={6} currencySymbol="$" paymentMethod={payment} packageSize={size} onPackageSizeChange={setSize}/>}
  {overlay==='share'&&<ShareRideSheet open={open} onClose={close} onConfirm={()=>record('share callback denied')} onRideAlone={()=>record('ride alone callback')} submitting={submitting} shareFare={4} soloFare={6} dropoffTown="Fixture destination" riderFirstName="Fixture rider"/>}
 </main>;
}
createRoot(document.getElementById('root')!).render(<OverlayFixture/>);

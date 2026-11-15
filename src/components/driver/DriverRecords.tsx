import { useRef, useState } from 'react';
import { updateMyDriver, createDriverDocument } from '@/lib/businessApi';
import { supabase } from '@/lib/supabaseClient';
import { RecordsShell, RecordsHero, RecordsRows, RecordsNote, type RecordsScreen } from './DriverRecordsScreen';
export interface RecordDocument { id: string; document_type: string; status: string; rejection_reason?: string | null; created_at: string }
export interface RecordProfile { id: string; status: string; vehicle_make: string | null; vehicle_model: string | null; vehicle_color: string | null; vehicle_type: string | null; plate_number: string | null }
export function currentDocuments(documents: RecordDocument[]) {
  const sorted = [...documents].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return sorted.filter((doc, index) => sorted.findIndex(other => other.document_type === doc.document_type) === index);
}
const documentTypes = [['registration', 'Vehicle registration'], ['insurance', 'Insurance'], ['license', 'Driving licence'], ['license_back', 'Licence back'], ['id_card', 'Identity document'], ['selfie_with_id', 'Selfie with ID'], ['personal_photo', 'Profile photo'], ['vehicle_photo', 'Vehicle photo'], ['police_clearance', 'Police clearance']] as const;
const labelFor = (type: string) => documentTypes.find(row => row[0] === type)?.[1] || type;
export default function DriverRecords({ initialScreen = 'verification', profile, documents, userId, onBack, onRefresh, preview = false }: { initialScreen?: RecordsScreen; profile: RecordProfile; documents: RecordDocument[]; userId?: string; onBack: () => void; onRefresh?: () => void; preview?: boolean }) {
  const [screen, setScreen] = useState(initialScreen);
  const [vehicle, setVehicle] = useState({ vehicle_make: profile.vehicle_make || '', vehicle_model: profile.vehicle_model || '', plate_number: profile.plate_number || '', vehicle_color: profile.vehicle_color || '' });
  const [localDocuments, setLocalDocuments] = useState<RecordDocument[]>([]);
  const latest = currentDocuments([...localDocuments, ...documents]);
  const rejected = latest.filter(doc => doc.status === 'rejected');
  const [type, setType] = useState(rejected[0]?.document_type || 'registration');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const uploaded = useRef<{ file: File; type: string; path: string } | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const activeDoc = latest.find(doc => doc.document_type === type);
  const go = (next: RecordsScreen) => { setError(''); setScreen(next); };
  const save = async () => {
    if (lock.current) return;
    if (preview) { setError('Preview only. No changes were submitted.'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      if (screen === 'vehicle') {
        const values = Object.fromEntries(Object.entries(vehicle).map(([key, value]) => [key, value.trim()]));
        if (Object.values(values).some(value => !value)) throw new Error('Complete the vehicle details before saving.');
        const response = await updateMyDriver(values);
        if (response?.success === false) throw new Error('Vehicle details could not be saved. Please retry.');
        setSaved(true); go('vehicle-review'); onRefresh?.();
      } else {
        if (!userId || !profile.id) throw new Error('Sign in again before uploading.');
        if (!file) throw new Error('Choose a document to upload.');
        if (file.size > 5 * 1024 * 1024 || file.size === 0) throw new Error('Choose a non-empty file smaller than 5MB.');
        if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) throw new Error('Choose a JPEG, PNG, WebP or PDF file.');
        if (uploaded.current?.file !== file || uploaded.current.type !== type) {
          const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }[file.type];
          const path = `${userId}/${type}_${crypto.randomUUID()}.${ext}`;
          const result = await supabase.storage.from('driver-documents').upload(path, file);
          if (result.error) throw result.error;
          uploaded.current = { file, type, path };
        }
        const response = await createDriverDocument({ driver_id: profile.id, document_type: type, file_url: uploaded.current.path });
        if (response?.success === false) throw new Error('Document submission failed. Please retry.');
        setLocalDocuments(old => [...old, { id: response?.id || uploaded.current!.path, document_type: type, status: 'pending', created_at: new Date().toISOString() }]);
        setFile(null); uploaded.current = null; setSaved(true); go('document-review'); onRefresh?.();
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save. Please try again.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const documentStatus = activeDoc?.status || 'Not submitted';
  const action = screen === 'vehicle' || screen === 'renew' || screen === 'resubmit' ? () => void save() : screen === 'changes' ? () => go(rejected.length ? 'resubmit' : 'renew') : () => go('verification');
  return <RecordsShell screen={screen} onBack={onBack} busy={busy} action={screen === 'verification' ? () => go('renew') : action} actionLabel={screen === 'verification' ? 'Manage documents' : screen === 'vehicle' ? 'Save Changes' : screen === 'renew' || screen === 'resubmit' ? 'Submit for review' : screen === 'changes' ? (rejected.length ? 'Resubmit Document' : 'Manage documents') : 'View Verification'}>
    {error && <p role="alert" className="dr-error">{error}</p>}
    {screen === 'vehicle' || screen === 'renew' ? <>
      <p className="dr-intro">Manage your driver account information.</p>
      <form className="dr-form" onSubmit={e => { e.preventDefault(); void save(); }}><h2>Account information</h2>
        <fieldset disabled={busy}>{screen === 'vehicle' ? <>
          {([['vehicle_make', 'Vehicle make'], ['vehicle_model', 'Vehicle model'], ['plate_number', 'Registration'], ['vehicle_color', 'Vehicle colour']] as const).map(([key, label]) => <label className="dr-field" key={key}>{label}<input maxLength={80} required value={vehicle[key]} onChange={e => setVehicle(old => ({ ...old, [key]: e.target.value }))} /></label>)}
          <label className="dr-field">Category<input disabled value={profile.vehicle_type || 'Not assigned'} /></label>
        </> : <>
          <label className="dr-field">Document type<select value={type} onChange={e => setType(e.target.value)}>{documentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="dr-field">Document number<input disabled placeholder="Not available yet" /></label><label className="dr-field">Expiry date<input disabled placeholder="Not available yet" /></label>
          <label className="dr-field">Document upload<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />{file?.name}</label>
        </>}</fieldset>
      </form>
      <RecordsNote>{screen === 'vehicle' ? 'Saving vehicle details does not change your Driver approval or service category.' : 'Upload a clear document up to 5MB. Document number and expiry editing are not available yet. Uploaded documents require authorized review.'}</RecordsNote>
    </> : screen === 'verification' ? <>
      <p className="dr-intro">Review the status of your required driver checks and documents.</p>
      <RecordsHero title="Driver Verification" icon="1349-302">Status: {profile.status}. Final status comes from approved records.</RecordsHero>
      <h2>Verification checks</h2><div className="dr-card dr-checks">{[
        ['Identity document', latest.find(doc => doc.document_type === 'id_card')?.status || 'Not submitted', '1349-311'],
        ['Driving licence', latest.find(doc => doc.document_type === 'license')?.status || 'Not submitted', '1349-318'],
        ['Vehicle documents', `${latest.filter(doc => ['registration', 'insurance'].includes(doc.document_type) && doc.status === 'approved').length} of 2 approved`, '1349-325'],
        ['Profile review', profile.status, '1349-332'],
      ].map(([label, status, icon]) => <div key={label}><img src={`/brand/driver-records/${icon}.svg`} alt="" /><span><strong>{label}</strong><small>{status}</small></span></div>)}</div>
      <RecordsNote>Verification is determined by authorized review. Document uploads do not grant approval.</RecordsNote>
      <div className="dr-links"><button className="dr-button" onClick={() => go('vehicle')}>Update Vehicle</button><button className="dr-button" onClick={() => go('document-review')}>Document status</button>{rejected.length > 0 && <button className="dr-button" onClick={() => go('changes')}>Changes requested ({rejected.length})</button>}</div>
    </> : screen === 'vehicle-review' ? <>
      <RecordsHero title={saved ? 'Vehicle details saved' : 'Vehicle details'} icon="1367-296">{saved ? 'Account updated' : 'Current account information'}</RecordsHero><h2>Review details</h2><RecordsRows rows={Object.entries(vehicle).map(([key, value]) => [key.replace(/_/g, ' '), value])} /><RecordsNote>Driver approval remains {profile.status}. Saving these details does not approve a vehicle change.</RecordsNote>
    </> : screen === 'document-review' ? <>
      <RecordsHero title="Document review status" icon="1367-341">{saved ? 'Document submitted for review' : 'Latest submitted records'}</RecordsHero><h2>Review details</h2>
      <RecordsRows rows={latest.length ? latest.map(doc => [labelFor(doc.document_type), doc.status]) : [['Documents', 'No documents submitted']]} />
      <RecordsNote>Driving eligibility remains subject to your account approval. Statuses reflect the latest submission of each document.</RecordsNote>
      <div className="dr-links"><button className="dr-button" onClick={() => go('renew')}>Renew documents</button>{rejected.length > 0 && <button className="dr-button" onClick={() => go('changes')}>View requested changes</button>}</div>
    </> : <>
      <RecordsHero title={screen === 'resubmit' ? 'Upload corrected document' : rejected.length ? 'Document needs attention' : 'No changes requested'}>{screen === 'resubmit' ? 'Review your new submission' : 'Latest document review'}</RecordsHero><h2>Details</h2>
      {screen === 'changes' ? <RecordsRows rows={rejected.length ? rejected.map(doc => [labelFor(doc.document_type), <span key={doc.id}>{doc.rejection_reason || 'Contact support for the review details.'}<button className="dr-button mt-3 w-full" onClick={() => { setType(doc.document_type); go('resubmit'); }}>Correct {labelFor(doc.document_type)}</button></span>]) : [['Status', 'No rejected current documents']]} /> : <>
        <RecordsRows rows={[[ 'Required document', labelFor(type)], ['Current status', documentStatus]]} />
        <label className="dr-field mt-6">New photograph or PDF<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />{file?.name}</label>
      </>}
      <RecordsNote>{screen === 'resubmit' ? 'Your new submission enters review; the previous record is retained. Expiry editing is not available yet.' : 'Only reasons supplied by the document reviewer are shown.'}</RecordsNote>
    </>}
  </RecordsShell>;
}

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModalBottomSheet from '@/components/ui/ModalBottomSheet';
import { loadRiderEmergencyContact, saveRiderEmergencyContact, type RiderEmergencyContact } from '@/lib/riderEmergencyContact';

type View = 'list' | 'edit' | 'remove';
export default function TrustedContactSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const generation = useRef(0);
  const [view, setView] = useState<View>('list');
  const [contact, setContact] = useState<RiderEmergencyContact | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    generation.current += 1;
    if (!open) return;
    let active = true;
    setSaving(false);
    setView('list'); setError(null); setLoading(true);
    loadRiderEmergencyContact().then((value) => { if (active) setContact(value); })
      .catch((cause) => { if (active) setError(cause.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, reload]);
  const edit = () => { setName(contact?.name || ''); setPhone(contact?.phone || ''); setError(null); setView('edit'); };
  const save = async (value: RiderEmergencyContact | null) => {
    if (saving) return;
    const operation = generation.current;
    setSaving(true); setError(null);
    try {
      const saved = await saveRiderEmergencyContact(value);
      if (operation === generation.current) { setContact(saved); setView('list'); }
    } catch (cause) {
      if (operation === generation.current) setError(cause instanceof Error ? cause.message : 'Could not save contact.');
    } finally { if (operation === generation.current) setSaving(false); }
  };
  const title = view === 'list' ? 'Trusted Contacts' : view === 'edit' ? `${contact ? 'Edit' : 'Add'} trusted contact` : 'Remove contact';
  return <ModalBottomSheet open={open} onClose={() => { if (!saving) onClose(); }} title={title} description="Manage your saved emergency contact.">
    <section className="space-y-5 bg-white p-4 text-[#1c222b] font-['Poppins',system-ui,sans-serif]" data-figma-node={view === 'list' ? '455:625' : view === 'edit' ? '459:474' : '465:976'}>
      <header><h2 className="text-[21px] font-bold">{title}</h2><p className="mt-2 text-[11px] leading-4 text-[#647080]">{view === 'list' ? 'Manage the person you trust to contact when you need help.' : view === 'edit' ? 'Add someone you trust. You can edit or remove this contact later.' : 'This will remove your saved emergency contact.'}</p></header>
      <p className="rounded-[14px] bg-[#fff0f1] p-3 text-xs leading-5">You can currently save one emergency contact. Sharing a trip link is a separate action; saving a contact does not automatically send trip or SOS alerts.</p>
      {error && <div role="alert" className="rounded-xl border border-red-200 p-3 text-sm text-red-700">{error}{view === 'list' && <Button variant="outline" className="mt-3 block" onClick={() => setReload((value) => value + 1)}>Try again</Button>}</div>}
      {loading ? <p role="status">Loading trusted contact…</p> : view === 'list' ? <>
        {!error && (contact ? <div className="space-y-3 rounded-[16px] border border-[#dee2e8] p-4"><button type="button" onClick={edit} className="w-full text-left"><strong className="block text-sm">{contact.name}</strong><span className="mt-2 block text-xs text-[#626d7e]">{contact.phone}</span><span className="mt-2 block text-xs underline">Edit contact</span></button><a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`} className="inline-flex min-h-11 items-center text-sm font-semibold underline">Call trusted contact</a></div> : <p className="py-6 text-center text-sm text-[#647080]">No trusted contact saved yet.</p>)}
        {!error && <div className="flex gap-3"><Button variant="outline" className="min-h-12 flex-1 rounded-[14px] border-[#ff000d]" onClick={edit}>{contact ? 'Edit contact' : 'Add new contact'}</Button>{contact && <Button variant="outline" className="min-h-12 flex-1 rounded-[14px]" onClick={() => { setError(null); setView('remove'); }}>Remove contact</Button>}</div>}
        <Button className="min-h-12 w-full rounded-[14px] bg-[#ff000d] text-white" onClick={onClose}>Close</Button>
      </> : view === 'edit' ? <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void save({ name, phone }); }}>
        <div><Label htmlFor="trusted-contact-name">Full name</Label><Input id="trusted-contact-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required disabled={saving} className="mt-2 h-[53px] rounded-[13px] bg-[#f7f8fa] text-base" /></div>
        <div><Label htmlFor="trusted-contact-phone">Phone number</Label><Input id="trusted-contact-phone" type="tel" autoComplete="tel" placeholder="+263…" value={phone} onChange={(event) => setPhone(event.target.value)} required disabled={saving} className="mt-2 h-[53px] rounded-[13px] bg-[#f7f8fa] text-base" /></div>
        <div className="flex gap-3"><Button type="button" variant="outline" className="min-h-12 flex-1 rounded-[14px] border-[#ff000d]" disabled={saving} onClick={() => { setError(null); setView('list'); }}>Cancel</Button><Button type="submit" disabled={saving} className="min-h-12 flex-1 rounded-[14px] bg-[#ff000d]">{saving ? 'Saving…' : 'Save contact'}</Button></div>
      </form> : <><p className="rounded-[16px] border p-4 text-sm">Remove <strong>{contact?.name}</strong> ({contact?.phone})?</p><div className="flex gap-3"><Button variant="outline" disabled={saving} className="min-h-12 flex-1 rounded-[14px]" onClick={() => { setError(null); setView('list'); }}>Cancel</Button><Button disabled={saving} className="min-h-12 flex-1 rounded-[14px] bg-[#ff000d]" onClick={() => void save(null)}>{saving ? 'Removing…' : 'Remove contact'}</Button></div></>}
    </section>
  </ModalBottomSheet>;
}

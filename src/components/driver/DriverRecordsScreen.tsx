import type { ReactNode } from 'react';
import './DriverRecords.css';
export const RECORD_SCREENS = [
  ['verification', 'Driver Verification', '1349:282'], ['vehicle', 'Update Vehicle', '1365:242'],
  ['renew', 'Renew Vehicle Documents', '1365:278'], ['vehicle-review', 'Vehicle Update Review', '1367:278'],
  ['document-review', 'Document Review Status', '1367:322'], ['changes', 'Document Changes Requested', '1369:356'],
  ['resubmit', 'Resubmit Document', '1369:392'], ['rides', 'Ride History', '1373:140'],
  ['trip', 'Ride History Details', '1373:179'], ['parcels', 'Parcel History', '1373:218'],
] as const;
export type RecordsScreen = typeof RECORD_SCREENS[number][0];
export function RecordsShell({ screen, children, onBack, action, actionLabel, busy = false }: { screen: RecordsScreen; children: ReactNode; onBack: () => void; action?: () => void; actionLabel?: string; busy?: boolean }) {
  const definition = RECORD_SCREENS.find(row => row[0] === screen)!;
  const headerIcon = screen === 'verification' ? '1349-293' : screen === 'document-review' ? '1367-333' : screen === 'vehicle-review' ? '1367-289' : null;
  return <main className="driver-records" data-figma-node={definition[2]}><header><button aria-label="Back to Profile" disabled={busy} onClick={onBack}><img src="/brand/driver-records/1478-259.svg" alt="" /></button><h1>{definition[1]}</h1><span aria-hidden="true" className={`grid h-8 w-8 shrink-0 place-items-center ${headerIcon ? 'rounded-xl bg-[#fff0f2]' : 'rounded-full bg-[#ff000d]'}`}>{headerIcon && <img src={`/brand/driver-records/${headerIcon}.svg`} alt="" />}</span></header><section className="dr-body">{children}</section><footer><button className="dr-button" disabled={busy} onClick={onBack}>Back to Profile</button>{action && <button className="dr-button dr-button-primary" disabled={busy} onClick={action}>{busy ? 'Saving…' : actionLabel}</button>}</footer></main>;
}
export function RecordsHero({ title, children, icon }: { title: string; children: ReactNode; icon?: string }) {
  return <div className="dr-hero">{icon && <img src={`/brand/driver-records/${icon}.svg`} alt="" />}<div><h2>{title}</h2><p>{children}</p></div></div>;
}
export function RecordsRows({ rows }: { rows: [string, ReactNode][] }) { return <dl className="dr-card">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd></div>)}</dl>; }
export function RecordsNote({ children }: { children: ReactNode }) { return <p className="dr-note">{children}</p>; }

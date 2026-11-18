import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import DriverWalletFrame, { walletAction } from '@/components/driver/DriverWalletFrame';

type Screen = {
  id: string;
  node: string;
  title: string;
  heading: string;
  subtitle: string;
  rows: [string, string][];
  action: string;
  next?: string;
  icons?: [string, string];
  caseLayout?: boolean;
};

const screens: Screen[] = [
  { id: 'received', node: '1367:506', title: 'Support Request Received', heading: 'Support request preview', subtitle: 'Example request awaiting submission', rows: [['Request reference', 'Assigned by support after submission'], ['Category', 'General driver support'], ['Status', 'Awaiting submission']], action: 'View Ticket Status', next: 'status', icons: ['IconSupport', 'status-0'] },
  { id: 'status', node: '1367:550', title: 'Support Ticket Status', heading: 'Your support requests', subtitle: 'Track updates from the CruiXe support team.', rows: [['Ticket number', 'Available after submission'], ['Current status', 'No live ticket loaded'], ['Last response', 'No new updates']], action: 'Contact Support', next: 'inbox', icons: ['IconClock', 'status-1'] },
  { id: 'inbox', node: '1369:428', title: 'Support Inbox', heading: 'Your support conversations', subtitle: 'Updates and replies from CruiXe support', rows: [['Open tickets', 'From your account'], ['Recent replies', 'No live messages loaded'], ['Response time', 'Varies by issue']], action: 'Open Conversation', next: 'conversation' },
  { id: 'conversation', node: '1369:464', title: 'Support Conversation', heading: 'Conversation with support', subtitle: 'Ticket messages and follow-ups', rows: [['Ticket status', 'Open · example'], ['Latest message', 'Awaiting support response'], ['Your reply', 'Sample reply']], action: 'Preview Reply', next: 'reply' },
  { id: 'reply', node: '1369:500', title: 'Support Reply Sent', heading: 'Your reply was prepared', subtitle: 'Support follow-up preview', rows: [['Message', 'Sample reply'], ['Delivery', 'Awaiting server acknowledgement'], ['Ticket', 'No live ticket loaded']], action: 'View Conversation', next: 'conversation' },
  { id: 'resolved', node: '1376:305', title: 'Support Ticket Resolved', heading: 'Issue marked resolved', subtitle: 'Review your support outcome and next steps.', rows: [['Ticket status', 'Resolved · example'], ['Resolution', 'Provided in the support reply'], ['Need more help?', 'Reopen a verified ticket']], action: 'Preview Reopen Ticket', next: 'reopen', caseLayout: true },
  { id: 'reopen', node: '1376:338', title: 'Reopen Support Ticket', heading: 'Need another review?', subtitle: 'Tell our team what still needs attention.', rows: [['Ticket reference', 'Select a resolved case'], ['Reason for reopening', 'Explain the remaining issue'], ['New evidence', 'Optional supporting details']], action: 'View Support Inbox', next: 'inbox', caseLayout: true },
  { id: 'appeal', node: '1369:536', title: 'Request Account Review', heading: 'Request account review', subtitle: 'Appeal a verification decision', rows: [['Decision', 'Choose a decision to appeal'], ['Explanation', 'Describe your concern'], ['Evidence', 'Attach supporting information']], action: 'Review Appeal', next: 'appeal-submitted' },
  { id: 'appeal-submitted', node: '1369:572', title: 'Account Review Submitted', heading: 'Review request preview', subtitle: 'Account appeal · example status', rows: [['Request ID', 'Assigned by the review service'], ['Status', 'Ready to submit'], ['Next step', 'Await the review response']], action: 'Driver Verification' },
  { id: 'cash-issue', node: '1376:371', title: 'Cash Issue Recorded', heading: 'Unpaid fare recorded', subtitle: 'Keep the receipt separate from unconfirmed cash.', rows: [['Ride status', 'Payment issue · example'], ['Paid receipt', 'Not issued'], ['Next step', 'Follow the payment dispute process']], action: 'View Fare Dispute', caseLayout: true },
];

const asset = '/brand/driver-support-review';

export default function DriverSupportScreenReview() {
  const [params, setParams] = useSearchParams();
  const [notice, setNotice] = useState('');
  const screen = screens.find(item => item.id === params.get('screen')) ?? screens[0];
  const select = (id: string) => { setNotice(''); setParams({ screen: id }); };
  const back = () => setNotice('Profile navigation is outside this sample review.');
  const next = () => {
    if (screen.next) select(screen.next);
    else setNotice('This action requires a connected Driver service. The sample made no request.');
  };
  return <>
    <aside className="mx-auto w-full max-w-[440px] space-y-2 bg-white p-4 text-sm">
      <p className="font-semibold">Driver support review · sample data only</p>
      <label className="block">Screen
        <select className="mt-1 block min-h-11 w-full rounded-lg border px-2" value={screen.id} onChange={event => select(event.target.value)}>
          {screens.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}
        </select>
      </label>
      {notice && <p role="status">{notice}</p>}
    </aside>
    <DriverWalletFrame frame={screen.node} title={screen.title} onBack={back}
      headerIcon={screen.icons ? <img src={`${asset}/${screen.icons[0]}.svg`} alt="" /> : <span className="size-7 rounded-full bg-primary" aria-hidden="true" />}
      footer={<div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={back} className="min-h-12 rounded-[14px] border border-primary px-2 text-sm font-semibold">Back to Profile</button>
        <button type="button" onClick={next} className={walletAction}>{screen.action}</button>
      </div>}>
      <section className="relative flex min-h-[94px] items-center gap-4 overflow-hidden rounded-[20px] border-t-[7px] border-[#161118] bg-primary px-6 py-4 text-white">
        {screen.caseLayout ? <span className="absolute -right-5 top-0 size-24 rounded-full bg-black/10" aria-hidden="true" /> : screen.icons ? <img src={`${asset}/${screen.icons[1]}.svg`} alt="" /> : <span className="w-9 shrink-0 text-center text-2xl" aria-hidden="true">✓</span>}
        <div className={screen.caseLayout ? 'relative flex-1 text-center' : 'relative'}>
          <h2 className="text-sm font-bold">{screen.heading}</h2>
          <p className="mt-4 text-[11px] leading-4">{screen.subtitle}</p>
        </div>
      </section>
      <h2 className="pb-1 pt-4 text-[17px] font-bold">{screen.caseLayout ? 'Case overview' : screen.icons ? 'Review details' : 'Details'}</h2>
      <dl className="divide-y divide-[#e4e7ed] rounded-[18px] border-l-[5px] border-[#161118] bg-white px-4">
        {screen.rows.map(([label, value]) => <div className="relative min-h-[77px] py-4 before:absolute before:-left-2 before:top-4 before:h-8 before:w-[3px] before:rounded before:bg-primary" key={label}>
          <dt className={`text-[11px] ${screen.caseLayout ? 'font-semibold' : 'text-[#667080]'}`}>{label}</dt>
          <dd className={`mt-2 ${screen.caseLayout ? 'text-[11px] text-[#667080]' : 'text-xs font-semibold'}`}>{value}</dd>
        </div>)}
      </dl>
      <div className="flex items-start gap-3 rounded-[18px] border-b-[5px] border-l-[5px] border-[#161118] bg-white px-4 py-4 text-[11px] leading-4 text-[#667080]">
        {screen.icons && <img src={asset + '/IconInfo.svg'} alt="" />}
        <p>Sample screen. Case status and follow-up will come from verified server records.</p>
      </div>
      {screen.id === 'status' && <button type="button" className="min-h-11 w-full rounded-[14px] border border-primary bg-white text-xs font-semibold" onClick={() => select('resolved')}>Preview Resolved Support Case</button>}
    </DriverWalletFrame>
  </>;
}

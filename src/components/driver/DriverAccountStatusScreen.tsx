import DriverExceptionLayout from './DriverExceptionLayout';

export default function DriverAccountStatusScreen({ status, reactivated, onBack, onHome }: {
  status: string | null;
  reactivated: boolean;
  onBack: () => void;
  onHome: () => void;
}) {
  const suspended = status === 'suspended';
  const restored = status === 'approved' && reactivated;
  const title = suspended ? 'Account Suspended' : restored ? 'Account Reactivated' : 'Account status';
  const requestReview = () => { window.location.href = 'mailto:support@pickme.co.zw?subject=Driver%20account%20review'; };
  return (
    <DriverExceptionLayout
      frameId={suspended ? '1373:452' : restored ? '1373:491' : undefined}
      title={title}
      heroTitle={suspended ? 'Your access is restricted.' : restored ? 'Account access restored.' : 'Your current account status.'}
      heroDescription={suspended ? 'Review your account status and available appeal options.' : restored ? 'Return to Driver Home after approved review.' : 'Review your current status and eligibility.'}
      rows={suspended ? [
        { label: 'Account state', value: 'Restricted' },
        { label: 'Reason', value: 'Contact support for authorized review details' },
        { label: 'Driving eligibility', value: 'Unavailable during restriction' },
      ] : [
        { label: 'Review status', value: status === 'approved' ? 'Approved' : status === 'pending' ? 'Pending review' : status === 'rejected' ? 'Changes requested' : 'Not confirmed' },
        { label: 'Driving access', value: 'Subject to eligibility checks' },
        { label: 'Next step', value: 'Review your current status' },
      ]}
      notice="Account status and driving eligibility must be confirmed by the platform before taking action."
      onBack={onBack}
      onProfile={onBack}
      primaryLabel={suspended ? 'Request Account Review' : 'Return to Driver Home'}
      onPrimary={suspended ? requestReview : onHome}
    />
  );
}

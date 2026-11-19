import type { RiderAccountFrame } from './riderAccountFrames';

type WalletFrame = RiderAccountFrame & { view?: 'pin' | 'balance' | 'transactions' };
const entry = (id: string, node: number, title: string, subtitle: string, content: Partial<WalletFrame>): WalletFrame =>
  ({ id, node: '285:' + node, title, subtitle, ...content });
const action = (label: string, next?: string) => ({ label, next });
const row = (heading: string, detail?: string, next?: string) => ({ heading, detail, next });
const rows = (...items: ReturnType<typeof row>[]) => [{ rows: items }];
const card = row('Digital CruiXe Wallet', 'Sample Rider · CRX •••• 4829');
const help = action('Get help', 'help');

function status(id: string, node: number, title: string, detail: string, note: string, next: ReturnType<typeof action>) {
  return entry(id, node, 'Top-up status', 'Example payment state · USD', {
    badge: title, hero: row('$20.00', detail), notice: row('Reference · CRX-TU-4829-1104', note), action: next, secondary: help,
  });
}

function refund(id: string, node: number, title: string, note: string, next: ReturnType<typeof action>) {
  return entry(id, node, 'Refund details', 'Track your refund · Example data', {
    badge: title, hero: row('+$4.50', title),
    sections: rows(row('Original transaction', 'Ride CRX-2026'), row('Original reference', 'CRX-RD-1102-1408'), row('Refund reference', 'CRX-RF-1102-1408')),
    notice: row('Refund status', note), action: next, secondary: action('View original transaction', 'transaction-details'),
  });
}

function transactions(id: string, node: number, title: string, note: string, next?: ReturnType<typeof action>) {
  return entry(id, node, 'Transactions', 'Your wallet activity, all in one place.', {
    view: 'transactions', hero: row(title, note), action: next,
  });
}

export const walletPreviewFrames: WalletFrame[] = [
  entry('activation', 34, 'Welcome to CruiXe Wallet', 'Your money, your rides.', {
    hero: card,
    sections: rows(row('One wallet. Every ride.', 'Keep your ride budget in one place.'), row('Top up your way', 'Choose an available payment method.'), row('Stay in control', 'Track payments, refunds and your balance.')),
    notice: row('Wallet Terms and Privacy Policy', 'Sample activation screen.'), action: action('Continue', 'set-pin'),
  }),
  ...([
    ['set-pin', 38, 'Set your wallet PIN', 'Create a 6-digit PIN to protect your wallet.', 'Set PIN', 'confirm-pin'],
    ['confirm-pin', 42, 'Confirm your PIN', 'Enter your new 6-digit PIN again.', 'Confirm PIN', 'security'],
    ['pin-mismatch', 46, 'PINs don’t match', 'Your confirmation must match your new PIN.', 'Try again', 'confirm-pin'],
  ] as const).map(([id, node, title, subtitle, label, next]) => entry(id, node, title, subtitle, {
    view: 'pin', notice: row('Never share your wallet PIN.', 'Recover access through verified account recovery.'), action: action(label, next),
  })),
  entry('add-money', 50, 'Add Money', 'Top up your wallet for your next ride.', {
    view: 'balance', hero: card, choice: { label: 'Amount to add', options: ['$20', '$5', '$10', '$50', 'Custom'] },
    sections: rows(row('Payment method · EcoCash', 'Illustrative payment method', 'topup-methods'), row('Illustrative fee', '$0.50'), row('Total payable', '$20.50 for the sample $20 top-up')),
    action: action('Review top-up', 'confirm-topup'),
  }),
  entry('confirm-topup', 54, 'Review your top-up', 'Check the details before you continue.', {
    hero: card, sections: rows(row('Amount to add', '$20.00'), row('Illustrative fee', '$0.50'), row('Total charge', '$20.50'), row('Payment method', 'EcoCash')),
    notice: row('Payment verification', 'Never share your wallet PIN with anyone.'), action: action('Confirm Top-Up', 'processing'), secondary: action('Back', 'add-money'),
  }),
  status('processing', 58, 'Processing', 'Processing · no credit yet', 'Keep this reference while waiting for confirmation.', action('Back to Wallet', 'transactions')),
  status('successful', 62, 'Successful', 'Completed · $20.00 added', 'Sample success requires verified backend confirmation in the live flow.', action('Back to Wallet', 'transactions')),
  status('pending', 66, 'Pending', 'Pending · no credit yet', 'Check the payment status before submitting another top-up.', action('View payment status', 'processing')),
  status('failed', 70, 'Failed', 'Failed · no credit added', 'If your provider shows a debit, get help before trying again.', action('Review and retry', 'confirm-topup')),
  entry('transactions', 74, 'Transactions', 'Your wallet activity, all in one place.', {
    view: 'transactions', sections: [{ heading: 'NOVEMBER 2026', rows: [
      row('Ride payment', '−$6.00 · Completed', 'transaction-details'), row('Refund', '+$4.50 · Pending', 'refund'),
      row('Top-up', '+$20.00 · Completed', 'successful'), row('Wallet adjustment', 'Example activity'),
    ] }], action: action('Get help with a transaction', 'help'),
  }),
  transactions('transactions-empty', 78, 'No activity this month', 'Try a different date range or add money for your next ride.', action('Add Money', 'add-money')),
  transactions('transactions-loading', 82, 'Loading your transactions…', 'Your balance is unchanged.'),
  transactions('transactions-error', 86, 'Couldn’t load activity', 'Check your connection and try again.', action('Try again', 'transactions-loading')),
  entry('transaction-details', 90, 'Transaction details', 'Your payment receipt · Example data', {
    hero: row('−$6.00', 'Ride payment'), sections: rows(row('Date and time', '04 Nov 2026 · 09:41'), row('Reference', 'CRX-RD-1104-0941'), row('Associated ride', 'Ride CRX-2048'), row('Payment method', 'CruiXe Wallet'), row('Fees', '$0.00'), row('Total paid', '$6.00')),
    notice: row('Share only what you need', 'PIN and full account information are excluded.'), action: action('Download receipt'), secondary: action('Share receipt'),
  }),
  entry('security', 94, 'Wallet Security', 'Manage your PIN and account protection.', {
    hero: row('Stay protected', 'Keep recovery details up to date.'), sections: rows(row('Change PIN', undefined, 'set-pin'), row('Recover access', 'Verified account access is required.', 'help')),
    notice: row('CruiXe will never ask you to share your PIN.'), action: action('Back to Wallet', 'transactions'),
  }),
  entry('ride-payment', 98, 'Pay with CruiXe Wallet', 'Select your wallet for this ride.', {
    view: 'balance', hero: card, sections: rows(row('Estimated trip fare', '$6.00'), row('CruiXe Wallet selected')),
    notice: row('Review authorization before booking', 'No payment is completed at this step.'), action: action('Pay with CruiXe Wallet'), secondary: action('Add Money', 'add-money'),
  }),
  entry('insufficient', 102, 'Pay with CruiXe Wallet', 'Select your wallet for this ride.', {
    view: 'balance', hero: card, sections: rows(row('Estimated trip fare', '$6.00'), row('CruiXe Wallet selected')),
    notice: row('Add at least $4.00 to continue', 'Your available balance is below the estimated fare.'), action: action('Add Money', 'add-money'), secondary: action('Choose another payment method'),
  }),
  refund('refund', 106, 'Pending', 'Funds are not available yet. Track the reference before submitting another request.', action('Get help with refund', 'help')),
  refund('refund-completed', 110, 'Completed', 'Sample credited amount. Live refunds require backend confirmation.', action('View wallet activity', 'transactions')),
  refund('refund-failed', 114, 'Failed', 'The refund was not credited. Contact support with the reference.', action('Get help with refund', 'help')),
  entry('help', 118, 'Wallet Help', 'Let’s get your wallet back on track.', {
    hero: row('How can I help?', 'Choose a topic to find the right support.'),
    choice: { options: ['Missing top-up', 'Failed payment', 'Unexpected charge', 'Refund question', 'PIN problem', 'Suspicious activity'] },
    notice: row('Never send your PIN, password or one-time code.'), action: action('Contact support'),
  }),
  entry('topup-methods', 600, 'Payment method', 'Choose how to fund your wallet.', {
    sections: rows(...['EcoCash', 'OneMoney', 'InBucks', 'Bank card'].map(label => row(label, 'Illustrative payment method', 'add-money'))),
    notice: row('Example providers', 'Availability and verification depend on your region and provider.'), action: action('Back', 'add-money'),
  }),
];

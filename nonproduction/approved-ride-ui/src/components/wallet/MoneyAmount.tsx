interface MoneyAmountProps {
  /** Decimal major units, already normalized by walletApi; never minor units. */
  amount: number | string;
  currency?: string | null;
  className?: string;
}

/** Legacy frontend wallet endpoints settle in USD; preserve metadata when supplied. */
export default function MoneyAmount({ amount, currency = 'USD', className }: MoneyAmountProps) {
  const value = Number(amount);
  const code = typeof currency === 'string' ? currency.trim().toUpperCase() || 'USD' : 'USD';
  const magnitude = Math.abs(value).toFixed(2);
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  const direction = value > 0 ? 'Credit ' : value < 0 ? 'Debit ' : '';
  const symbol = code === 'USD' ? '$' : `${code} `;

  return (
    <span className={className}>
      <span aria-hidden="true">{sign}{symbol}{magnitude}</span>
      <span className="sr-only">{direction}{code} {magnitude}</span>
    </span>
  );
}

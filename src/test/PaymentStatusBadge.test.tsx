import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PaymentStatusBadge from '@/components/ride/PaymentStatusBadge';
describe('cash payment status', () => {
  it('does not label a completed but uncollected cash ride paid', () => {
    render(<PaymentStatusBadge status="completed" paymentMethod="cash" />);
    expect(screen.queryByText('Payment Successful')).not.toBeInTheDocument();
    expect(screen.getByText('Payment pending confirmation')).toBeInTheDocument();
  });
  it('labels cash paid only after driver acknowledgement', () => {
    render(<PaymentStatusBadge status="completed" paymentMethod="cash" driverCollectedAt="2026-11-11T12:00:00Z" />);
    expect(screen.getByText('Payment Successful')).toBeInTheDocument();
  });
});

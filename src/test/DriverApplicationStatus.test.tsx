import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ApplicationStatus from '@/components/driver/ApplicationStatus';

afterEach(cleanup);
const vehicleInfo = { make: 'Toyota', model: 'Aqua', year: 2020, plateNumber: 'ABC123', type: 'economy' };
const documentsStatus = { total: 7, approved: 5, pending: 1, rejected: 1 };

describe('Live driver application outcomes', () => {
  it('does not mask rejected current documents with an approved profile', () => {
    render(<ApplicationStatus status="approved" vehicleInfo={vehicleInfo} documentsStatus={documentsStatus} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Changes requested' })).toBeInTheDocument();
    expect(screen.queryByText("You're verified!")).not.toBeInTheDocument();
    expect(screen.getByText('1 current document(s) require attention.')).toBeInTheDocument();
    expect(screen.queryByText(/ID photo unclear/)).not.toBeInTheDocument();
  });
  it('keeps suspension above document corrections', () => {
    render(<ApplicationStatus status="suspended" vehicleInfo={vehicleInfo} documentsStatus={documentsStatus} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Account suspended' })).toBeInTheDocument();
  });
  it('does not claim absent documents were submitted', () => {
    const onReview = vi.fn();
    render(<ApplicationStatus status="pending" vehicleInfo={vehicleInfo} documentsStatus={{ total: 0, approved: 0, rejected: 0, pending: 0 }} onReview={onReview} />);
    expect(screen.getByText('Your application is saved. Add documents for review.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Review application' }));
    expect(onReview).toHaveBeenCalledOnce();
    expect(screen.queryByText('Preview approved')).not.toBeInTheDocument();
  });
  it('wires real back and approved continuation actions without changing availability', () => {
    const onBack = vi.fn();
    const onContinue = vi.fn();
    render(<ApplicationStatus status="approved" vehicleInfo={vehicleInfo} documentsStatus={{ total: 7, approved: 7, rejected: 0, pending: 0 }} onBack={onBack} onContinue={onContinue} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to Driver' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to Welcome' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onContinue).toHaveBeenCalledOnce();
    expect(screen.getByText('Approval follows document review. Availability is checked separately.')).toBeInTheDocument();
  });
});

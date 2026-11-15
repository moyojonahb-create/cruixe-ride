import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ update: vi.fn(), document: vi.fn(), upload: vi.fn(), receipt: vi.fn(), refresh: vi.fn() }));
vi.mock('@/lib/businessApi', () => ({ updateMyDriver: mocks.update, createDriverDocument: mocks.document }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { storage: { from: () => ({ upload: mocks.upload }) } } }));
vi.mock('@/components/ride/TripReceiptButton', () => ({ openTripReceipt: mocks.receipt, refreshTripReceiptPayment: mocks.refresh }));
import DriverRecords, { currentDocuments, type RecordProfile } from '@/components/driver/DriverRecords';
import DriverHistoryScreens, { historyPayment, type HistoryTrip } from '@/components/driver/DriverHistoryScreens';
const profile: RecordProfile = { id: 'driver-row', status: 'pending', vehicle_make: 'Toyota', vehicle_model: 'Aqua', vehicle_color: 'White', plate_number: 'ABC123', vehicle_type: 'economy' };
const trip: HistoryTrip = { id: 'ride-one', pickup_address: 'CBD', dropoff_address: 'Hillside', fare: 5, status: 'completed', created_at: '2026-11-15T12:00:00Z', vehicle_type: 'economy', payment_method: 'cash', driver_collected_at: null, wallet_paid: false, payment_failed: false, distance_km: 3, duration_minutes: 10 };
beforeEach(() => { vi.clearAllMocks(); mocks.update.mockResolvedValue({ success: true }); mocks.document.mockResolvedValue({ id: 'new-document' }); mocks.upload.mockResolvedValue({ error: null }); mocks.receipt.mockResolvedValue(undefined); });
afterEach(cleanup);
const props = { profile, documents: [], userId: 'auth-user', onBack: vi.fn() };
describe('Driver records', () => {
  it('only uses the newest submission for each document type', () => {
    expect(currentDocuments([{ id: 'old', document_type: 'license', status: 'approved', created_at: '2025-01-01' }, { id: 'new', document_type: 'license', status: 'pending', created_at: '2026-01-01' }]).map(doc => doc.id)).toEqual(['new']);
  });
  it('does not invent verification for absent documents', () => {
    render(<DriverRecords {...props} />);
    expect(screen.getAllByText('Not submitted')).toHaveLength(2);
    expect(screen.getByText('0 of 2 approved')).toBeInTheDocument();
  });
  it('saves supported vehicle fields without approval or category writes', async () => {
    render(<DriverRecords {...props} initialScreen="vehicle" />);
    fireEvent.change(screen.getByLabelText('Vehicle model'), { target: { value: '  Vitz  ' } });
    fireEvent.click(screen.getByText('Save Changes'));
    await screen.findByText('Vehicle details saved');
    expect(mocks.update).toHaveBeenCalledWith({ vehicle_make: 'Toyota', vehicle_model: 'Vitz', plate_number: 'ABC123', vehicle_color: 'White' });
  });
  it('retains values and allows retry after vehicle save failure', async () => {
    mocks.update.mockRejectedValueOnce(new Error('Try later'));
    render(<DriverRecords {...props} initialScreen="vehicle" />);
    fireEvent.click(screen.getByText('Save Changes')); await screen.findByRole('alert');
    expect(screen.getByLabelText('Vehicle model')).toHaveValue('Aqua');
    fireEvent.click(screen.getByText('Save Changes')); await screen.findByText('Vehicle details saved');
  });
  it('blocks duplicate saves while a request is pending', async () => {
    let finish!: (value: unknown) => void;
    mocks.update.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    render(<DriverRecords {...props} initialScreen="vehicle" />);
    const form = screen.getByLabelText('Vehicle model').closest('form')!;
    fireEvent.submit(form); fireEvent.submit(form);
    expect(mocks.update).toHaveBeenCalledTimes(1);
    finish({ success: true }); await screen.findByText('Vehicle details saved');
  });
  it('has no writes in preview', () => {
    render(<DriverRecords {...props} initialScreen="renew" preview />);
    fireEvent.click(screen.getByText('Submit for review'));
    expect(screen.getByRole('alert')).toHaveTextContent('Preview only');
    expect(mocks.upload).not.toHaveBeenCalled(); expect(mocks.document).not.toHaveBeenCalled();
  });
  it('keeps unsupported document fields unavailable', () => {
    render(<DriverRecords {...props} initialScreen="renew" />);
    expect(screen.getByLabelText('Document number')).toBeDisabled(); expect(screen.getByLabelText('Expiry date')).toBeDisabled();
  });
  it('uploads privately, uses Driver row ownership, and retries metadata without uploading again', async () => {
    mocks.document.mockRejectedValueOnce(new Error('Save unavailable'));
    render(<DriverRecords {...props} initialScreen="renew" />);
    const file = new File(['document'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Document upload'), { target: { files: [file] } });
    fireEvent.click(screen.getByText('Submit for review')); await screen.findByRole('alert');
    fireEvent.click(screen.getByText('Submit for review')); await screen.findByText('Document submitted for review');
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    expect(mocks.document).toHaveBeenLastCalledWith({ driver_id: 'driver-row', document_type: 'registration', file_url: expect.stringMatching(/^auth-user\/registration_.*\.pdf$/) });
    expect(screen.getByText('pending')).toBeInTheDocument();
  });
  it('replaces local pending state with the authoritative refreshed review', async () => {
    const view = render(<DriverRecords {...props} initialScreen="renew" />);
    fireEvent.change(screen.getByLabelText('Document upload'), { target: { files: [new File(['doc'], 'test.pdf', { type: 'application/pdf' })] } });
    fireEvent.click(screen.getByText('Submit for review')); await screen.findByText('Document submitted for review');
    view.rerender(<DriverRecords {...props} initialScreen="renew" documents={[{ id: 'new-document', document_type: 'registration', status: 'approved', created_at: '2026-01-01T00:00:00Z' }]} />);
    expect(screen.getByText('approved')).toBeInTheDocument();
    expect(screen.queryByText('pending')).not.toBeInTheDocument();
  });
  it('rejects unsupported upload types before storage', async () => {
    render(<DriverRecords {...props} initialScreen="renew" />);
    fireEvent.change(screen.getByLabelText('Document upload'), { target: { files: [new File(['x'], 'test.html', { type: 'text/html' })] } });
    fireEvent.click(screen.getByText('Submit for review')); await screen.findByRole('alert');
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
describe('Driver history', () => {
  it('cash stays pending despite completion or wallet flag', () => { expect(historyPayment({ ...trip, wallet_paid: true })).toBe(false); expect(historyPayment({ ...trip, driver_collected_at: '2026-11-15T12:15:00Z' })).toBe(true); });
  it('failed payment is never shown paid', () => { expect(historyPayment({ ...trip, driver_collected_at: '2026-11-15', payment_failed: true })).toBe(false); });
  it('separates parcels from rides and opens the selected record', async () => {
    render(<DriverHistoryScreens trips={[trip, { ...trip, id: 'parcel-two', vehicle_type: 'parcel', pickup_address: 'Montrose' }]} onBack={vi.fn()} />);
    expect(screen.queryByText(/Montrose/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Parcels')); fireEvent.click(screen.getByText('completed parcel'));
    expect(screen.getByText('parcel-two')).toBeInTheDocument();
    fireEvent.click(screen.getByText('View Receipt'));
    expect(mocks.receipt).toHaveBeenCalledWith(expect.objectContaining({ rideId: 'parcel-two', fare: 5, paymentConfirmed: false }), expect.any(Function));
    await waitFor(() => expect(screen.getByText('View Receipt')).not.toBeDisabled());
    await mocks.receipt.mock.calls[0][1](); expect(mocks.refresh).toHaveBeenCalledWith('parcel-two');
  });
  it('does not offer a receipt for cancelled trips', () => { render(<DriverHistoryScreens trips={[{ ...trip, status: 'cancelled' }]} initialScreen="trip" onBack={vi.fn()} />); expect(screen.queryByText('View Receipt')).not.toBeInTheDocument(); });
});

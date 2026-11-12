import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DriverRegistrationWizard from '@/components/driver/DriverRegistrationWizard';

const mocks = vi.hoisted(() => ({ upsert: vi.fn(), document: vi.fn(), upload: vi.fn(), invalidate: vi.fn(), navigate: vi.fn(), toast: vi.fn() }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { storage: { from: () => ({ upload: mocks.upload }) } } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'authenticated-driver' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/lib/businessApi', () => ({ upsertDriverApplication: mocks.upsert, createDriverDocument: mocks.document }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidate }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/components/CarLoadingSpinner', () => ({ default: () => <p>Saving application</p> }));
vi.mock('@/components/ui/form', () => ({ Form: ({ children }: { children: ReactNode }) => <>{children}</>, FormField: () => null, FormControl: () => null, FormItem: () => null, FormMessage: () => null }));
vi.mock('react-hook-form', () => ({ useForm: ({ defaultValues }: { defaultValues: Record<string, unknown> }) => {
  const values = 'firstName' in defaultValues ? { firstName: '  Tadiwa ', surname: ' Moyo ', dateOfBirth: '1990-01-01', gender: 'male' }
    : 'vehicleMake' in defaultValues ? { vehicleType: 'economy', vehicleMake: 'Toyota', vehicleModel: 'Aqua', vehicleYear: 2020, vehicleColor: 'White', plateNumber: 'ABC123' }
      : { licenseNumber: 'LIC123', licenseExpiry: '2030-01-01' };
  return { control: {}, trigger: vi.fn().mockResolvedValue(true), getValues: (name?: string) => name ? values[name as keyof typeof values] : values };
} }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.upsert.mockResolvedValue({ id: 'driver-row-id' });
  mocks.document.mockResolvedValue({ id: 'document-id' });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.invalidate.mockResolvedValue(undefined);
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:photo'), revokeObjectURL: vi.fn() });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function advanceToReview() {
  for (let step = 0; step < 6; step++) {
    const next = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(next);
    await waitFor(() => expect(next).not.toBeDisabled());
  }
  await screen.findByRole('button', { name: 'Submit' });
}

describe('Driver registration backend submission', () => {
  it('saves entered name through the existing protected upsert without sending approval or availability', async () => {
    const onSuccess = vi.fn();
    render(<DriverRegistrationWizard onSuccess={onSuccess} />);
    await advanceToReview();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(mocks.upsert).toHaveBeenCalledWith({ profile: { full_name: 'Tadiwa Moyo', gender: 'male' }, driver: { vehicle_type: 'economy', vehicle_make: 'Toyota', vehicle_model: 'Aqua', vehicle_year: 2020, vehicle_color: 'White', plate_number: 'ABC123', gender: 'male' } });
    expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ['driver-profile', 'authenticated-driver'] });
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Open your application to add documents for review.' }));
  });
  it('directs an actual storage failure to document recovery and reports it instead of claiming upload success', async () => {
    mocks.upload.mockResolvedValue({ error: new Error('upload unavailable') });
    const { container } = render(<DriverRegistrationWizard onSuccess={vi.fn()} />);
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [new File(['image'], 'portrait.jpg', { type: 'image/jpeg' })] } });
    await advanceToReview();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/driver/application'));
    expect(mocks.document).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Application submitted with warnings', variant: 'destructive' }));
  });
});

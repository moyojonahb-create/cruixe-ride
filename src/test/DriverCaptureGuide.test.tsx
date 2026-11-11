import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DriverCaptureGuide, { type DriverCaptureKind } from '@/components/driver/DriverCaptureGuide';

afterEach(cleanup);

const cases: Array<[DriverCaptureKind, string]> = [
  ['profile', 'Capture profile photo'],
  ['identity', 'Capture identity document'],
  ['licence', 'Capture driver licence'],
  ['documents', 'Capture vehicle documents'],
  ['vehicle', 'Capture vehicle photos'],
];

describe('CruiXe Driver capture guidance', () => {
  it.each(cases)('renders %s guidance and returns to the actual upload wizard', (kind, title) => {
    const onBack = vi.fn();
    render(<DriverCaptureGuide kind={kind} onBack={onBack} />);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByText('UPLOAD GUIDANCE')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to checklist' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('has a working accessible back arrow, not a decorative prototype link', () => {
    const onBack = vi.fn();
    render(<DriverCaptureGuide kind="identity" onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to upload checklist' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});

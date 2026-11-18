import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import DriverPreviewBatchReview from '@/pages/staging/DriverPreviewBatchReview';
import { driverPreviewBatch } from '@/lib/driverPreviewBatch';

vi.mock('@/components/NotificationCenter', () => ({ NotificationBell: () => null }));

afterEach(cleanup);

function open(id: string) {
  return render(<MemoryRouter initialEntries={['/staging/driver-migration-20?screen=' + id]}>
    <DriverPreviewBatchReview />
  </MemoryRouter>);
}

it('maps 20 unique deep links to their own Figma frames', () => {
  expect(new Set(driverPreviewBatch.map(frame => frame.id)).size).toBe(20);
  expect(new Set(driverPreviewBatch.map(frame => frame.node)).size).toBe(20);
  for (const frame of driverPreviewBatch) {
    const { container, unmount } = open(frame.id);
    expect(container.querySelector('[data-figma-node]')?.getAttribute('data-figma-node')).toBe(frame.node);
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    unmount();
  }
});

it('keeps student offer adjustments within the sample flow', () => {
  open('student-request');
  fireEvent.click(screen.getByRole('button', { name: 'Increase fare' }));
  fireEvent.click(screen.getByRole('button', { name: 'Accept $5.50' }));
  expect(screen.getByText('$5.50')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Rider accepts' }));
  expect(screen.getByText('$5.50')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Navigate to pickup' }));
  expect(screen.getByRole('status').textContent).toContain('No live request was made');
});

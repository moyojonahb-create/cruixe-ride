import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import RiderFeedbackReview from '@/pages/staging/RiderFeedbackReview';
import RiderBookingReview from '@/pages/staging/RiderBookingReview';
import RiderMessageReview from '@/pages/staging/RiderMessageReview';
import Batch20ScreenReview from '@/pages/staging/Batch20ScreenReview';
import ParcelBatch20Review from '@/pages/staging/ParcelBatch20Review';
import matrix from '../../docs/FIGMA-SCREEN-ACCEPTANCE-MATRIX.json';

vi.mock('@/components/NotificationCenter', () => ({ NotificationBell: () => null }));
afterEach(cleanup);

const routes = {
  '/staging/rider-feedback': RiderFeedbackReview,
  '/staging/rider-booking': RiderBookingReview,
  '/staging/rider-messages': RiderMessageReview,
  '/staging/figma-20': Batch20ScreenReview,
  '/staging/parcel-20': ParcelBatch20Review,
};

it('resolves the 57 Rider routes added to the ledger to their Figma nodes', () => {
  const rows = matrix.screens.filter(row => row.side === 'Main/Rider' && row.test_evidence.includes('src/test/RiderFeedbackReview.test.tsx'));
  expect(rows).toHaveLength(57);
  for (const row of rows) {
    const route = row.route_or_entry_point;
    const Page = routes[route.split('?')[0] as keyof typeof routes];
    const { container, unmount } = render(<MemoryRouter initialEntries={[route]}><Page /></MemoryRouter>);
    expect(container.querySelector('[data-figma-node]')?.getAttribute('data-figma-node')).toBe(row.figma_node_id);
    unmount();
  }
});

it('shows the cancellation confirmation before the sample completion', () => {
  render(<MemoryRouter initialEntries={['/staging/rider-feedback?screen=cancel-wait']}><RiderFeedbackReview /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel ride' }));
  expect(screen.getByRole('heading', { name: 'Confirm cancellation?' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel my ride' }));
  expect(screen.getByRole('heading', { name: 'Ride cancelled' })).toBeTruthy();
});

it('shows a prepared chat message without claiming real delivery', () => {
  render(<MemoryRouter initialEntries={['/staging/rider-messages?screen=chat-arrival-draft']}><RiderMessageReview /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Preview message' }));
  expect(screen.getByText('✓ Message visible in preview · not delivered')).toBeTruthy();
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import RiderJourneyReview from '@/pages/staging/RiderJourneyReview';
import matrix from '../../docs/FIGMA-SCREEN-ACCEPTANCE-MATRIX.json';

afterEach(cleanup);

function open(route: string) {
  return render(<MemoryRouter initialEntries={[route]}><RiderJourneyReview /></MemoryRouter>);
}

it('resolves all 60 remaining Rider frames and completes the Rider ledger', () => {
  const rider = matrix.screens.filter(row => row.side === 'Main/Rider');
  expect(rider).toHaveLength(168);
  expect(rider.every(row => row.react_components.length)).toBe(true);
  const frames = rider.filter(row => row.route_or_entry_point.startsWith('/staging/rider-journey?screen='));
  expect(frames).toHaveLength(60);
  expect(new Set(frames.map(row => row.route_or_entry_point)).size).toBe(60);
  for (const frame of frames) {
    const { container, unmount } = open(frame.route_or_entry_point);
    expect(container.querySelector('[data-figma-node]')?.getAttribute('data-figma-node')).toBe(frame.figma_node_id);
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    unmount();
  }
});

it('keeps the emergency dialer preview local', () => {
  open('/staging/rider-journey?screen=emergency-call');
  fireEvent.click(screen.getByRole('button', { name: 'Open emergency dialer' }));
  expect(screen.getByRole('status').textContent).toContain('No live request was made');
});

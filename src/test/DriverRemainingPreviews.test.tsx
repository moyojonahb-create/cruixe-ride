import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import ParcelBatch20Review from '@/pages/staging/ParcelBatch20Review';
import CommunicationBatch20Review from '@/pages/staging/CommunicationBatch20Review';
import matrix from '../../docs/FIGMA-SCREEN-ACCEPTANCE-MATRIX.json';

vi.mock('@/components/NotificationCenter', () => ({ NotificationBell: () => null }));
afterEach(cleanup);

const driverRows = matrix.screens.filter(row => row.side === 'Main/Driver');
const galleryRows = driverRows.filter(row => /^\/staging\/(parcel|communication)-20\?screen=/.test(row.route_or_entry_point));

it('maps every Driver frame and opens all 25 newly mapped gallery links', () => {
  expect(driverRows.filter(row => !row.react_components.length)).toEqual([]);
  expect(galleryRows).toHaveLength(25);
  for (const row of galleryRows) {
    const Page = row.route_or_entry_point.startsWith('/staging/parcel-20') ? ParcelBatch20Review : CommunicationBatch20Review;
    const { container, unmount } = render(<MemoryRouter initialEntries={[row.route_or_entry_point]}><Page /></MemoryRouter>);
    expect(container.querySelector('[data-figma-node]')?.getAttribute('data-figma-node')).toBe(row.figma_node_id);
    unmount();
  }
});

it('shows a sample mismatch in the reserved collection screen', () => {
  render(<MemoryRouter initialEntries={['/staging/parcel-20?screen=driver-collection-code']}><ParcelBatch20Review /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Test incorrect code' }));
  expect(screen.getByRole('status').textContent).toContain('the collection code did not match');
});

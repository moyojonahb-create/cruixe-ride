import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import RiderAccountReview from '@/pages/staging/RiderAccountReview';
import matrix from '../../docs/FIGMA-SCREEN-ACCEPTANCE-MATRIX.json';

afterEach(cleanup);

it('opens 30 Rider account and support frames at their corresponding ledger links', () => {
  const rows = matrix.screens.filter(row => row.side === 'Main/Rider' && row.route_or_entry_point.startsWith('/staging/rider-account?screen='));
  expect(rows).toHaveLength(30);
  expect(new Set(rows.map(row => row.route_or_entry_point)).size).toBe(30);
  for (const row of rows) {
    const { container, unmount } = render(<MemoryRouter initialEntries={[row.route_or_entry_point]}><RiderAccountReview /></MemoryRouter>);
    expect(container.querySelector('[data-figma-node]')?.getAttribute('data-figma-node')).toBe(row.figma_node_id);
    unmount();
  }
});

it('reviews deletion locally and does not request real credentials', () => {
  render(<MemoryRouter initialEntries={['/staging/rider-account?screen=privacy']}><RiderAccountReview /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /Delete account/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByRole('heading', { name: 'Verify account deletion' })).toBeTruthy();
  expect(screen.queryByLabelText('Password')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Continue securely' }));
  expect(screen.getByRole('status').textContent).toContain('No live request was made');
});

it('filters sample support cases and opens the selected case', () => {
  render(<MemoryRouter initialEntries={['/staging/rider-account?screen=support-cases']}><RiderAccountReview /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Resolved · 1' }));
  expect(screen.queryByText('Lost-item recovery')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Parcel delivery issue/ }));
  expect(screen.getByText("Your case has been resolved.")).toBeTruthy();
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import WalletPreviewReview from '@/pages/staging/WalletPreviewReview';
import matrix from '../../docs/FIGMA-SCREEN-ACCEPTANCE-MATRIX.json';

afterEach(cleanup);
function open(route: string) {
  return render(<MemoryRouter initialEntries={[route]}><WalletPreviewReview /></MemoryRouter>);
}

it('maps the final 23 Wallet frames and leaves no unmapped ledger rows', () => {
  expect(matrix.screens.filter(row => !row.react_components.length)).toEqual([]);
  const rows = matrix.screens.filter(row => row.route_or_entry_point.startsWith('/staging/wallet-review?screen='));
  expect(rows).toHaveLength(23);
  for (const row of rows) {
    const { container, unmount } = open(row.route_or_entry_point);
    expect(container.querySelector('[data-figma-node]')?.getAttribute('data-figma-node')).toBe(row.figma_node_id);
    unmount();
  }
});

it('walks through a sample top-up and keeps payment actions local', () => {
  open('/staging/wallet-review?screen=add-money');
  fireEvent.click(screen.getByRole('button', { name: 'Review top-up' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm Top-Up' }));
  expect(screen.getByRole('heading', { name: 'Top-up status' })).toBeTruthy();
  expect(screen.getByText('Processing · no credit yet')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Screen'), { target: { value: 'ride-payment' } });
  fireEvent.click(screen.getByRole('button', { name: 'Pay with CruiXe Wallet' }));
  expect(screen.getByRole('status').textContent).toContain('No payment or account request was made');
});

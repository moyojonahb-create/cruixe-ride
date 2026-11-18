import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import DriverSupportScreenReview from '@/pages/staging/DriverSupportScreenReview';

afterEach(cleanup);

it('renders ten unique Figma frames and keeps support navigation local to the review', () => {
  const { container } = render(<MemoryRouter><DriverSupportScreenReview /></MemoryRouter>);
  const picker = screen.getByRole('combobox');
  const options = Array.from(picker.querySelectorAll('option'));
  expect(options).toHaveLength(10);
  const nodes = options.map(option => {
    fireEvent.change(picker, { target: { value: option.value } });
    expect(screen.getByRole('heading', { name: option.textContent ?? '', level: 1 })).toBeInTheDocument();
    return container.querySelector('[data-figma-node]')?.getAttribute('data-figma-node');
  });
  expect(new Set(nodes).size).toBe(10);
  fireEvent.click(screen.getByRole('button', { name: 'View Fare Dispute' }));
  expect(screen.getByRole('status')).toHaveTextContent('The sample made no request');
  fireEvent.change(picker, { target: { value: 'conversation' } });
  fireEvent.click(screen.getByRole('button', { name: 'Preview Reply' }));
  expect(screen.getByRole('heading', { name: 'Support Reply Sent', level: 1 })).toBeInTheDocument();
});

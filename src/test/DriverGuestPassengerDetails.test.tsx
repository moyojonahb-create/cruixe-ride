import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DriverGuestPassengerDetails from '@/components/driver/DriverGuestPassengerDetails';

describe('Driver guest passenger details', () => {
  it('directs both contact actions to the assigned passenger', () => {
    render(<DriverGuestPassengerDetails name="Guest Rider" phone="+263 (77) 123-4567" />);
    expect(screen.getByText('Guest Rider')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Call passenger' }).getAttribute('href')).toBe('tel:+263771234567');
    expect(screen.getByRole('link', { name: 'Message passenger' }).getAttribute('href')).toBe('sms:+263771234567');
  });

  it('shows unavailable contact when an assigned passenger number cannot be used', () => {
    render(<DriverGuestPassengerDetails name="Guest Rider" phone="unavailable" />);
    expect(screen.getByText('Passenger contact unavailable')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });
});

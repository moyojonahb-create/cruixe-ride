import { describe, expect, it } from 'vitest';
import { authDestination, authEntryPath } from '@/lib/authDestination';

describe('authentication journey destination', () => {
  it('preserves Driver registration and active trip query/hash across account access', () => {
    expect(authDestination('/driver/register')).toBe('/driver/register');
    const trip = '/driver/ride/ride-123?view=pickup#details';
    const entry = new URL(authEntryPath('/auth', trip), 'https://cruixe.invalid');
    expect(authDestination(entry.searchParams.get('next'))).toBe(trip);
    expect(authEntryPath('/signup', '/driver')).toBe('/signup?next=%2Fdriver');
  });

  it.each([null, '', 'https://example.com', '//example.com', '/\\example.com', '/\n/example.com', '/auth?next=/driver', '/signup', '/reset-password', '/login'])('rejects unsafe or looping destination %s', (value) => {
    expect(authDestination(value)).toBe('/ride');
  });

  it('normalizes paths before rejecting authentication loops', () => {
    expect(authDestination('/driver/../auth')).toBe('/ride');
  });
});

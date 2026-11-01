import { describe, expect, it } from 'vitest';
import { acceptLocationSample, canShowLocationEta, locationFeedState, locationStatusCopy, type DriverLocationSample } from '@/lib/driverLocationState';

const now = 1_000_000;
const sample = (age: number, sequence = now - age): DriverLocationSample => ({ lat: -17.8, lng: 31, observedAt: now - age, sequence });

describe('driver location confidence', () => {
  it('moves from live through delayed to stale using the server record age', () => {
    expect(locationFeedState(sample(5_000), true, false, now)).toBe('live');
    expect(locationFeedState(sample(45_000), true, false, now)).toBe('delayed');
    expect(locationFeedState(sample(100_000), true, false, now)).toBe('stale');
  });

  it('reports disconnect and reconnect states without discarding the last point', () => {
    expect(locationFeedState(sample(5_000), false, false, now)).toBe('disconnected');
    expect(locationFeedState(sample(5_000), false, true, now)).toBe('reconnecting');
    expect(locationStatusCopy('disconnected', sample(5_000), now)).toMatch(/last known position/i);
  });

  it('rejects an out-of-order sample and pauses stale ETAs', () => {
    const current = sample(5_000, 20);
    expect(acceptLocationSample(current, { ...sample(1_000), sequence: 19 })).toBe(current);
    expect(canShowLocationEta('delayed')).toBe(false);
    expect(canShowLocationEta('delayed', true)).toBe(true);
    expect(canShowLocationEta('stale')).toBe(false);
    expect(canShowLocationEta('disconnected')).toBe(false);
  });
});

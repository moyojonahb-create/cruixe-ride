import { describe, expect, it } from 'vitest';
import { acceptLocationSample, locationFeedState, type DriverLocationSample } from '@/lib/driverLocationState';
import { trustedRouteProgress } from '@/lib/routeProgress';

const now = 1_000_000;
const route: [number, number][] = [
  [31, -17.8],
  [31.01, -17.8],
];
const driver = { lat: -17.8, lng: 31.005 };
const sample = (age: number, sequence = now - age): DriverLocationSample => ({
  ...driver,
  observedAt: now - age,
  sequence,
});

describe('trusted in-trip route progress', () => {
  it('suppresses distance and ETA when the driver point is missing', () => {
    expect(trustedRouteProgress(route, null, 2, 10, 'connecting', true)).toBeNull();
  });

  it('suppresses distance and ETA without an authoritative GPS fix time', () => {
    expect(trustedRouteProgress(route, driver, 2, 10, 'live', false)).toBeNull();
  });

  it.each(['stale', 'disconnected', 'reconnecting'] as const)(
    'suppresses distance and ETA while the feed is %s',
    (state) => {
      expect(trustedRouteProgress(route, driver, 2, 10, state, true)).toBeNull();
    },
  );

  it('restores progress after reconnect only when a newer trusted sample is accepted', () => {
    const previous = sample(20_000, 20);
    const outOfOrder = sample(1_000, 19);
    const accepted = acceptLocationSample(previous, outOfOrder);

    expect(accepted).toBe(previous);
    expect(
      trustedRouteProgress(
        route,
        accepted,
        2,
        10,
        locationFeedState(accepted, false, true, now),
        true,
      ),
    ).toBeNull();

    const fresh = sample(1_000, 21);
    const reconnected = acceptLocationSample(accepted, fresh);
    const progress = trustedRouteProgress(
      route,
      reconnected,
      2,
      10,
      locationFeedState(reconnected, true, false, now),
      true,
    );

    expect(reconnected).toBe(fresh);
    expect(progress?.remainingKm).toBeGreaterThan(0);
    expect(progress?.minutes).toBeGreaterThan(0);
  });
});

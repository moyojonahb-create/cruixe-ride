export type DriverLocationFeedState = 'connecting' | 'live' | 'delayed' | 'stale' | 'disconnected' | 'reconnecting';

export interface DriverLocationSample {
  lat: number;
  lng: number;
  /** Server-maintained row timestamp. Heartbeats can update it, so this is not a GPS-fix timestamp. */
  observedAt: number;
  sequence: number;
}

export const LOCATION_DELAYED_AFTER_MS = 30_000;
export const LOCATION_STALE_AFTER_MS = 90_000;

export function locationFeedState(sample: DriverLocationSample | null, connected: boolean, reconnecting: boolean, now = Date.now()): DriverLocationFeedState {
  if (reconnecting) return 'reconnecting';
  if (!connected) return sample ? 'disconnected' : 'connecting';
  if (!sample) return 'connecting';
  const age = Math.max(0, now - sample.observedAt);
  if (age >= LOCATION_STALE_AFTER_MS) return 'stale';
  if (age >= LOCATION_DELAYED_AFTER_MS) return 'delayed';
  return 'live';
}

export function acceptLocationSample(current: DriverLocationSample | null, incoming: DriverLocationSample): DriverLocationSample {
  return !current || incoming.sequence > current.sequence ? incoming : current;
}

export function locationStatusCopy(state: DriverLocationFeedState, sample: DriverLocationSample | null, now = Date.now()): string {
  if (state === 'connecting') return 'Connecting to driver location…';
  if (state === 'reconnecting') return 'Reconnecting to driver location…';
  if (state === 'disconnected') return 'Location connection lost. Showing the last known position.';
  if (!sample) return 'Waiting for driver location…';
  const seconds = Math.max(0, Math.floor((now - sample.observedAt) / 1000));
  if (state === 'live') return 'Driver location connected · GPS fix time unavailable';
  if (state === 'delayed') return `Location record delayed · ${seconds}s since server activity`;
  return `Location record may be out of date · ${Math.max(1, Math.floor(seconds / 60))} min since server activity`;
}

export function canShowLocationEta(state: DriverLocationFeedState, hasAuthoritativeGpsFixTime = false): boolean {
  return hasAuthoritativeGpsFixTime && (state === 'live' || state === 'delayed');
}

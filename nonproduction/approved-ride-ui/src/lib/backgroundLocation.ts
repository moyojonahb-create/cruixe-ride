/**
 * Driver location tracking that survives screen lock.
 *
 * WHAT THIS REPLACES
 * ------------------
 * `DriverDashboard.tsx` tracked with:
 *
 *     setInterval(() => navigator.geolocation.getCurrentPosition(handlePos), 10_000)
 *
 * Android suspends a WebView's JS timers when the screen locks, so the interval
 * stops firing and location updates stop with it. The rider watches a frozen car
 * mid-trip, and the driver has no indication anything is wrong. The 30s presence
 * heartbeat alongside it dies the same way, so a locked driver also stops being
 * *considered* online by dispatch.
 *
 * That is not a WebView limitation — it is a limitation of using a browser API
 * for a background job. Transistorsoft's plugin runs an Android foreground
 * service and an iOS background-location session in native code, outside the
 * JS runtime's lifecycle. Events are delivered to JS when it is alive and
 * queued natively when it is not.
 *
 * THE WEB PATH IS NOT REMOVED
 * ---------------------------
 * The Vercel dashboard runs in real Chrome, where `navigator.geolocation` is
 * the only option and the tab is foregrounded anyway. So this module keeps both
 * transports behind one entry point rather than scattering
 * `Capacitor.isNativePlatform()` across screens. See DIVERGENCE-005.
 *
 * POSTING STAYS IN `driverLocation.ts`
 * ------------------------------------
 * The plugin can POST positions itself (`http.url`), and it is tempting. It is
 * not used, because `updateDriverLocation()` already owns the ~5m movement
 * threshold, the 25s max-silence rule that keeps the backend's 60s expiry
 * alive, and Go backend auth. Duplicating that natively would mean two
 * implementations of the same dedup policy drifting apart, and the native one
 * would be invisible to the browser devtools that everyone debugs with.
 */

import { Capacitor } from '@capacitor/core';

export interface TrackedPosition {
  lat: number;
  lng: number;
  /** Metres, when the platform reports it. */
  accuracy: number | null;
  /**
   * True when the fix came from a stationary heartbeat rather than movement.
   *
   * Callers MUST NOT throttle presence refresh on these. The heartbeat is the
   * floor guarantee; see PRESENCE TIMING above for why throttling it silently
   * halves the safety margin.
   */
  isHeartbeat: boolean;
}

export interface TrackingHandle {
  stop: () => Promise<void>;
  /** 'native' when the OS foreground service is driving this, 'web' otherwise. */
  transport: 'native' | 'web';
}

const WEB_INTERVAL_MS = 10_000;

/** Target seconds between fixes. Matches the interval the web path used. */
const NATIVE_UPDATE_INTERVAL_MS = 10_000;

/**
 * PRESENCE TIMING — four numbers in one relationship. Change them together.
 *
 * The invariant, stated once so the next person tuning one of these can see
 * what they are about to break:
 *
 *     effective presence refresh  <  BACKEND_PRESENCE_EXPIRY_MS, with margin
 *
 * `BACKEND_PRESENCE_EXPIRY_MS` is not ours — the Go backend expires the Redis
 * presence key after 60s and dispatch stops considering the driver. Everything
 * else is sized against it.
 *
 * The trap, because it already caught us once: a throttle window T applied to
 * events arriving every I, where I < T < 2I, does NOT yield a refresh every T.
 * It collapses to 2I —
 *
 *     t=0 write · t=25 dropped · t=50 write · t=75 dropped · t=100 write
 *
 * A 30s throttle over a 25s heartbeat therefore gives a 50s effective refresh
 * against a 60s expiry: a 1.2x margin, not the 2x the numbers imply. One slow
 * POST and a stationary driver drops out of dispatch. Worse, it only bites the
 * *stationary* driver — a moving one emits onLocation far more often — so it
 * passes every walking test and fails a driver parked at a rank.
 *
 * The resolution: **onHeartbeat is never throttled.** Its only purpose is to
 * guarantee a floor on refresh rate; throttling it defeats that purpose
 * entirely. Only the onLocation stream is throttled, because only it can flood.
 */
const BACKEND_PRESENCE_EXPIRY_MS = 60_000;

/** Heartbeat cadence. Fires regardless of motion; carries no location itself. */
const HEARTBEAT_SECONDS = 25;

/**
 * Max age of a cached fix before a heartbeat pays for a fresh one. Sized under
 * the backend expiry: fresher than this is still worth reporting, older would
 * be reporting a position we know to be wrong.
 */
const STALE_FIX_MS = 45_000;

/**
 * Throttle for the onLocation stream only — NOT applied to heartbeats.
 *
 * A driver in traffic emits every 10s; presence does not need that rate. This
 * caps the POST rate while the heartbeat independently guarantees the floor.
 */
export const PRESENCE_LOCATION_THROTTLE_MS = 30_000;

/** Exported so callers can assert the margin rather than re-deriving it. */
export const PRESENCE_TIMING = {
  backendExpiryMs: BACKEND_PRESENCE_EXPIRY_MS,
  heartbeatSeconds: HEARTBEAT_SECONDS,
  staleFixMs: STALE_FIX_MS,
  locationThrottleMs: PRESENCE_LOCATION_THROTTLE_MS,
} as const;

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Starts tracking and returns a handle. Never throws — a driver whose tracking
 * fails to start must still be able to use the dashboard, and the caller
 * decides how loudly to complain.
 */
export async function startDriverLocationTracking(opts: {
  onLocation: (pos: TrackedPosition) => void;
  /** Called if the platform refuses permission, so the UI can explain itself. */
  onPermissionDenied?: () => void;
}): Promise<TrackingHandle> {
  if (isNative()) {
    try {
      return await startNative(opts);
    } catch (error) {
      // Falling back rather than failing: a driver tracked badly is better than
      // a driver not tracked at all. Logged loudly because it means the native
      // path is broken and the whole point of this module is defeated.
      console.error('[BackgroundLocation] native start failed, falling back to web', error);
      return startWeb(opts);
    }
  }
  return startWeb(opts);
}

// ── native ───────────────────────────────────────────────────────────────────

async function startNative(opts: {
  onLocation: (pos: TrackedPosition) => void;
  onPermissionDenied?: () => void;
}): Promise<TrackingHandle> {
  // Dynamic import so the web bundle never pulls the plugin in. Every other
  // native plugin in this app is loaded the same way (see `nativeBridge.ts`).
  const { default: BackgroundGeolocation } = await import(
    '@transistorsoft/capacitor-background-geolocation'
  );

  // Last fix we actually delivered, so a heartbeat can replay it instead of
  // waking the GPS. Held per-session; cleared when tracking stops.
  let lastKnown: { pos: Omit<TrackedPosition, 'isHeartbeat'>; at: number } | null = null;

  const emit = (pos: Omit<TrackedPosition, 'isHeartbeat'>, isHeartbeat: boolean) => {
    lastKnown = { pos, at: Date.now() };
    opts.onLocation({ ...pos, isHeartbeat });
  };

  const subs = [
    BackgroundGeolocation.onLocation(
      (location) => {
        emit(
          {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            accuracy: location.coords.accuracy ?? null,
          },
          Boolean((location as unknown as { is_heartbeat?: boolean }).is_heartbeat),
        );
      },
      (error) => {
        // Error code 1 is permission-denied in this plugin's vocabulary.
        if (Number(error) === 1) opts.onPermissionDenied?.();
        console.warn('[BackgroundLocation] onLocation error', error);
      },
    ),

    // With a distanceFilter set, a stationary driver produces no onLocation
    // events at all. Without this, a driver waiting at a rank looks identical
    // to a driver whose tracking has died — and the backend expires their
    // location after 60s, so they would silently drop out of dispatch.
    //
    // onHeartbeat fires regardless of motion state and carries NO location, so
    // something has to supply coordinates. The obvious move is
    // getCurrentPosition() on every beat; that is wrong. It wakes the GPS chip
    // every 25s on a phone that is not moving, to learn a position we already
    // know, and a driver who notices this app eating their battery uninstalls
    // it — after which no amount of correct dispatch logic matters.
    //
    // So: replay the last known fix, and only pay for a real one when that fix
    // has gone stale enough that reporting it would be a lie.
    BackgroundGeolocation.onHeartbeat(async () => {
      const cached = lastKnown;
      const fresh = cached !== null && Date.now() - cached.at < STALE_FIX_MS;

      if (fresh) {
        opts.onLocation({ ...cached.pos, isHeartbeat: true });
        return;
      }

      try {
        const current = await BackgroundGeolocation.getCurrentPosition({
          samples: 1,
          timeout: 10,
        });
        emit(
          {
            lat: current.coords.latitude,
            lng: current.coords.longitude,
            accuracy: current.coords.accuracy ?? null,
          },
          true,
        );
      } catch {
        // A heartbeat that cannot get a fix is not fatal; the next one may.
        // Deliberately not replaying a stale fix here — a position we know to
        // be old is worse than no position, because dispatch would route on it.
      }
    }),
  ];

  // v9 uses the nested Config domains shared with the React Native v5 package
  // (@transistorsoft/background-geolocation-types). A flat v4-shaped object
  // does not type-check, and if forced through would be silently ignored at
  // runtime — which would look exactly like the platform failing.
  await BackgroundGeolocation.ready({
    geolocation: {
      desiredAccuracy: BackgroundGeolocation.DesiredAccuracy.High,
      distanceFilter: 10,
      locationUpdateInterval: NATIVE_UPDATE_INTERVAL_MS,
      fastestLocationUpdateInterval: 5_000,
    },
    app: {
      // Must survive swipe-from-recents: a driver who clears their recents
      // list has not gone off shift.
      stopOnTerminate: false,
      startOnBoot: true,
      // Keeps stationary drivers distinguishable from dead tracking.
      heartbeatInterval: HEARTBEAT_SECONDS,
      notification: {
        title: 'CruiXe — you are online',
        text: 'Sharing your location so riders can see you',
        sticky: true,
      },
    },
    http: {
      // Posting stays in driverLocation.ts — see the module header.
      autoSync: false,
    },
    logger: {
      debug: false,
      logLevel: BackgroundGeolocation.LogLevel.Warning,
    },
  });

  await BackgroundGeolocation.start();

  return {
    transport: 'native',
    stop: async () => {
      lastKnown = null;
      subs.forEach((s) => s.remove());
      await BackgroundGeolocation.stop();
    },
  };
}

// ── web ──────────────────────────────────────────────────────────────────────

function startWeb(opts: {
  onLocation: (pos: TrackedPosition) => void;
  onPermissionDenied?: () => void;
}): TrackingHandle {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { transport: 'web', stop: async () => {} };
  }

  const emit = (pos: GeolocationPosition) =>
    opts.onLocation({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? null,
      isHeartbeat: false,
    });

  const onError = (err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) opts.onPermissionDenied?.();
  };

  navigator.geolocation.getCurrentPosition(emit, onError);
  const timer = setInterval(() => {
    navigator.geolocation.getCurrentPosition(emit, onError);
  }, WEB_INTERVAL_MS);

  return {
    transport: 'web',
    stop: async () => clearInterval(timer),
  };
}

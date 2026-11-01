/**
 * One notification call site, two transports.
 *
 * WHY THIS EXISTS
 * ---------------
 * `push.ts` is VAPID Web Push over a service worker. That works in the
 * **Vercel-deployed dashboard**, which runs in real Chrome, and cannot work in
 * the **packaged Android app**, because Android's WebView implements neither
 * the Push API nor service-worker push. So the app needs FCM via
 * `@capacitor/push-notifications`, and the dashboard needs `push.ts`.
 *
 * **`push.ts` is therefore not dead code and must not be deleted.** Deleting it
 * would silently remove working web-dashboard notifications — a regression with
 * no error and no failing test to catch it.
 *
 * WHY ONE MODULE RATHER THAN A CHECK PER SCREEN
 * ---------------------------------------------
 * The risk with two transports is not that one breaks; it is that a future
 * change to notification *semantics* — a new payload field, a permission-timing
 * rule, an opt-out — lands on one and misses the other. Scattering
 * `Capacitor.isNativePlatform()` across screens guarantees that eventually.
 * Every caller goes through the functions below, so the branch exists once.
 *
 * Call sites unified (the complete set at time of writing):
 *   - `src/components/NotificationCenter.tsx` — showLocalNotification
 *   - `src/components/ride/RideView.tsx`      — requestNotificationPermission,
 *                                               showLocalNotification
 *
 * See DIVERGENCE-005 in `packages/core/DIVERGENCE.md`.
 *
 * DESTINATION NOTE
 * ----------------
 * This belongs in `packages/core` so web and any future native client share it
 * literally rather than by convention. It is in `src/lib/` for now because the
 * web build has no alias for `@cruixe/core` — adding one means editing
 * `vite.config.ts` and `tsconfig.json`, both of which Lovable regenerates, and
 * an unresolved import there fails the whole build. Move it when the alias is
 * established deliberately.
 */

import { Capacitor } from '@capacitor/core';

export type NotificationTransport = 'fcm' | 'webpush' | 'none';

export interface LocalNotification {
  title: string;
  body: string;
  /** Routed to when the notification is tapped, e.g. `/driver/dashboard`. */
  url?: string;
  tag?: string;
}

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** Which transport this runtime will actually use. Safe to call anywhere. */
export function notificationTransport(): NotificationTransport {
  if (isNative()) return 'fcm';
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
    return 'webpush';
  }
  return 'none';
}

/**
 * Requests permission on whichever transport applies.
 *
 * Deliberately does **not** register for push as a side effect. On Android 13+
 * the permission dialog is one-shot: denied is effectively permanent short of
 * a trip to Settings, so *when* it is asked matters and belongs to the caller,
 * not to a registration helper.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    let status = await PushNotifications.checkPermissions();
    if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale') {
      status = await PushNotifications.requestPermissions();
    }
    return status.receive === 'granted';
  }

  const web = await import('@/lib/push');
  return web.requestNotificationPermission();
}

/**
 * Registers this device to receive push, returning the token where one exists.
 *
 * The FCM token must reach the backend or the device is registered with Google
 * and unknown to us — which looks like working push right up until the first
 * ride offer goes nowhere. `onToken` is required for that reason rather than
 * optional with a warning.
 */
export async function registerForPush(opts: {
  onToken: (token: string, platform: 'android' | 'ios' | 'web') => Promise<void> | void;
  onNotificationTap?: (data: Record<string, unknown>) => void;
  onNotificationReceived?: (n: LocalNotification) => void;
}): Promise<NotificationTransport> {
  if (isNative()) {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Listeners are attached before register() so a fast token cannot be
    // delivered before anything is listening for it.
    await PushNotifications.addListener('registration', (token) => {
      void opts.onToken(token.value, Capacitor.getPlatform() === 'ios' ? 'ios' : 'android');
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('[Notifications] FCM registration failed', err);
    });

    // Foreground delivery. Android does NOT draw a notification for a
    // foregrounded app, so without this the driver sees nothing while staring
    // at the screen — the case most likely to be dismissed as "push is broken".
    await PushNotifications.addListener('pushNotificationReceived', (n) => {
      opts.onNotificationReceived?.({
        title: n.title ?? 'CruiXe',
        body: n.body ?? '',
        tag: n.id,
      });
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      opts.onNotificationTap?.(action.notification.data ?? {});
    });

    await PushNotifications.register();
    return 'fcm';
  }

  const web = await import('@/lib/push');
  const ok = await web.enablePush();
  return ok ? 'webpush' : 'none';
}

export async function unregisterFromPush(): Promise<void> {
  if (isNative()) {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.removeAllListeners();
    return;
  }
  const web = await import('@/lib/push');
  await web.disablePush();
}

/**
 * Shows a notification originating locally rather than from the server.
 *
 * On native this currently forwards to the web implementation, which no-ops in
 * a WebView without service-worker support. Local scheduling needs
 * `@capacitor/local-notifications`, which is a separate plugin and a separate
 * native build — deliberately not pulled in here. Recorded so the gap is known
 * rather than discovered: in the packaged app, local notifications are silent.
 */
export async function showLocalNotification(n: LocalNotification): Promise<void> {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    // Android 13+ gates local notifications behind the same POST_NOTIFICATIONS
    // permission as push. Checked rather than assumed: a driver who granted
    // push has almost certainly granted this too, but "almost certainly" is how
    // an arrival announcement goes silently missing.
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const asked = await LocalNotifications.requestPermissions();
      if (asked.display !== 'granted') return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          // 32-bit int required; Date.now() overflows and is silently rejected.
          id: Math.floor(Math.random() * 2_147_483_647),
          title: n.title,
          body: n.body,
          // null schedule = deliver immediately.
          schedule: undefined,
          extra: n.url ? { url: n.url } : undefined,
        },
      ],
    });
    return;
  }

  const web = await import('@/lib/push');
  // Positional signature: (title, body, url). `tag` is generated inside push.ts
  // as `pickme-${Date.now()}` and cannot be supplied, so it is accepted here
  // for call-site symmetry and deliberately dropped rather than silently
  // pretended to work.
  web.showLocalNotification(n.title, n.body, n.url);
}

/**
 * Announces something the driver must act on, through every channel that can
 * actually reach them.
 *
 * Exists because arrival announcement was broken in a way that looked fine:
 * `useArrivalDetection` fires correctly, the ride transitions correctly, and
 * the rider is told — but the driver's two channels are a `sonner` toast
 * rendered into a DOM nobody is looking at, and `window.speechSynthesis`, which
 * a backgrounded WebView will not reliably speak. Detection was never the
 * broken half. Delivery was.
 *
 * The local notification is *added to* the toast and voice rather than
 * replacing them: on a foregrounded phone the existing channels are better —
 * immediate, and the driver is already looking at the screen.
 */
export async function announceToDriver(n: LocalNotification): Promise<void> {
  await showLocalNotification(n);
}

/**
 * DIVERGENCE-002's required mobile follow-up. This is not optional plumbing.
 *
 * A backgrounded React Native process has its JS timers suspended, so
 * supabase-js's auto-refresh never runs while the app is away. On resume the
 * socket reconnects against a session that may be hours stale, the server
 * rejects it, the socket closes, and the backoff loop retries with that same
 * dead token indefinitely. **The driver shows as online and silently receives
 * nothing, with no visible error.**
 *
 * There is no web equivalent of a suspended process, which is exactly why web
 * never surfaced this and why `reconnect()` versus `reconnectWithFreshToken()`
 * had to become an explicit choice in core rather than an inferred one.
 *
 * **Why this ships inside the increment rather than after it.** A stale-token
 * reconnect passes every desk test: on a foregrounded phone the token is fresh,
 * so `reconnect()` and `reconnectWithFreshToken()` are indistinguishable. It
 * only fails after real backgrounding, against a real expiry window. An
 * increment that omitted this would be green and wrong in production, which is
 * the worst combination available.
 */

import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { BackendSocketClient } from '@cruixe/core';

/**
 * Time backgrounded before a resume is treated as token-suspect.
 *
 * Zero would be defensible but wasteful: a Supabase access token lives an hour,
 * and forcing a refresh on every glance at the notification shade spends a
 * round trip to fix nothing. Thirty seconds is short enough that any absence
 * long enough to matter is caught, and long enough that app-switching is not.
 */
const STALE_AFTER_MS = 30_000;

export function useSocketForegroundResume(socket: BackendSocketClient | null) {
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handle = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        // 'inactive' fires on iOS for transient interruptions too (control
        // centre, an incoming call banner). Recording the first timestamp and
        // not overwriting it means a slide into 'background' keeps the earlier
        // mark rather than resetting the clock.
        backgroundedAt.current ??= Date.now();
        return;
      }

      if (next !== 'active') return;

      const since = backgroundedAt.current;
      backgroundedAt.current = null;
      if (since == null) return;

      if (Date.now() - since >= STALE_AFTER_MS) {
        // Forces a token refresh before reopening. Using plain reconnect()
        // here would reuse the cached token and reproduce the exact silent
        // failure DIVERGENCE-002 describes.
        socket.reconnectWithFreshToken();
      }
    };

    const sub = AppState.addEventListener('change', handle);
    return () => sub.remove();
  }, [socket]);
}

import { supabase } from "@/integrations/supabase/client";
import { authReady } from "@/lib/authReady";

// Auth circuit breaker. A 401 is not something retrying fixes, so after a few
// consecutive ones we stop dialling the backend for a short window and let
// callers fall through to their Supabase fallback immediately. Any success, or
// a fresh sign-in/token refresh, closes the breaker at once — the Go backend
// stays the primary path.
const AUTH_FAILURE_THRESHOLD = 3;
const AUTH_BREAKER_MS = 30_000;
let consecutiveAuthFailures = 0;
let authBreakerUntil = 0;

function closeAuthBreaker() {
  consecutiveAuthFailures = 0;
  authBreakerUntil = 0;
}

function noteAuthFailure() {
  consecutiveAuthFailures += 1;
  if (consecutiveAuthFailures >= AUTH_FAILURE_THRESHOLD) {
    authBreakerUntil = Date.now() + AUTH_BREAKER_MS;
  }
}

// A refresh failure is fatal (worth signing out) only when Supabase itself
// rejected the refresh token — a 4xx auth status (e.g. invalid_grant).
// Retryable fetch failures (AuthRetryableFetchError, status 0/missing, 5xx)
// mean the network is down, not the session: the rider keeps their session.
function isAuthRefreshFatal(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  const name = (error as { name?: string })?.name;
  if (name === "AuthRetryableFetchError") return false;
  if (!status || status === 0 || status >= 500) return false;
  return status >= 400 && status < 500;
}

// A new session or refreshed token is exactly the condition that makes the
// backend usable again — reopen immediately rather than waiting out the window.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
    closeAuthBreaker();
  }
});


export type GoBackendErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "WALLET_ERROR"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "BAD_RESPONSE"
  | "UNKNOWN";

export type GoRideCreateRequest = {
  pickup_address: string;
  dropoff_address: string;
  pickup_lat: number;
  pickup_lon: number;
  dropoff_lat: number;
  dropoff_lon: number;
  distance_km: number;
  duration_minutes: number;
  fare?: number;
  fare_minor?: number;
  estimated_fare_minor?: number;
  offered_fare_minor?: number;
  price_minor?: number;
  currency?: string;
  vehicle_type?: string;
  payment_method?: string;
  passenger_count?: number;
  scheduled_at?: string;
  town_id?: string | null;
  gender_preference?: string;
  route_polyline?: string | null;
  [key: string]: unknown;
};

export type GoRideResponse = {
  id?: string;
  ride_id?: string;
  ride?: Record<string, unknown>;
  ok?: boolean;
  reason?: string;
  [key: string]: unknown;
};

export type GoOfferCreateRequest = {
  ride_id?: string;
  price?: number;
  price_minor: number;
  offered_fare_minor?: number;
  offer_fare_minor?: number;
  eta_minutes?: number;
  message?: string | null;
  status?: string;
  [key: string]: unknown;
};

export type GoRideStatusRequest = {
  status: string;
  expected_status?: string;
};

export type GoDriverPresenceRequest = {
  is_online: boolean;
  latitude?: number;
  longitude?: number;
};

export type GoDriverLocationRequest = {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
};

export class GoBackendError extends Error {
  code: GoBackendErrorCode;
  status?: number;
  details?: unknown;

  constructor(message: string, code: GoBackendErrorCode, status?: number, details?: unknown) {
    super(message);
    this.name = "GoBackendError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// In local dev, the deployed backend's CORS allowlist rejects the
// localhost origin outright — every request fails before it even reaches
// the server. Route through Vite's dev-only proxy (see vite.config.ts)
// instead, which forwards server-to-server and isn't subject to browser
// CORS. Production builds are unaffected — import.meta.env.DEV is false.
const API_BASE_URL = import.meta.env.DEV
  ? "/go-api"
  : (import.meta.env.VITE_GO_BACKEND_URL ||
     import.meta.env.VITE_API_BASE_URL ||
     import.meta.env.VITE_BACKEND_URL ||
     "");

function resolveUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new GoBackendError("Go backend base URL is not configured", "BAD_RESPONSE");
  }
  const base = API_BASE_URL.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

function statusToCode(status: number): GoBackendErrorCode {
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 403) return "FORBIDDEN";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN";
}

function payloadToCode(payload: unknown, fallback: GoBackendErrorCode): GoBackendErrorCode {
  if (typeof payload !== "object" || !payload) return fallback;
  const rawCode = "code" in payload ? String((payload as { code?: unknown }).code) : "";
  const rawReason = "reason" in payload ? String((payload as { reason?: unknown }).reason) : "";
  const normalized = `${rawCode} ${rawReason}`.toLowerCase();
  if (normalized.includes("wallet") || normalized.includes("balance") || normalized.includes("insufficient_funds")) {
    return "WALLET_ERROR";
  }
  return fallback;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  // Wait for the Supabase client's first real session result before ever
  // reading a token — reading getSession() before that has settled can hand
  // back a not-yet-hydrated/stale session and send the request into a 401.
  await authReady;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    noteAuthFailure();
    throw new GoBackendError("Not authenticated", "UNAUTHENTICATED", 401);
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

// No request to the Go backend may hang indefinitely — a stalled DNS lookup,
// a blocked port, or a server that accepts the connection but never replies
// must fail fast into the Supabase fallback path instead of leaving the
// caller's await stuck forever (see requestRide.ts / isBackendUnavailable).
// Kept short deliberately: a fast failure with a retry affordance beats a
// long hang that just delays the same failure.
const REQUEST_TIMEOUT_MS = 8_000;

async function doFetch(method: string, path: string, headers: Record<string, string>, body?: unknown, externalSignal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  // A caller-provided signal (e.g. requestRide.ts's overall 30s budget)
  // aborts the fetch immediately rather than leaving it running in the
  // background after the caller has already given up — that's what let the
  // Promise.race loser silently keep going and create a duplicate ride.
  const signal = externalSignal ? AbortSignal.any([controller.signal, externalSignal]) : controller.signal;
  try {
    return await fetch(resolveUrl(path), {
      method,
      headers: {
        ...headers,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    const timedOut = (error as { name?: string })?.name === "AbortError";
    console.warn("[GoBackend] request failed", { method, path, timedOut, error: String(error) });
    throw new GoBackendError(
      timedOut ? "Backend request timed out" : "Network error while contacting backend",
      "NETWORK_ERROR",
      undefined,
      error
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function request<T>(method: string, path: string, body?: unknown, isRetry = false, signal?: AbortSignal): Promise<T> {
  if (Date.now() < authBreakerUntil) {
    // Skip the network entirely; callers treat UNAUTHENTICATED as
    // "backend unavailable" and use their Supabase fallback.
    throw new GoBackendError("Backend auth circuit open", "UNAUTHENTICATED", 401);
  }

  // Resolved outside the fetch try/catch below so an auth failure (no/expired
  // session) surfaces as UNAUTHENTICATED instead of being masked as a generic
  // network error.
  const headers = await authHeaders();

  const response = await doFetch(method, path, headers, body, signal);

  // The session looked valid client-side but the server rejected the token
  // (e.g. it expired between attach and receipt) — refresh once and retry
  // before surfacing an error, instead of failing a call that would have
  // succeeded a moment later.
  // NOTE: this branch does NOT count an auth failure. Whether the refresh
  // succeeded (retry, counts zero) or failed (falls through below), the
  // counting happens exactly once at the single choke point in the
  // !response.ok branch — double-counting here made the breaker open one
  // request early.
  if (response.status === 401 && !isRetry) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshed.session) {
      return request<T>(method, path, body, true, signal);
    }
    // The refresh token is genuinely invalid/expired (Supabase returned an
    // auth error, not a network one) — the session can never recover, so
    // sign out and let the auth guards redirect to /auth. Network-level
    // refresh failures leave the session alone so a rider on a weak
    // connection isn't logged out for it.
    if (refreshError && isAuthRefreshFatal(refreshError)) {
      await supabase.auth.signOut({ scope: "local" });
    }
  }


  const payload = await parseResponse(response);
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? String((payload as { error?: unknown }).error)
        : typeof payload === "object" && payload && "message" in payload
          ? String((payload as { message?: unknown }).message)
          : `Backend request failed with ${response.status}`;
    console.warn("[GoBackend] non-2xx response", { method, path, status: response.status, message });
    // Single auth-failure choke point: every terminal 401 — with or without a
    // failed refresh above — counts here exactly once, so the breaker opens
    // after AUTH_FAILURE_THRESHOLD genuinely failed requests.
    if (response.status === 401) {
      noteAuthFailure();
    }
    const fallbackCode = statusToCode(response.status);
    throw new GoBackendError(message, payloadToCode(payload, fallbackCode), response.status, payload);
  }

  closeAuthBreaker();
  return payload as T;
}


export const goBackend = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>("GET", path, undefined, false, signal),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>("POST", path, body, false, signal),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>("PATCH", path, body, false, signal),
  delete: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>("DELETE", path, body, false, signal),
};

export function getGoBackendBaseUrl(): string {
  return API_BASE_URL;
}

// Offer/bidding system helpers - RLS safe implementation
import { supabase } from '@/lib/supabaseClient';
import { resolveAvatarUrl } from '@/lib/avatarUrl';
import { getCached, setCache, invalidateCache } from '@/lib/queryCache';
import { goBackend, type GoOfferCreateRequest } from '@/lib/goBackendClient';
import { decimalToMinor } from '@/lib/money';
import { normalizeRideRow } from '@/lib/rideContract';
import { isGoBackendConfigured } from '@/lib/rideMatching';
import { authReady } from '@/lib/authReady';

export type Offer = {
  id: string;
  ride_id: string;
  driver_id: string;
  price: number;
  eta_minutes: number | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};

type GoOfferResponse = {
  id?: string;
  offer_id?: string;
  ride_id?: string;
  request_id?: string;
  driver_id: string;
  amount?: number;
  price?: number;
  fare?: number;
  offered_fare?: number;
  eta_minutes?: number | null;
  message?: string | null;
  status?: 'pending' | 'accepted' | 'rejected';
  created_at?: string;
};

function normalizeOffer(row: GoOfferResponse, rideId: string): Offer {
  const id = String(row.id ?? row.offer_id ?? "");
  if (!id) throw new Error("Offer response missing id");
  return {
    id,
    ride_id: String(row.ride_id ?? row.request_id ?? rideId),
    driver_id: row.driver_id,
    price: Number(row.price ?? row.amount ?? row.fare ?? row.offered_fare ?? 0),
    eta_minutes: row.eta_minutes ?? null,
    message: row.message ?? null,
    status: row.status ?? "pending",
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

export type DriverProfile = {
  id: string;
  user_id: string;
  status: string;
  vehicle_type: string | null;
  plate_number: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vehicle_photo_url: string | null;
  is_online: boolean | null;
  trial_ends_at: string | null;
  gender: string | null;
  avatar_url: string | null;
  rating_avg: number | null;
  total_trips: number | null;
  preferred_service_area?: string | null;
  created_at?: string;
  earning_notifications?: boolean;
  ecocash_number?: string | null;
};

// Round to nearest $0.50
export function roundTo5(n: number): number {
  return Math.round(Number(n) * 2) / 2;
}

export function clampTo5(n: number, min = 0.50, max = 500): number {
  const rounded = roundTo5(n);
  return Math.min(max, Math.max(min, rounded));
}

// Check if it's night time (after 20:00 or before 05:00)
export function isNightLocal(): boolean {
  const h = new Date().getHours();
  return h >= 20 || h < 5;
}

export function defaultNightMultiplier(): number {
  return isNightLocal() ? 1.2 : 1.0;
}

async function getUserOrThrow() {
  // getSession() reads the already-hydrated local session instead of making
  // a round trip to /auth/v1/user — that round trip was the head-of-line
  // blocker stalling getDriverProfile() (and everything sequenced after it
  // on the driver dashboard) for upwards of 14s. RLS still enforces the real
  // JWT server-side on every query, so this loses no security here.
  await authReady;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (!data?.session?.user) throw new Error("Please log in.");
  return data.session.user;
}

// Fetch pending offers for a ride (with LIMIT to prevent overload)
export async function fetchPendingOffers(rideId: string): Promise<Offer[]> {
  if (!isGoBackendConfigured()) throw new Error("Ride offers temporarily unavailable");
  try {
    const data = await goBackend.get<GoOfferResponse[]>(`/api/rides/${rideId}/offers`);
    return (data ?? []).slice(0, 50).map((offer) => normalizeOffer(offer, rideId));
  } catch (error) {
    throw error;
  }
}

// Fetch drivers by their user IDs, enriched with profile name
// OPTIMIZED: parallel avatar resolution instead of sequential
export async function fetchDriversByIds(driverIds: string[]): Promise<Record<string, DriverProfile & { full_name?: string | null }>> {
  if (driverIds.length === 0) return {};

  // Fetch drivers and profiles in parallel
  const [driversRes, profilesRes] = await Promise.all([
    supabase
      .from("drivers")
      .select("id, user_id, status, vehicle_type, plate_number, vehicle_make, vehicle_model, vehicle_color, is_online, trial_ends_at, gender, avatar_url, rating_avg, total_trips")
      .in("user_id", driverIds)
      .limit(driverIds.length),
    supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", driverIds)
      .limit(driverIds.length),
  ]);

  if (driversRes.error) throw new Error(driversRes.error.message);

  const nameMap: Record<string, string> = {};
  for (const p of (profilesRes.data ?? [])) {
    if (p.full_name) nameMap[p.user_id] = p.full_name;
  }

  // Resolve all avatars in parallel (was sequential — O(n) → O(1) latency)
  const driverRows = (driversRes.data ?? []) as DriverProfile[];
  const avatarPromises = driverRows.map((row) => resolveAvatarUrl(row.avatar_url));
  const resolvedAvatars = await Promise.all(avatarPromises);

  const map: Record<string, DriverProfile & { full_name?: string | null }> = {};
  driverRows.forEach((row, i) => {
    map[row.user_id] = { ...row, avatar_url: resolvedAvatars[i], full_name: nameMap[row.user_id] || null };
  });
  return map;
}

// Fetch open rides for drivers to bid on (only last 5 minutes)
// OPTIMIZED: added LIMIT 30 to cap returned rides at scale
export async function fetchOpenRides(driverGender?: string | null) {
  if (!isGoBackendConfigured()) throw new Error("Ride matching temporarily unavailable");
  const raw = (await goBackend.get<Record<string, unknown>[]>("/api/rides/open")) ?? [];
  const rides = raw.map((ride) => normalizeRideRow(ride));

  // Server-side filtering: hide female-only rides from male drivers
  if (driverGender && driverGender !== 'female') {
    return rides.filter((r: Record<string, unknown>) => {
      const gp = r.gender_preference as string | null;
      return !gp || gp === 'any';
    });
  }

  return rides;
}

// Get current driver profile (cached for 30s to reduce repeated calls)
export async function getDriverProfile(): Promise<DriverProfile | null> {
  const user = await getUserOrThrow();
  
  const cacheKey = `driver-profile-${user.id}`;
  const cached = getCached<DriverProfile>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("drivers")
    .select("id, user_id, status, vehicle_type, plate_number, vehicle_make, vehicle_model, vehicle_color, is_online, trial_ends_at, gender, avatar_url, rating_avg, total_trips, preferred_service_area, created_at, earning_notifications, ecocash_number")
    .eq("user_id", user.id)
    .maybeSingle();
  
  if (error) throw new Error(error.message);
  if (data) setCache(cacheKey, data, 30_000); // 30s TTL
  return data as DriverProfile | null;
}

// Drop the cached profile so the next getDriverProfile() call re-fetches
// instead of serving a stale copy. Call this right after writing something
// that changes the row (e.g. presence) — without it, a refresh triggered in
// the few seconds after that write can read the pre-write cache entry and
// silently stomp the state a caller just set (this is what made "go online"
// immediately flip back to offline: toggleOnline's own refresh() call was
// reading a still-cached is_online: false from before the toggle).
export async function invalidateDriverProfileCache(): Promise<void> {
  try {
    const user = await getUserOrThrow();
    invalidateCache(`driver-profile-${user.id}`);
  } catch {
    // Not signed in — nothing cached to invalidate.
  }
}

// Submit a new offer
export async function submitOffer(input: {
  ride_id: string;
  price: number;
  eta_minutes: number;
  message?: string;
}): Promise<Offer> {
  await getUserOrThrow();

  const payload: GoOfferCreateRequest = {
    ride_id: input.ride_id,
    price: input.price,
    price_minor: decimalToMinor(input.price),
    eta_minutes: input.eta_minutes,
    message: input.message || null,
  };

  if (!isGoBackendConfigured()) throw new Error("Ride offers temporarily unavailable");
  try {
    const data = await goBackend.post<GoOfferResponse | { offer: GoOfferResponse }>(`/api/rides/${input.ride_id}/offers`, payload);
    const offer = "offer" in data ? data.offer : data;
    return normalizeOffer(offer, input.ride_id);
  } catch (error) {
    throw error;
  }
}

// Decline an offer
export async function declineOffer(offerId: string, rideId?: string): Promise<void> {
  if (!isGoBackendConfigured()) throw new Error("Ride offers temporarily unavailable");
  const path = rideId
    ? `/api/rides/${rideId}/offers/${offerId}/reject`
    : `/api/rides/offers/${offerId}/reject`;
  try {
    await goBackend.post(path);
  } catch (error) {
    throw error;
  }
}

// Accept an offer
export async function acceptOffer(rideId: string, offerOrId: string | Offer) {
  const offerId = typeof offerOrId === 'string' ? offerOrId : offerOrId.id;
  await getUserOrThrow();

  if (!isGoBackendConfigured()) throw new Error("Ride offers temporarily unavailable");
  try {
    return await goBackend.post(`/api/rides/${rideId}/offers/${offerId}/accept`);
  } catch (error) {
    throw error;
  }
}

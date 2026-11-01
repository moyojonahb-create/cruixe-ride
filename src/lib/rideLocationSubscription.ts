import { backendSocketClient, eventRideId, type BackendSocketEvent } from "@/lib/backendSocketClient";

export interface RideLocation { lat: number; lng: number; updatedAt: string; heading: number | null; speed: number | null; }
const tripActive = (status: unknown) => ["accepted", "arrived", "in_progress"].includes(String(status));

/** Participant-scoped tracking. No raw location-table fallback: its deployed RLS is unverified. */
export function subscribeRideLocation(
  rideId: string, driverUserId: string,
  onLocation: (location: RideLocation) => void,
  onConnection: (connected: boolean) => void,
  onReset: () => void,
) {
  let authorized = false;
  let lastObserved = 0;
  const reset = () => { authorized = false; onConnection(false); onReset(); };
  const onEvent = (event: BackendSocketEvent) => {
    if (eventRideId(event) !== rideId) return;
    if (event.type === "ride_snapshot") {
      authorized = tripActive(event.ride?.status) && event.ride?.driver_user_id === driverUserId;
      if (!authorized) reset();
    } else if (event.type === "room_joined") {
      onConnection(authorized);
    } else if (["room_revoked", "room_user_revoked", "join_room_denied", "ride_cancelled", "ride_completed"].includes(event.type)) {
      reset();
    } else if (event.type === "driver_location" && authorized && event.driver_id === driverUserId) {
      const lat = Number(event.latitude), lng = Number(event.longitude);
      const observed = Date.parse(String(event.updated_at));
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !Number.isFinite(observed)) return;
      if (Date.now() - observed > 120_000 || observed - Date.now() > 30_000) return;
      if (observed <= lastObserved) return;
      lastObserved = observed;
      onConnection(true);
      onLocation({ lat, lng, updatedAt: String(event.updated_at), heading: typeof event.heading === "number" ? event.heading : null, speed: typeof event.speed === "number" ? event.speed : null });
    }
  };
  const offEvent = backendSocketClient.onAny(onEvent);
  const offState = backendSocketClient.onState(state => { if (state !== "open") reset(); });
  backendSocketClient.joinRide(rideId);
  return () => { offEvent(); offState(); backendSocketClient.leaveRide(rideId); };
}
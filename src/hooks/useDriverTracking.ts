import { useEffect, useState } from "react";
import { subscribeRideLocation } from "@/lib/rideLocationSubscription";
interface DriverPosition { lat: number; lng: number; }

// A driver ID alone does not authorize precise tracking. Existing two-argument
// callers fail closed; current source has no such callers. Supply a ride scope.
export function useDriverTracking(driverUserId: string | null, rideStatus: string | null, rideId?: string | null): DriverPosition | null {
  const [position, setPosition] = useState<DriverPosition | null>(null);
  const active = ["accepted", "enroute", "enroute_pickup", "driver_arrived", "arrived", "in_progress"].includes(rideStatus ?? "");
  useEffect(() => {
    setPosition(null);
    if (!driverUserId || !rideId || !active) return;
    return subscribeRideLocation(rideId, driverUserId, point => setPosition({ lat: point.lat, lng: point.lng }), () => {}, () => setPosition(null));
  }, [driverUserId, rideId, active]);
  return active && rideId ? position : null;
}
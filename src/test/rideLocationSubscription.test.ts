import { describe, it, expect, vi } from "vitest";
const { listeners, states, joinRide, leaveRide } = vi.hoisted(() => ({ listeners: [] as Array<(event: any) => void>, states: [] as Array<(state: string) => void>, joinRide: vi.fn(), leaveRide: vi.fn() }));
vi.mock("@/lib/backendSocketClient", () => ({
 eventRideId: (event: any) => event.ride_id ?? event.room_id?.replace(/^ride_/, ""),
 backendSocketClient: { joinRide, leaveRide, onAny: (fn: any) => { listeners.push(fn); return () => {}; }, onState: (fn: any) => { states.push(fn); return () => {}; } },
}));
import { subscribeRideLocation } from "@/lib/rideLocationSubscription";
describe("scoped tracking subscription", () => {
 it("rejects unrelated locations, resets after reassignment/revocation, and checks freshness", () => {
   listeners.length = 0; states.length = 0;
   const point = vi.fn(), connection = vi.fn(), reset = vi.fn(); const stop = subscribeRideLocation("trip", "driver-auth", point, connection, reset);
   const send = (event: any) => listeners[0](event);
   const location = { type: "driver_location", ride_id: "trip", driver_id: "driver-auth", latitude: 1, longitude: 2, updated_at: new Date().toISOString() };
   send(location); expect(point).not.toHaveBeenCalled();
   send({ type: "ride_snapshot", ride_id: "trip", ride: { status: "accepted", driver_user_id: "driver-auth" } });
   send({ ...location, ride_id: "other" }); send({ ...location, driver_id: "old-driver" }); send({ ...location, updated_at: new Date(Date.now() - 180_000).toISOString() });
   expect(point).not.toHaveBeenCalled(); send(location); expect(point).toHaveBeenCalledTimes(1);
   send({ type: "ride_snapshot", ride_id: "trip", ride: { status: "accepted", driver_user_id: "new-driver" } });
   send(location); expect(point).toHaveBeenCalledTimes(1); expect(reset).toHaveBeenCalled();
   send({ type: "room_revoked", room_id: "ride_trip" }); expect(connection).toHaveBeenLastCalledWith(false);
   states[0]("reconnecting"); expect(reset).toHaveBeenCalled(); stop(); expect(leaveRide).toHaveBeenCalledWith("trip");
 });
});
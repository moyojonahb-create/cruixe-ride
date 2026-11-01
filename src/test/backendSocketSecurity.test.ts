import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/backendClient", () => ({ getFreshAuthToken: vi.fn().mockResolvedValue("test-token") }));
vi.mock("@/lib/goBackendClient", () => ({ goBackend: { get } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { onAuthStateChange: vi.fn() } } }));
import { BackendSocketClient, type BackendSocketEvent } from "@/lib/backendSocketClient";
class Socket extends EventTarget {
  static OPEN = 1; static CLOSED = 3;
  static instances: Socket[] = [];
  readyState = 0; sent: Record<string, unknown>[] = [];
  constructor(public url: string) { super(); Socket.instances.push(this); queueMicrotask(() => { this.readyState = 1; this.dispatchEvent(new Event("open")); }); }
  send(value: string) { this.sent.push(JSON.parse(value)); }
  close() { this.readyState = 3; this.dispatchEvent(new Event("close")); }
  receive(value: unknown) { this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(value) })); }
}
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const snapshot = { id: "trip", status: "accepted", driver_id: "driver-row", driver_user_id: "driver-auth" };
const location = { event: "driver_location", room: "ride_trip", ride_id: "trip", driver_id: "driver-auth", latitude: 1, longitude: 2 };
let client: BackendSocketClient;
beforeEach(() => {
  vi.stubGlobal("WebSocket", Socket); Socket.instances = [];
  get.mockReset().mockResolvedValue(snapshot); client = new BackendSocketClient();
});
afterEach(() => { client.close(); vi.unstubAllGlobals(); });
describe("participant-scoped websocket recovery", () => {
  it("requires an authenticated canonical snapshot before joining and validates location identity", async () => {
    const received: BackendSocketEvent[] = []; client.onAny(event => received.push(event));
    client.joinRide("trip"); await flush();
    const socket = Socket.instances[0];
    expect(get).toHaveBeenCalledWith("/api/rides/trip");
    expect(socket.sent).toContainEqual({ event: "join_room", room_id: "ride_trip" });
    socket.receive(location); expect(received.filter(event => event.type === "driver_location")).toHaveLength(0);
    socket.receive({ event: "room_joined", room_id: "ride_trip" });
    socket.receive({ ...location, ride_id: undefined, room: undefined });
    socket.receive({ ...location, driver_id: "previous-driver" });
    socket.receive({ ...location, room: "ride_other" });
    expect(received.filter(event => event.type === "driver_location")).toHaveLength(0);
    socket.receive(location);
    expect(received.filter(event => event.type === "driver_location")).toHaveLength(1);
  });
  it("does not rejoin a revoked room after reconnect or a late room acknowledgement", async () => {
    const received: BackendSocketEvent[] = []; client.onAny(event => received.push(event));
    client.joinRide("trip"); await flush(); const old = Socket.instances[0];
    old.receive({ event: "room_joined", room_id: "ride_trip" });
    old.receive({ event: "room_revoked", room_id: "ride_trip" }); await flush();
    client.reconnectWithFreshToken(); await flush(); const current = Socket.instances[1];
    expect(current.sent.some(event => event.event === "join_room")).toBe(false);
    current.receive({ event: "room_joined", room_id: "ride_trip" }); current.receive(location);
    old.receive(location); old.dispatchEvent(new Event("close"));
    expect(client.getState()).toBe("open");
    expect(received.filter(event => event.type === "driver_location")).toHaveLength(0);
    expect(received.some(event => event.type === "room_revoked")).toBe(true);
  });
  it("reconciles a terminal snapshot without subscribing", async () => {
    get.mockResolvedValue({ ...snapshot, status: "completed" });
    const received: BackendSocketEvent[] = []; client.onAny(event => received.push(event)); client.joinRide("trip"); await flush();
    expect(Socket.instances[0].sent.some(event => event.event === "join_room")).toBe(false);
    expect(received.some(event => event.type === "ride_snapshot" && event.ride?.status === "completed")).toBe(true);
  });
  it("fails closed on snapshot access denial but permits recovery after a transient API outage", async () => {
    get.mockRejectedValue({ status: 503 }); client.joinRide("trip"); await flush();
    expect(Socket.instances[0].sent.some(event => event.event === "join_room")).toBe(false);
    get.mockResolvedValue(snapshot); await client.refreshRide("trip");
    expect(Socket.instances[0].sent).toContainEqual({ event: "join_room", room_id: "ride_trip" });
    get.mockRejectedValue({ status: 403 }); Socket.instances[0].receive({ event: "join_room_denied", room_id: "ride_trip" }); await flush();
    const calls = get.mock.calls.length; await client.refreshRide("trip"); expect(get.mock.calls.length).toBe(calls);
  });
  it("clears room references and queued controls on signout/close", async () => {
    client.joinRide("trip"); await flush(); client.close(); await client.connect(); await flush();
    expect(Socket.instances[1].sent.some(event => event.event === "join_room")).toBe(false);
  });
});
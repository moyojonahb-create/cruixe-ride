import { goBackend } from "@/lib/goBackendClient";
import { getFreshAuthToken } from "@/lib/backendClient";
import { supabase } from "@/integrations/supabase/client";

// Same dev-only proxy story as goBackendClient — the deployed backend
// doesn't allow the localhost origin, so route the socket through Vite's
// proxy in dev instead of connecting to it directly.
const WS_URL = import.meta.env.DEV
  ? `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/go-ws`
  : (import.meta.env.VITE_WS_URL || "");
const HEARTBEAT_MS = 25_000;
const PONG_TIMEOUT_MS = 10_000;
const MAX_BACKOFF_MS = 30_000;
const SEND_QUEUE_LIMIT = 50;

export type BackendSocketEventType =
  | "ride_offer"
  | "ride_accepted"
  | "driver_location"
  | "ride_status_updated"
  | "ride_cancelled"
  | "ride_started"
  | "ride_completed"
  | "room_revoked"
  | "room_user_revoked"
  | "join_room_denied"
  | "room_joined"
  | "ride_snapshot";

export type BackendSocketEvent = {
  type: BackendSocketEventType;
  event?: BackendSocketEventType;
  room?: string;
  ride?: Record<string, unknown>;
  offer?: Record<string, unknown>;
  ride_id?: string;
  rideId?: string;
  offer_id?: string;
  offerId?: string;
  driver_id?: string;
  driverId?: string;
  latitude?: number;
  longitude?: number;
  heading?: number | null;
  speed?: number | null;
  updated_at?: string;
  timestamp?: number;
  [key: string]: unknown;
};

type Listener = (event: BackendSocketEvent) => void;
type StateListener = (state: BackendSocketState) => void;

export type BackendSocketState = "idle" | "connecting" | "open" | "reconnecting" | "closed" | "error";

const canonicalEvents = new Set<BackendSocketEventType>([
  "ride_offer",
  "ride_accepted",
  "driver_location",
  "ride_status_updated",
  "ride_cancelled",
  "ride_started",
  "ride_completed",
  "room_revoked", "room_user_revoked", "join_room_denied", "room_joined",
]);

function normalizeRideId(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function nestedRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function roomIdForRide(rideId: string): string {
  return rideId.startsWith("ride_") ? rideId : `ride_${rideId}`;
}

function rideIdFromRoom(roomId: unknown): string | null {
  if (typeof roomId !== "string" || !roomId.startsWith("ride_")) return null;
  const rideId = roomId.slice("ride_".length);
  return rideId || null;
}

export class BackendSocketClient {
  private ws: WebSocket | null = null;
  private generation = 0;
  private revokedRooms = new Set<string>();
  private joinedRooms = new Set<string>();
  private driverSubjects = new Map<string, string>();
  private syncing = new Map<string, Promise<void>>();
  private connectPromise: Promise<WebSocket> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private backoffMs = 1_000;
  private closedByClient = false;
  private rooms = new Set<string>();
  private queue: string[] = [];
  private listeners = new Map<BackendSocketEventType, Set<Listener>>();
  private anyListeners = new Set<Listener>();
  private stateListeners = new Set<StateListener>();
  private state: BackendSocketState = "idle";
  private roomRefs = new Map<string, number>();

  get readyState() {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  getState() {
    return this.state;
  }

  async connect(): Promise<WebSocket> {
    if (this.ws?.readyState === WebSocket.OPEN) return this.ws;
    if (this.connectPromise) return this.connectPromise;
    if (!WS_URL) throw new Error("Missing required environment variable: VITE_WS_URL");

    this.closedByClient = false;
    this.setState(this.ws ? "reconnecting" : "connecting");
    const generation = ++this.generation;
    this.connectPromise = this.openSocket()
      .then(async (socket) => {
        if (generation !== this.generation) { socket.close(); throw new Error("Obsolete websocket connection"); }
        this.ws = socket;
        this.backoffMs = 1_000;
        this.setState("open");
        this.startHeartbeat();
        await this.rejoinRooms();
        this.flushQueue();
        return socket;
      })
      .finally(() => {
        if (generation === this.generation) this.connectPromise = null;
      });

    return this.connectPromise;
  }

  close() {
    this.generation++;
    this.connectPromise = null;
    this.rooms.clear(); this.roomRefs.clear(); this.queue = [];
    this.revokedRooms.clear(); this.joinedRooms.clear(); this.driverSubjects.clear(); this.syncing.clear();
    this.closedByClient = true;
    this.clearTimers();
    this.ws?.close();
    this.ws = null;
    this.setState("closed");
  }

  reconnectWithFreshToken() {
    this.generation++;
    this.connectPromise = null;
    this.joinedRooms.clear(); this.driverSubjects.clear(); this.syncing.clear();
    this.closedByClient = false;
    this.clearTimers();
    this.ws?.close();
    this.ws = null;
    if (this.rooms.size > 0 || this.listeners.size > 0 || this.anyListeners.size > 0) {
      this.connect().catch((error) => console.error("[BackendSocket] token refresh reconnect failed:", error));
    }
  }

  send(message: Record<string, unknown>) {
    if (message.event === "join_room" || message.event === "leave_room") return;
    const serialized = JSON.stringify(message);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(serialized);
      return;
    }

    this.queue.push(serialized);
    if (this.queue.length > SEND_QUEUE_LIMIT) this.queue.shift();
    this.connect().catch((error) => {
      console.error("[BackendSocket] connect failed:", error);
    });
  }

  joinRide(rideId: string) {
    if (!rideId) return;
    const room = roomIdForRide(rideId);
    if (this.revokedRooms.has(room)) return;
    this.roomRefs.set(room, (this.roomRefs.get(room) ?? 0) + 1);
    this.rooms.add(room);
    if (this.ws?.readyState === WebSocket.OPEN) void this.reconcileRide(room);
    else void this.connect().catch(() => {});
  }
  leaveRide(rideId: string) {
    if (!rideId) return;
    const roomId = roomIdForRide(rideId);
    const next = (this.roomRefs.get(roomId) ?? 1) - 1;
    if (next > 0) {
      this.roomRefs.set(roomId, next);
      return;
    }
    this.roomRefs.delete(roomId);
    this.rooms.delete(roomId);
    this.joinedRooms.delete(roomId); this.driverSubjects.delete(roomId);
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ event: "leave_room", room_id: roomId }));
  }

  on(type: BackendSocketEventType, listener: Listener) {
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(type, set);
    this.connect().catch((error) => console.error("[BackendSocket] subscribe failed:", error));
    return () => {
      set.delete(listener);
      if (set.size === 0) this.listeners.delete(type);
    };
  }

  onAny(listener: Listener) {
    this.anyListeners.add(listener);
    this.connect().catch((error) => console.error("[BackendSocket] subscribe failed:", error));
    return () => {
      this.anyListeners.delete(listener);
    };
  }

  onState(listener: StateListener) {
    this.stateListeners.add(listener);
    listener(this.state);
    this.connect().catch((error) => console.error("[BackendSocket] state subscribe failed:", error));
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private async openSocket(): Promise<WebSocket> {
    const generation = this.generation;
    const token = await getFreshAuthToken();
    const url = new URL(WS_URL);
    url.searchParams.set("token", token);

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url.toString());
      let settled = false;

      socket.addEventListener("open", () => {
        settled = true;
        resolve(socket);
      });

      socket.addEventListener("message", (event) => { if (generation === this.generation) this.handleMessage(event); });
      socket.addEventListener("close", () => {
        if (generation !== this.generation) return;
        this.joinedRooms.clear(); this.driverSubjects.clear();
        if (this.ws === socket) this.ws = null;
        this.clearHeartbeat();
        if (!settled) reject(new Error("Backend websocket closed before opening"));
        if (!this.closedByClient) this.scheduleReconnect();
      });
      socket.addEventListener("error", (event) => {
        if (generation !== this.generation) return;
        this.setState("error");
        if (!settled) reject(event);
      });
    });
  }

  private handleMessage(event: MessageEvent) {
    let data: unknown;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }

    if (!data || typeof data !== "object") return;
    const record = data as Record<string, unknown>;
    const messageType = record.event ?? record.type;
    if (messageType === "pong") {
      this.clearPongTimer();
      return;
    }
    if (typeof messageType !== "string" || !canonicalEvents.has(messageType as BackendSocketEventType)) return;

    const room = typeof record.room_id === "string" ? record.room_id : typeof record.room === "string" ? record.room : "";
    if (messageType === "room_revoked" || messageType === "room_user_revoked" || messageType === "join_room_denied") { this.revokeRoom(room); void this.readRevokedSnapshot(room); }
    if (messageType === "room_joined") {
      if (!this.rooms.has(room) || this.revokedRooms.has(room)) return;
      this.joinedRooms.add(room);
    }
    const rideId = typeof record.ride_id === "string" ? record.ride_id : rideIdFromRoom(record.room);
    const rideRoom = rideId ? roomIdForRide(rideId) : "";
    if (record.room && rideIdFromRoom(record.room) !== rideId) return;
    if (messageType === "driver_location") {
      if (!rideRoom || !this.joinedRooms.has(rideRoom) || this.revokedRooms.has(rideRoom)) return;
      if (record.driver_id !== this.driverSubjects.get(rideRoom)) { void this.reconcileRide(rideRoom); return; }
    }
    if (rideRoom && this.revokedRooms.has(rideRoom) && messageType !== "ride_cancelled" && messageType !== "ride_completed") return;
    if (rideRoom && ["ride_cancelled", "ride_completed"].includes(messageType)) { this.revokeRoom(rideRoom); void this.readRevokedSnapshot(rideRoom); }
    const typed = {
      ...record,
      type: messageType,
      event: messageType,
    } as BackendSocketEvent;
    this.listeners.get(typed.type)?.forEach((listener) => listener(typed));
    this.anyListeners.forEach((listener) => listener(typed));
  }

  private startHeartbeat() {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) return;
      this.ws.send(JSON.stringify({ event: "ping", timestamp: Date.now() }));
      this.rooms.forEach(room => { if (!this.joinedRooms.has(room)) void this.reconcileRide(room); });
      this.clearPongTimer();
      this.pongTimer = setTimeout(() => {
        this.ws?.close();
      }, PONG_TIMEOUT_MS);
    }, HEARTBEAT_MS);
  }

  refreshRide(rideId: string) { return this.reconcileRide(roomIdForRide(rideId)); }

  private async readRevokedSnapshot(room: string) {
    const generation = this.generation, rideId = rideIdFromRoom(room);
    if (!rideId) return;
    try {
      const ride = await goBackend.get<Record<string, unknown>>(`/api/rides/${encodeURIComponent(rideId)}`);
      if (generation !== this.generation || ride.id !== rideId) return;
      const event = { type: "ride_snapshot", event: "ride_snapshot", ride_id: rideId, room, ride } as BackendSocketEvent;
      this.listeners.get("ride_snapshot")?.forEach(listener => listener(event));
      this.anyListeners.forEach(listener => listener(event));
    } catch { /* Access denial retains revoked state; never retry a weaker read. */ }
  }

  private revokeRoom(room: string) {
    if (!room) return;
    this.revokedRooms.add(room); this.rooms.delete(room); this.roomRefs.delete(room);
    this.joinedRooms.delete(room); this.driverSubjects.delete(room);
  }

  private async rejoinRooms() {
    await Promise.all([...this.rooms].filter(room => !this.revokedRooms.has(room)).map(room => this.reconcileRide(room)));
  }

  private reconcileRide(room: string): Promise<void> {
    if (this.revokedRooms.has(room) || !this.rooms.has(room)) return Promise.resolve();
    const existing = this.syncing.get(room); if (existing) return existing;
    const generation = this.generation;
    const task = (async () => {
      try {
        const rideId = rideIdFromRoom(room); if (!rideId) return;
        const snapshot = await goBackend.get<Record<string, unknown>>(`/api/rides/${encodeURIComponent(rideId)}`);
        if (generation !== this.generation || !this.rooms.has(room) || this.revokedRooms.has(room)) return;
        if (snapshot.id !== rideId) return;
        const status = String(snapshot.status ?? "");
        if (!["pending", "scheduled", "accepted", "arrived", "in_progress"].includes(status)) this.revokeRoom(room);
        else {
          this.driverSubjects.set(room, String(snapshot.driver_user_id ?? ""));
          if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ event: "join_room", room_id: room }));
        }
        const event = { type: "ride_snapshot", event: "ride_snapshot", ride_id: rideId, room, ride: snapshot } as BackendSocketEvent;
        this.listeners.get("ride_snapshot")?.forEach(listener => listener(event));
        this.anyListeners.forEach(listener => listener(event));
      } catch (error) {
        if (generation !== this.generation) return;
        if ([401, 403, 404].includes((error as { status?: number }).status ?? 0)) {
          this.revokeRoom(room);
          const event = { type: "room_revoked", event: "room_revoked", room_id: room, room, reason: "snapshot_access_denied" } as BackendSocketEvent;
          this.listeners.get("room_revoked")?.forEach(listener => listener(event));
          this.anyListeners.forEach(listener => listener(event));
        }
      }
    })().finally(() => { if (generation === this.generation) this.syncing.delete(room); });
    this.syncing.set(room, task); return task;
  }
  private flushQueue() {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    const pending = [...this.queue];
    this.queue = [];
    pending.forEach((message) => this.ws?.send(message));
  }

  private scheduleReconnect() {
    this.setState("reconnecting");
    if (this.reconnectTimer) return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error) => {
        console.error("[BackendSocket] reconnect failed:", error);
        this.scheduleReconnect();
      });
    }, delay);
  }

  private setState(state: BackendSocketState) {
    this.state = state;
    this.stateListeners.forEach((listener) => listener(state));
  }

  private clearPongTimer() {
    if (this.pongTimer) clearTimeout(this.pongTimer);
    this.pongTimer = null;
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
    this.clearPongTimer();
  }

  private clearTimers() {
    this.clearHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}

export const backendSocketClient = new BackendSocketClient();

export function eventRideId(event: BackendSocketEvent): string | null {
  const ride = nestedRecord(event.ride);
  return normalizeRideId(event.ride_id) ?? normalizeRideId(event.rideId) ?? normalizeRideId(ride?.id) ?? normalizeRideId(ride?.ride_id) ?? rideIdFromRoom(event.room) ?? rideIdFromRoom(event.room_id);
}

export function eventDriverId(event: BackendSocketEvent): string | null {
  const offer = nestedRecord(event.offer);
  const ride = nestedRecord(event.ride);
  return normalizeRideId(event.driver_id) ?? normalizeRideId(event.driverId) ?? normalizeRideId(offer?.driver_id) ?? normalizeRideId(offer?.driverId) ?? normalizeRideId(ride?.driver_id);
}

export function eventOfferId(event: BackendSocketEvent): string | null {
  const offer = nestedRecord(event.offer);
  return normalizeRideId(event.offer_id) ?? normalizeRideId(event.offerId) ?? normalizeRideId(offer?.id) ?? normalizeRideId(offer?.offer_id);
}

export function eventNumber(event: BackendSocketEvent, keys: string[]): number | null {
  for (const key of keys) {
    const value = asNumber((event as Record<string, unknown>)[key]);
    if (value != null) return value;
  }
  const offer = nestedRecord(event.offer);
  if (offer) {
    for (const key of keys) {
      const value = asNumber(offer[key]);
      if (value != null) return value;
    }
  }
  const ride = nestedRecord(event.ride);
  if (ride) {
    for (const key of keys) {
      const value = asNumber(ride[key]);
      if (value != null) return value;
    }
  }
  return null;
}

export function eventString(event: BackendSocketEvent, keys: string[]): string | null {
  for (const key of keys) {
    const value = (event as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  const offer = nestedRecord(event.offer);
  if (offer) {
    for (const key of keys) {
      const value = offer[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  const ride = nestedRecord(event.ride);
  if (ride) {
    for (const key of keys) {
      const value = ride[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return null;
}

let socketUserId: string | null = null;
supabase.auth.onAuthStateChange((event, session) => {
  const nextUser = session?.user?.id ?? null;
  if (event === "SIGNED_IN" && socketUserId !== nextUser) backendSocketClient.close();
  socketUserId = nextUser;
  if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
    backendSocketClient.reconnectWithFreshToken();
  }
  if (event === "SIGNED_OUT") {
    backendSocketClient.close();
  }
});

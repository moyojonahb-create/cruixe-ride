import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useNearbyDrivers } from "@/hooks/useNearbyDrivers";

const mock = vi.hoisted(() => ({
  callback: null as null | ((payload: { new: Record<string, unknown>; eventType: "UPDATE" }) => void),
  on: vi.fn(), subscribe: vi.fn(), removeChannel: vi.fn(),
}));
vi.mock("@/lib/supabaseClient", () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ limit: async () => ({ data: [
    { user_id: "driver-a", latitude: -26, longitude: 28, is_online: true },
  ] }) }) }) }) }),
  channel: () => ({ on: mock.on }), removeChannel: mock.removeChannel,
} }));
vi.mock("@/lib/driverLocation", () => ({ calculateDistance: () => 0.5 }));

beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks();
  mock.subscribe.mockReturnValue({});
  mock.on.mockImplementation((_kind, _filter, callback) => {
    mock.callback = callback;
    return { subscribe: mock.subscribe };
  });
});
afterEach(() => { vi.useRealTimers(); });

it("keeps UPDATE-only discovery and removes offline drivers without changing location/radius updates", async () => {
  const { result, unmount } = renderHook(() => useNearbyDrivers(true, { lat: -26, lng: 28 }, 1));
  await act(async () => { await Promise.resolve(); });
  act(() => { vi.advanceTimersByTime(400); });
  expect(result.current).toEqual([{ id: "driver-a", lat: -26, lng: 28, isOnline: true, distanceKm: 0.5 }]);
  expect(mock.on).toHaveBeenCalledWith("postgres_changes", expect.objectContaining({ event: "UPDATE", table: "live_locations" }), expect.any(Function));
  act(() => {
    mock.callback!({ eventType: "UPDATE", new: { user_id: "driver-a", user_type: "driver", latitude: -26.01, longitude: 28.01, is_online: true } });
    vi.advanceTimersByTime(400);
  });
  expect(result.current[0]).toMatchObject({ lat: -26.01, lng: 28.01 });
  act(() => {
    mock.callback!({ eventType: "UPDATE", new: { user_id: "driver-a", user_type: "driver", is_online: false } });
    vi.advanceTimersByTime(400);
  });
  expect(result.current).toEqual([]);
  unmount();
  expect(mock.removeChannel).toHaveBeenCalledOnce();
});

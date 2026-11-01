import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStreets } from '@/hooks/useStreets';
import { searchCachedPlacesPrefix } from '@/lib/placeCache';

const db = vi.hoisted(() => ({ response: null as unknown, requests: [] as Array<{ signal?: AbortSignal }> }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { from: () => {
  const request: { signal?: AbortSignal } = {};
  db.requests.push(request);
  const builder = {
    select: () => builder, eq: () => builder, ilike: () => builder,
    contains: () => builder, gte: () => builder, lte: () => builder,
    or: () => builder, limit: () => builder,
    abortSignal: (signal: AbortSignal) => { request.signal = signal; return builder; },
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(db.response).then(resolve, reject),
  };
  return builder;
} } }));
vi.mock('@/lib/businessApi', () => ({ cachePlace: vi.fn() }));

beforeEach(() => { vi.useFakeTimers(); db.requests = []; db.response = { data: [], error: null }; });
afterEach(() => { vi.useRealTimers(); });

describe('destination provider cancellation and feedback', () => {
  it('does not query below the three-character threshold', async () => {
    const { result } = renderHook(() => useStreets({ searchQuery: 'G', townName: 'Gwanda' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(db.requests).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });

  it('settles a hung request with a visible error and aborts it', async () => {
    db.response = new Promise(() => {});
    const { result } = renderHook(() => useStreets({ searchQuery: 'Gwanda', townName: 'Gwanda' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(5200); });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toMatch(/timed out/i);
    expect(db.requests.every((request) => request.signal?.aborted)).toBe(true);
  });

  it('rejects late data after clearing the input even if transport ignores abort', async () => {
    let resolve!: (value: unknown) => void;
    db.response = new Promise((done) => { resolve = done; });
    const { result, rerender } = renderHook(({ query }) => useStreets({ searchQuery: query, townName: 'Gwanda' }), { initialProps: { query: 'Gwanda' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    rerender({ query: '' });
    await act(async () => { resolve({ data: [{ id: 'old', name: 'Old result' }], error: null }); });
    expect(result.current.streets).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('retries the same query when requested', async () => {
    db.response = { data: null, error: new Error('offline') };
    const { result, rerender } = renderHook(({ retryKey }) => useStreets({ searchQuery: 'Gwanda', townName: 'Gwanda', retryKey }), { initialProps: { retryKey: 0 } });
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    expect(result.current.error).toMatch(/unavailable/i);
    db.response = { data: [{ id: 'real-response', name: 'Provider result' }], error: null };
    rerender({ retryKey: 1 });
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    expect(result.current.error).toBeNull();
    expect(result.current.streets[0].name).toBe('Provider result');
  });

  it('propagates cache provider failures instead of claiming an empty search', async () => {
    db.response = { data: null, error: new Error('unauthorized') };
    await expect(searchCachedPlacesPrefix('Gwanda')).rejects.toThrow('unauthorized');
  });

  it('passes cancellation to every cache query', async () => {
    const controller = new AbortController();
    await searchCachedPlacesPrefix('Gwanda', 12, undefined, controller.signal);
    expect(db.requests).toHaveLength(3);
    expect(db.requests.every((request) => request.signal === controller.signal)).toBe(true);
  });
});

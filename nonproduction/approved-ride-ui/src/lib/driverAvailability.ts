import { canCurrentDriverOperate } from '@/lib/businessApi';
import { setDriverOnline } from '@/lib/driverPresence';

export const DRIVER_AVAILABILITY_EVENT = 'cruixe:driver-availability';

export class DriverEligibilityError extends Error {
  constructor() {
    super('Your trial has ended or your wallet balance is too low. Please deposit to continue.');
    this.name = 'DriverEligibilityError';
  }
}

export interface DriverAvailabilityResult {
  isOnline: boolean;
  applied: boolean;
}

interface DriverAvailabilityQueue {
  generation: number;
  desired: boolean;
  tail: Promise<void>;
  latestPromise?: Promise<DriverAvailabilityResult>;
}

const queues = new Map<string, DriverAvailabilityQueue>();

export function publishDriverAvailability(isOnline: boolean): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(DRIVER_AVAILABILITY_EVENT, { detail: { isOnline } }));
}

export function subscribeDriverAvailability(listener: (isOnline: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handler = (event: Event) => listener(Boolean((event as CustomEvent<{ isOnline: boolean }>).detail?.isOnline));
  window.addEventListener(DRIVER_AVAILABILITY_EVENT, handler);
  return () => window.removeEventListener(DRIVER_AVAILABILITY_EVENT, handler);
}

/** Serialize availability changes per authenticated driver and publish only the latest intent. */
export function updateDriverAvailability(
  driverId: string,
  next: boolean,
  coords?: { lat: number; lng: number } | null,
): Promise<DriverAvailabilityResult> {
  if (!driverId) return Promise.reject(new Error('You must be signed in to change your status'));

  let queue = queues.get(driverId);
  if (!queue) {
    queue = { generation: 0, desired: next, tail: Promise.resolve() };
    queues.set(driverId, queue);
  } else if (queue.latestPromise && queue.desired === next) {
    return queue.latestPromise;
  }

  const generation = ++queue.generation;
  queue.desired = next;
  const operation = queue.tail.catch(() => undefined).then(async () => {
    if (generation !== queue!.generation) return { applied: false, isOnline: next };
    if (next) {
      const allowed = await canCurrentDriverOperate();
      if (!allowed) throw new DriverEligibilityError();
    }
    await setDriverOnline(next, coords);
    const applied = generation === queue!.generation;
    if (applied) publishDriverAvailability(next);
    return { applied, isOnline: next };
  });

  queue.latestPromise = operation;
  queue.tail = operation.then(() => undefined, () => undefined);
  void operation.finally(() => {
    if (queue!.generation === generation) queue!.latestPromise = undefined;
  }).catch(() => undefined);
  return operation;
}

import { useEffect, useRef, useState } from 'react';

/** Only an observed transition for the same Driver row establishes reactivation.
 * A fresh approved profile, a new login, or a missing status is not evidence. */
export function useObservedDriverReactivation(driverId: string | null, status: string | null) {
  const previous = useRef<{ id: string | null; status: string | null }>({ id: null, status: null });
  const [restoredDriverId, setRestoredDriverId] = useState<string | null>(null);
  useEffect(() => {
    const sameDriver = !!driverId && previous.current.id === driverId;
    if (!sameDriver || status !== 'approved') setRestoredDriverId(null);
    else if (previous.current.status === 'suspended') setRestoredDriverId(driverId);
    previous.current = { id: driverId, status };
  }, [driverId, status]);
  return !!driverId && restoredDriverId === driverId && status === 'approved';
}

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { RideTierId } from '@/components/ride/RideTierSelector';
import type { RideStop } from '@/components/ride/MultiStopInput';
import type { TownConfig } from '@/lib/towns';

interface DraftLocation { name: string; lat: number; lng: number }
export interface RideSelectionDraft {
  selectedTier: RideTierId;
  pickup: DraftLocation | null;
  dropoff: DraftLocation | null;
  stops: RideStop[];
  scheduledAt: Date | null;
  passengerCount: number;
  town: TownConfig;
}
const RiderNavigationContext = createContext<{
  managed: boolean;
  draft: RideSelectionDraft | null;
  saveDraft: (draft: RideSelectionDraft) => void;
}>({ managed: false, draft: null, saveDraft: () => {} });

/** In-memory UI draft only. GPS fixes and authentication credentials are never stored. */
export function RiderNavigationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [draft, saveDraft] = useState<RideSelectionDraft | null>(null);
  const identity = useRef(user?.id);
  useEffect(() => {
    // Keep a guest draft through sign-in; clear it on sign-out or account switch.
    if (identity.current && identity.current !== user?.id) saveDraft(null);
    identity.current = user?.id;
  }, [user?.id]);
  const value = useMemo(() => ({ managed: true, draft, saveDraft }), [draft]);
  return <RiderNavigationContext.Provider value={value}>{children}</RiderNavigationContext.Provider>;
}
export const useRiderNavigation = () => useContext(RiderNavigationContext);

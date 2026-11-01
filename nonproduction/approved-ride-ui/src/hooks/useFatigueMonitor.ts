import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createFatigueBreak } from '@/lib/businessApi';

const MAX_ONLINE_HOURS = 12;
const BREAK_HOURS = 6;

interface FatigueState {
  totalOnlineHours: number;
  isFatigued: boolean;
  breakEndsAt: Date | null;
  breakTimeRemaining: string;
  /**
   * Forces a fresh check and resolves with the result.
   *
   * Fatigue is enforced at decision points — going online, taking an offer —
   * not on a wall clock. Two reasons. A 5-minute interval is suspended when the
   * screen locks, so a timer-based control is decorative during exactly the
   * hours it exists for. And interrupting a driver mid-ride with a forced break
   * is worse than not interrupting them: they still have a passenger.
   *
   * Checking at the transition means a fatigued driver finishes the ride they
   * are in and then cannot take another, which is the behaviour the control
   * actually wants.
   */
  refresh: () => Promise<boolean>;
}

export function useFatigueMonitor(userId: string | undefined, isOnline: boolean): FatigueState {
  const [state, setState] = useState<Omit<FatigueState, 'refresh'>>({
    totalOnlineHours: 0,
    isFatigued: false,
    breakEndsAt: null,
    breakTimeRemaining: '',
  });

  const stateRef = useRef<FatigueState>({
    totalOnlineHours: 0,
    isFatigued: false,
    breakEndsAt: null,
    breakTimeRemaining: '',
    refresh: async () => false,
  });

  /** Writes ref and state together so `refresh()` cannot race a render. */
  const commit = useCallback((next: Omit<FatigueState, 'refresh'>) => {
    stateRef.current = { ...next, refresh: stateRef.current.refresh };
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const checkFatigue = useCallback(async () => {
    if (!userId) return;

    // Check for forced break
    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!driver) return;

    // Get sessions from last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: sessions } = await supabase
      .from('driver_sessions')
      .select('went_online_at, went_offline_at, forced_break_until')
      .eq('driver_id', userId)
      .gte('went_online_at', since)
      .order('went_online_at', { ascending: false });

    if (!sessions) return;

    // Check for active forced break
    const activeBreak = sessions.find(s => s.forced_break_until && new Date(s.forced_break_until) > new Date());
    if (activeBreak?.forced_break_until) {
      const breakEnd = new Date(activeBreak.forced_break_until);
      const remaining = breakEnd.getTime() - Date.now();
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      commit({
        totalOnlineHours: MAX_ONLINE_HOURS,
        isFatigued: true,
        breakEndsAt: breakEnd,
        breakTimeRemaining: `${hours}h ${mins}m`,
      });
      return;
    }

    // Calculate total online time
    let totalMs = 0;
    for (const s of sessions) {
      const start = new Date(s.went_online_at).getTime();
      const end = s.went_offline_at ? new Date(s.went_offline_at).getTime() : Date.now();
      totalMs += end - start;
    }
    const totalHours = totalMs / (1000 * 60 * 60);

    if (totalHours >= MAX_ONLINE_HOURS) {
      // Trigger fatigue - set forced break
      const breakUntil = new Date(Date.now() + BREAK_HOURS * 60 * 60 * 1000).toISOString();
      await createFatigueBreak({
        went_online_at: new Date().toISOString(),
        went_offline_at: new Date().toISOString(),
        forced_break_until: breakUntil,
      });

      commit({
        totalOnlineHours: totalHours,
        isFatigued: true,
        breakEndsAt: new Date(breakUntil),
        breakTimeRemaining: `${BREAK_HOURS}h 0m`,
      });
    } else {
      commit({
        totalOnlineHours: totalHours,
        isFatigued: false,
        breakEndsAt: null,
        breakTimeRemaining: '',
      });
    }
  }, [userId, commit]);

  // Foreground-only UI refresh. This is deliberately NOT the enforcement
  // mechanism — see `refresh` on FatigueState. It keeps the banner's countdown
  // current while someone is looking at it, and it is fine that it suspends on
  // screen lock, because nobody is reading a countdown on a dark screen.
  useEffect(() => {
    checkFatigue();
    const interval = setInterval(checkFatigue, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkFatigue, isOnline]);

  const refresh = useCallback(async () => {
    await checkFatigue();
    // checkFatigue writes through setState, which is async, so the freshly
    // computed value is read from the ref-free source of truth instead: the
    // hours threshold. Returning the decision rather than the state avoids a
    // caller racing a render.
    return stateRef.current.isFatigued;
  }, [checkFatigue]);

  return { ...state, refresh };
}

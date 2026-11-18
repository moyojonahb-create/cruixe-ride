import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  CheckCircle2,
  CornerUpLeft,
  CornerUpRight,
  Navigation as NavigationIcon,
  RotateCw,
  Undo2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { completeTrip } from "@/lib/completeTrip";
import { eventString } from "@/lib/backendSocketClient";
import { useRideRealtime } from "@/hooks/useRideRealtime";
import { useUnreadRideMessages } from "@/hooks/useUnreadRideMessages";
import { useVoiceNavigation } from "@/hooks/useVoiceNavigation";
import DriverMessageSheet from "@/components/driver/DriverMessageSheet";
import { usePickupNoShowReport } from '@/components/driver/driverTripExceptionState';
import { DriverPickupNoShowScreen } from '@/components/driver/DriverTripExceptionScreens';
import DriverLifecycleLayout from '@/components/driver/DriverLifecycleLayout';
import DriverGuestPassengerDetails from '@/components/driver/DriverGuestPassengerDetails';
import DriverActiveTripContent, { DriverNavigationDock } from '@/components/driver/DriverActiveTripContent';
import DriverDestinationReached from "@/components/driver/DriverDestinationReached";
import SafetySheet from "@/components/ride/SafetySheet";
import { goBackend, GoBackendError } from "@/lib/goBackendClient";
import { createNotification } from "@/lib/businessApi";
import { supabase } from "@/lib/supabaseClient";
import type { Coordinates } from "@/lib/osrm";
import { getDetailedRoute, findCurrentStep, getManeuverInstruction, getVoiceInstruction, type RouteStep } from "@/lib/osrmSteps";
import MapboxMap from "@/components/map/LazyMapboxMap";
import type { MapEtaCard } from "@/components/MapboxMap";
import { glassSurface, RIDE_RED, RIDE_TEXT, RIDE_TEXT_2 } from "@/components/ride/rideGlass";

export interface RiderInfo {
  full_name: string | null;
  avatar_url: string | null;
  gender: string | null;
  completedTrips: number | null;
}

interface ActiveTrip {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  fare: number;
  user_id: string;
  status: string;
  pickup_lat: number;
  pickup_lon: number;
  dropoff_lat: number;
  dropoff_lon: number;
  payment_method: string;
  distance_km?: number | null;
  passenger_count?: number | null;
  passenger_name?: string | null;
  passenger_phone?: string | null;
  /** Server-set once, on the transition into 'arrived' — never written by
   * this client (see trg_set_driver_arrived_at). */
  driver_arrived_at?: string | null;
}

interface FullScreenNavigationProps {
  activeTrip: ActiveTrip;
  driverCoords: Coordinates | null;
  userId: string;
  riderPhone: string | null;
  riderInfo?: RiderInfo | null;
  onTripUpdate: (trip: ActiveTrip) => void;
  onTripComplete: () => void;
  onExit: () => void;
  onStartCall: () => void;
  callStatus: string;
}

const ROUTE_REFETCH_INTERVAL = 30_000;
const MIN_MOVE_M = 50;
// A driver ending the trip more than this far from the recorded drop-off
// gets an "are you sure" — an accidental early end strands a passenger
// mid-journey with a completed trip on record.
const END_TRIP_CONFIRM_DISTANCE_M = 250;

function fmtUSD(n: number): string {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

function haversineM(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function useSmoothPosition(target: Coordinates | null): Coordinates | null {
  const [display, setDisplay] = useState<Coordinates | null>(target);
  const fromRef = useRef<Coordinates | null>(null);
  const toRef = useRef<Coordinates | null>(null);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!target) {
      setDisplay(null);
      return;
    }
    if (!fromRef.current) {
      fromRef.current = target;
      toRef.current = target;
      setDisplay(target);
      return;
    }

    fromRef.current = toRef.current ?? fromRef.current;
    toRef.current = target;
    startRef.current = performance.now();

    const animate = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / 1500);
      const eased = 1 - Math.pow(1 - t, 3);
      if (fromRef.current && toRef.current) {
        setDisplay({
          lat: fromRef.current.lat + (toRef.current.lat - fromRef.current.lat) * eased,
          lng: fromRef.current.lng + (toRef.current.lng - fromRef.current.lng) * eased,
        });
      }
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target?.lat, target?.lng]);

  return display;
}

interface NavigationMapProps {
  pickup: Coordinates;
  dropoff: Coordinates;
  driverCoords: Coordinates | null;
  routeGeometry: string | null;
  destination: Coordinates;
  mapCards: MapEtaCard[];
  recenterSignal: number;
}

/** Owns the map and the 60fps driver-position smoothing that used to live on
 * FullScreenNavigation itself — every eased animation frame re-rendered the
 * entire ~900-line screen (banner, bottom sheet, chat, buttons) instead of
 * just the marker. Isolating it here means that rAF loop only re-renders
 * this small leaf component. */
const NavigationMap = memo(function NavigationMap({
  pickup, dropoff, driverCoords, routeGeometry, destination, mapCards, recenterSignal,
}: NavigationMapProps) {
  const smoothPos = useSmoothPosition(driverCoords);
  const routeCoordinates = useMemo(
    () => (!routeGeometry ? ([smoothPos, destination].filter(Boolean) as Coordinates[]) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routeGeometry, smoothPos?.lat, smoothPos?.lng, destination.lat, destination.lng]
  );

  return (
    <div className="absolute inset-0">
      <MapboxMap
        pickup={pickup}
        dropoff={dropoff}
        driverLocation={smoothPos}
        routeGeometry={routeGeometry}
        routeCoordinates={routeCoordinates}
        routeGradient
        mapCards={mapCards}
        navigationFollow
        followZoom={17}
        recenterSignal={recenterSignal}
        className="h-full w-full"
        height="100%"
      />
    </div>
  );
});

/** Keeps the display awake for as long as this screen is mounted — a driver
 * following directions cannot have the phone sleep mid-navigation. No-op
 * (never throws) where the Wake Lock API isn't supported. Re-acquires on
 * visibility change, since the OS releases the lock whenever the tab/app
 * is backgrounded. */
function useWakeLock() {
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> } };
    const acquire = async () => {
      try {
        sentinel = (await nav.wakeLock?.request('screen')) ?? null;
      } catch {
        // Unsupported or denied — navigation still works, just no wake lock.
      }
    };
    void acquire();
    const onVisible = () => { if (document.visibilityState === 'visible') void acquire(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      sentinel?.release().catch(() => {});
    };
  }, []);
}

function ManeuverIcon({ step }: { step: RouteStep | null }) {
  const style = { width: 24, height: 24, color: '#fff' } as const;
  if (!step) return <NavigationIcon style={style} strokeWidth={2.4} />;
  const { type, modifier } = step.maneuver;
  if (type === "arrive") return <CheckCircle2 style={style} strokeWidth={2.4} />;
  if (type === "roundabout" || type === "rotary") return <RotateCw style={style} strokeWidth={2.4} />;
  if (modifier === "uturn") return <Undo2 style={style} strokeWidth={2.4} />;
  if (modifier?.includes("left")) return <CornerUpLeft style={style} strokeWidth={2.4} />;
  if (modifier?.includes("right")) return <CornerUpRight style={style} strokeWidth={2.4} />;
  return <ArrowUp style={style} strokeWidth={2.4} />;
}

function fmtDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m / 10) * 10} m`;
}

export default function FullScreenNavigation({
  activeTrip,
  driverCoords,
  userId,
  riderPhone,
  riderInfo,
  onTripUpdate,
  onTripComplete,
  onStartCall,
  callStatus,
}: FullScreenNavigationProps) {
  const navigate = useNavigate();
  const profilePath = '/driver/profile';

  const [route, setRoute] = useState<{ geometry: string; steps: RouteStep[]; distanceKm: number; durationMinutes: number } | null>(null);
  const [routeFailed, setRouteFailed] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastSpokenStepIndex, setLastSpokenStepIndex] = useState(-1);
  const [chatOpen, setChatOpen] = useState(false);
  const [guestDetailsRideId, setGuestDetailsRideId] = useState<string | null>(null);
  const latestTrip = useRef(activeTrip);
  latestTrip.current = activeTrip;
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [onboardConfirm, setOnboardConfirm] = useState(false);
  useEffect(() => { setNavigationStarted(false); setOnboardConfirm(false); }, [activeTrip.id, activeTrip.status]);
  const [noShowOpen, setNoShowOpen] = useState(false);
  const noShowReport = usePickupNoShowReport(activeTrip.id);
  useEffect(() => { setNoShowOpen(false); }, [activeTrip.id, activeTrip.status]);
  const unreadMessages = useUnreadRideMessages(activeTrip?.id, userId, chatOpen);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const completionLock = useRef(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const statusLock = useRef(false);
  const [confirmingEndTrip, setConfirmingEndTrip] = useState(false);
  const [destinationConfirmOpen, setDestinationConfirmOpen] = useState(false);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [riderNote, setRiderNote] = useState<string | null>(null);
  const lastFetchPhase = useRef("");
  const lastFetchPos = useRef<Coordinates | null>(null);
  const lastFetchTime = useRef(0);

  const [cancelling, setCancelling] = useState(false);
  const [cancelReasonOpen, setCancelReasonOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { speak, isSupported: voiceSupported } = useVoiceNavigation({ enabled: voiceEnabled });
  useWakeLock();

  useRideRealtime(activeTrip.id, {
    onRideChange: (event) => {
      const eventStatus = event?.type === "ride_started"
        ? "in_progress"
        : event?.type === "ride_completed"
          ? "completed"
          : eventString(event!, ["status"]);
      if (!eventStatus) return;

      if (eventStatus === "completed" || eventStatus === "cancelled") {
        if (eventStatus === "cancelled") {
          navigate(profilePath, { replace: true });
        } else if (voiceEnabled) {
          speak("Trip completed. Returning to dashboard.", true);
        }
        onTripComplete();
        return;
      }

      if (eventStatus !== activeTrip.status) {
        onTripUpdate({ ...activeTrip, status: eventStatus });
        lastFetchPhase.current = "";

        if (eventStatus === "arrived" && voiceEnabled) {
          speak("You have arrived at the pickup point.", true);
        } else if (eventStatus === "in_progress" && voiceEnabled) {
          speak("Rider picked up. Navigating to destination.", true);
        }
      }
    },
  });

  // The note the rider attached when booking — the driver is about to look
  // for a person, this is how they find them. Same trip_events source the
  // rider-side pickup note row reads from.
  useEffect(() => {
    let cancelled = false;
    supabase
      .from('trip_events')
      .select('payload')
      .eq('ride_id', activeTrip.id)
      .eq('event_type', 'rider_note')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const note = (data?.payload as Record<string, unknown> | null)?.note;
        if (typeof note === 'string' && note.trim()) setRiderNote(note);
      });
    return () => { cancelled = true; };
  }, [activeTrip.id]);

  const isPickupPhase = ["accepted", "enroute", "enroute_pickup"].includes(activeTrip.status);
  const isArrivedWaiting = activeTrip.status === "arrived";
  const isInTrip = activeTrip.status === "in_progress" || activeTrip.status === "ongoing";
  const origin = driverCoords;
  const destination = useMemo(
    () => (isPickupPhase || isArrivedWaiting
      ? { lat: activeTrip.pickup_lat, lng: activeTrip.pickup_lon }
      : { lat: activeTrip.dropoff_lat, lng: activeTrip.dropoff_lon }),
    [isPickupPhase, isArrivedWaiting, activeTrip.pickup_lat, activeTrip.pickup_lon, activeTrip.dropoff_lat, activeTrip.dropoff_lon]
  );
  const pickup = useMemo(() => ({ lat: activeTrip.pickup_lat, lng: activeTrip.pickup_lon }), [activeTrip.pickup_lat, activeTrip.pickup_lon]);
  const dropoff = useMemo(() => ({ lat: activeTrip.dropoff_lat, lng: activeTrip.dropoff_lon }), [activeTrip.dropoff_lat, activeTrip.dropoff_lon]);
  const phaseKey = isPickupPhase || isArrivedWaiting ? "pickup" : "dropoff";

  const fetchRoute = useCallback(async () => {
    if (!origin) return;
    const now = Date.now();
    const phaseChanged = lastFetchPhase.current !== phaseKey;
    const moved = !lastFetchPos.current || haversineM(lastFetchPos.current, origin) >= MIN_MOVE_M;
    const elapsed = now - lastFetchTime.current >= ROUTE_REFETCH_INTERVAL;
    if (!phaseChanged && !moved && !elapsed) return;

    lastFetchPhase.current = phaseKey;
    lastFetchPos.current = { ...origin };
    lastFetchTime.current = now;
    if (phaseChanged) setLastSpokenStepIndex(-1);

    const detailed = await getDetailedRoute(origin, destination);
    if (detailed) {
      setRoute({ geometry: detailed.geometry, steps: detailed.steps, distanceKm: detailed.distanceKm, durationMinutes: detailed.durationMinutes });
      setRouteFailed(false);
    } else {
      // OSRM unreachable — fall back to a straight-line estimate rather than
      // leaving the driver with no guidance at all.
      setRoute(null);
      setRouteFailed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lng, destination.lat, destination.lng, phaseKey]);

  useEffect(() => { fetchRoute(); }, [fetchRoute]);

  const { currentStep, currentStepIndex, distToManeuverM } = useMemo(() => {
    if (!route?.steps.length || !driverCoords) return { currentStep: null as RouteStep | null, currentStepIndex: 0, distToManeuverM: 0 };
    const { stepIndex } = findCurrentStep(route.steps, driverCoords);
    const step = route.steps[stepIndex];
    const dist = haversineM(driverCoords, { lat: step.maneuver.location[1], lng: step.maneuver.location[0] });
    return { currentStep: step, currentStepIndex: stepIndex, distToManeuverM: dist };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.steps, driverCoords?.lat, driverCoords?.lng]);

  useEffect(() => {
    if (!currentStep || !voiceEnabled || lastSpokenStepIndex === currentStepIndex) return;
    speak(getVoiceInstruction(currentStep, distToManeuverM));
    setLastSpokenStepIndex(currentStepIndex);
  }, [currentStep, currentStepIndex, voiceEnabled, lastSpokenStepIndex, distToManeuverM, speak]);

  // Self-heal: verify on mount that this ride still exists and is still in an
  // active state. DriverDashboard clears activeTrip only inside refresh(), so
  // a ride that expired, was cancelled by the rider, or was cleaned up
  // server-side can leave the driver stranded on a full-screen navigation for
  // a trip that no longer exists. One read on mount closes that hole.
  useEffect(() => {
    let cancelled = false;
    const ACTIVE = ['accepted', 'enroute', 'enroute_pickup', 'in_progress', 'arrived'];
    void (async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('status')
        .eq('id', activeTrip.id)
        .maybeSingle();
      if (cancelled || error) return;
      const status = (data as { status?: string } | null)?.status;
      if (!data || (status && !ACTIVE.includes(status))) {
        toast.info('This trip is no longer active');
        onTripComplete();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrip.id]);

  // Straight-line fallback distance/ETA when OSRM couldn't be reached.
  const straightDistanceM = driverCoords ? haversineM(driverCoords, destination) : 0;
  const totalDistanceKm = route ? route.distanceKm : straightDistanceM / 1000;
  const remainingDistanceKm = driverCoords ? haversineM(driverCoords, destination) / 1000 : totalDistanceKm;
  const etaMinutes = route
    ? Math.max(1, Math.round(route.durationMinutes * (remainingDistanceKm / Math.max(0.1, route.distanceKm))))
    : Math.max(1, Math.round((straightDistanceM / 1000 / 25) * 60));
  const mapCards: MapEtaCard[] = useMemo(
    () => (driverCoords
      ? [{ id: phaseKey, at: destination, label: isPickupPhase || isArrivedWaiting ? "Pickup" : "Drop-off", value: `${etaMinutes} min`, subvalue: `${remainingDistanceKm.toFixed(1)} km` }]
      : []),
    [driverCoords, phaseKey, destination, isPickupPhase, isArrivedWaiting, etaMinutes, remainingDistanceKm]
  );

  const handleStatusUpdate = async (newStatus: string, message: string, voiceMsg?: string) => {
    if (statusLock.current) return;
    statusLock.current = true; setStatusUpdating(true);
    try {
      await goBackend.post(`/api/rides/${activeTrip.id}/status`, {
        status: newStatus,
        expectedStatus: activeTrip.status,
      });
      onTripUpdate({ ...activeTrip, status: newStatus });
      toast.info(message);
      if (voiceEnabled && voiceMsg) speak(voiceMsg, true);
      lastFetchPhase.current = "";

      if (newStatus === "arrived") {
        createNotification({
          user_id: activeTrip.user_id,
          title: "Your driver has arrived",
          body: "Your driver is at the pickup point. Please meet them now.",
          notification_type: "driver_arrived",
        }).catch(() => {});

        // The status POST above doesn't return the row, and this client
        // never sets driver_arrived_at itself (trg_set_driver_arrived_at
        // does, server-side, in the same transaction as the status write)
        // — read it back so the waiting timer can start immediately instead
        // of waiting for the next full reload.
        // driver_arrived_at isn't in the generated types yet (column added
        // by a migration newer than the last typegen) — untyped client call.
        (supabase as any).from('rides').select('driver_arrived_at').eq('id', activeTrip.id).maybeSingle()
          .then(({ data }: any) => {
            if (data?.driver_arrived_at && latestTrip.current.id === activeTrip.id && latestTrip.current.status === 'arrived') {
              onTripUpdate({ ...latestTrip.current, driver_arrived_at: data.driver_arrived_at });
            }
          })
          .catch(() => {});
      }
    } catch (e: unknown) {
      toast.error("Failed to update trip", { description: (e as Error).message });
    } finally { statusLock.current = false; setStatusUpdating(false); }
  };

  const handleComplete = async () => {
    if (completionLock.current) return;
    completionLock.current = true;
    setCompleting(true);
    try {
      const result = await completeTrip(activeTrip.id);
      const r = result as Record<string, unknown>;
      if (!r?.ok) throw new Error((r?.reason as string) || "Failed to complete trip");
      toast.success("Trip completed!", { description: typeof r.driver_earnings_usd === 'number' && Number.isFinite(r.driver_earnings_usd) ? `Earned ${fmtUSD(r.driver_earnings_usd)}` : 'Your receipt is updating.' });
      if (voiceEnabled) speak("Trip completed. Great job!", true);
      setDestinationConfirmOpen(false);
      onTripComplete();
    } catch (e: unknown) {
      toast.error("Failed to complete trip", { description: (e as Error).message });
    } finally {
      completionLock.current = false;
      setCompleting(false);
      setConfirmingEndTrip(false);
    }
  };

  const handleEndTripTap = () => {
    const distFromDropoff = driverCoords ? haversineM(driverCoords, { lat: activeTrip.dropoff_lat, lng: activeTrip.dropoff_lon }) : 0;
    if (distFromDropoff > END_TRIP_CONFIRM_DISTANCE_M && !confirmingEndTrip) {
      setConfirmingEndTrip(true);
      return;
    }
    void handleComplete();
  };

  // Cancellation — recorded against the driver server-side (rideStatus
  // 'cancelled' + driverRowID set triggers recordReputationRideCancelled in
  // the Go handler); the reason is best-effort logged the same way the
  // rider-side cancel flow logs its reason.
  const submitCancel = async (reason: string) => {
    if (cancelling) return;
    setCancelling(true);
    try {
      await goBackend.post(`/api/rides/${activeTrip.id}/status`, {
        status: 'cancelled',
        expectedStatus: activeTrip.status,
      });
      if (reason) {
        supabase.from('trip_events').insert([{
          ride_id: activeTrip.id,
          actor_id: userId,
          event_type: 'ride_cancelled',
          payload: { reason, cancelled_by: 'driver' },
        }] as never).then(({ error }) => {
          if (error) console.warn('Could not log cancellation reason:', error.message);
        });
      }
      toast.info('Ride cancelled');
      navigate(profilePath, { replace: true });
      onTripComplete();
    } catch (e: unknown) {
      // A 404/409/410 can mean the server genuinely has no cancellable ride —
      // or that nothing answered at all (backend down, proxy error page), in
      // which case the ride is still very much active. Releasing the driver on
      // the status code alone bounced them to the profile screen, where the
      // dashboard's refresh re-found the still-accepted ride and put them right
      // back here — the button looked dead. Supabase is up independently of the
      // Go backend, so ask it what actually happened.
      const status = e instanceof GoBackendError ? e.status : undefined;
      let reallyOver = false;
      if (status === 404 || status === 409 || status === 410) {
        try {
          const { data: row } = await supabase
            .from('rides')
            .select('status')
            .eq('id', activeTrip.id)
            .maybeSingle();
          // No row, or a terminal status, means the trip really is finished.
          reallyOver = !row || ['cancelled', 'completed', 'expired'].includes(String((row as { status?: string }).status ?? ''));
        } catch {
          // Supabase read failed — treat as "not over" and keep the driver on screen.
        }
      }

      if (reallyOver) {
        toast.info('This trip is no longer active');
        navigate(profilePath, { replace: true });
        onTripComplete();
      } else {
        toast.error('Could not cancel', {
          description: 'The trip is still active. Check your connection and try again.',
        });
      }
    } finally {
      setCancelling(false);
      setCancelReasonOpen(false);
    }
  };


  const passengerName = activeTrip.passenger_name || riderInfo?.full_name || 'Passenger';
  const dialNumber = activeTrip.passenger_phone || riderPhone;
  const guestName = activeTrip.passenger_name?.trim();
  const guestDetailsOpen = Boolean(guestName) && guestDetailsRideId === activeTrip.id && activeTrip.status === 'accepted';


  if (noShowOpen && activeTrip.status === 'arrived') return (
    <div data-exception-scroll className="fixed inset-0 z-[100] overflow-y-auto bg-[#fcfbf9]">
      <DriverPickupNoShowScreen key={activeTrip.id} rideId={activeTrip.id} status={activeTrip.status} reportModel={noShowReport} onBack={() => setNoShowOpen(false)} onProfile={() => navigate(profilePath)} onContact={onStartCall} />
    </div>
  );

  const navigationMap = (<NavigationMap
        pickup={pickup}
        dropoff={dropoff}
        driverCoords={driverCoords}
        routeGeometry={route?.geometry ?? null}
        destination={destination}
        mapCards={mapCards}
        recenterSignal={recenterSignal}
      />);
  return (
    <motion.div data-map-screen="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] overflow-y-auto bg-background">
      {guestDetailsOpen ? (
        <DriverLifecycleLayout frameId="1261:509" sheetTop={249} contentOffset={33} map={<>{navigationMap}<span className="pointer-events-none absolute left-[73px] top-[52px] rounded-full bg-white/95 px-6 py-2 text-[10px] font-semibold">THIRD-PARTY BOOKING</span></>} onBack={() => setGuestDetailsRideId(null)} onRecenter={() => setRecenterSignal(value => value + 1)}>
          <DriverGuestPassengerDetails name={guestName || passengerName} phone={activeTrip.passenger_phone} />
        </DriverLifecycleLayout>
      ) : (isArrivedWaiting || (isPickupPhase && !navigationStarted && activeTrip.status === 'accepted')) ? (
        <DriverLifecycleLayout frameId={isArrivedWaiting ? onboardConfirm ? '1182:198' : '1153:225' : guestName ? '1263:124' : '1153:105'} map={navigationMap} onBack={() => navigate(profilePath)} onRecenter={() => setRecenterSignal(value => value + 1)} busy={cancelling || statusUpdating}>
          <DriverActiveTripContent phase={isArrivedWaiting ? onboardConfirm ? 'onboard' : 'arrived' : 'accepted'} passengerName={passengerName} avatarUrl={guestName ? undefined : riderInfo?.avatar_url} onPassengerDetails={guestName ? () => setGuestDetailsRideId(activeTrip.id) : undefined} passengerCount={activeTrip.passenger_count ?? null} pickup={activeTrip.pickup_address} destination={activeTrip.dropoff_address} fare={activeTrip.fare} paymentMethod={activeTrip.payment_method} riderNote={riderNote} arrivedAt={activeTrip.driver_arrived_at} busy={cancelling || statusUpdating} callDisabled={!dialNumber || callStatus !== 'idle'} unreadMessages={unreadMessages} onNavigate={() => setNavigationStarted(true)} onOnboard={() => setOnboardConfirm(true)} onStart={() => void handleStatusUpdate('in_progress', 'Trip started', 'Drive safely to the destination')} onBackToWaiting={() => setOnboardConfirm(false)} onNoShow={() => setNoShowOpen(true)} onCall={onStartCall} onMessage={() => setChatOpen(true)} onCancel={() => setCancelReasonOpen(true)} onSafety={() => setSafetyOpen(true)} />
        </DriverLifecycleLayout>
      ) : <>{navigationMap}


      {/* Navigation banner — owns the top of the screen, not the sheet. */}
      <div className="absolute z-20" style={{ top: 'calc(env(safe-area-inset-top) + 7px)', left: 16, right: 16 }}>
        <button
          type="button"
          onClick={() => setRecenterSignal((s) => s + 1)}
          className="flex items-center w-full text-left active:scale-[0.98] transition-transform"
          style={{ padding: '12px 14px', borderRadius: 18, gap: 12, background: RIDE_RED, boxShadow: '0 12px 28px rgba(184,17,4,.32), inset 0 1px 0 rgba(255,255,255,.28)' }}
        >
          <ManeuverIcon step={currentStep} />
          <div className="min-w-0" style={{ flex: 1 }}>
            <p className="tabular-nums" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.1, color: '#fff' }}>
              {driverCoords ? fmtDistance(currentStep ? distToManeuverM : straightDistanceM) : 'GPS pending'}
            </p>
            <p className="truncate" style={{ marginTop: 2, fontSize: 12.5, fontWeight: 500, lineHeight: 1.2, color: 'rgba(255,255,255,.85)' }}>
              {currentStep ? getManeuverInstruction(currentStep) : (isPickupPhase || isArrivedWaiting ? 'Head to pickup' : 'Head to drop-off')}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="tabular-nums" style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{driverCoords && route ? `${etaMinutes} min` : 'ETA pending'}</p>
            <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.78)' }}>
              to {isPickupPhase || isArrivedWaiting ? 'pickup' : 'drop-off'}
            </p>
          </div>
        </button>
      </div>

      {/* Voice + minimize controls, right side */}
      <div className="absolute right-4 z-20 flex flex-col gap-3" style={{ top: 'calc(env(safe-area-inset-top) + 76px)' }}>
        <button
          type="button"
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          aria-label="Toggle voice"
          className="flex items-center justify-center active:scale-90 transition-transform"
          style={{ width: 44, height: 44, borderRadius: 999, ...glassSurface }}
        >
          {voiceEnabled && voiceSupported ? <Volume2 style={{ width: 19, height: 19, color: RIDE_TEXT }} /> : <VolumeX style={{ width: 19, height: 19, color: RIDE_TEXT_2 }} />}
        </button>
      </div>



      {routeFailed && <p role="status" className="absolute left-4 top-[160px] z-20 max-w-[75%] rounded-xl bg-white px-3 py-2 text-xs text-[#667085]">Live directions are unavailable. Distances use a direct-line estimate.</p>}
      <DriverNavigationDock destinationPhase={isInTrip} passengerName={passengerName} address={isInTrip ? activeTrip.dropoff_address : activeTrip.pickup_address} etaMinutes={driverCoords && route ? etaMinutes : null} distanceKm={driverCoords ? remainingDistanceKm : null} paymentMethod={activeTrip.payment_method} busy={completing || cancelling || statusUpdating} callDisabled={!dialNumber || callStatus !== 'idle'} unreadMessages={unreadMessages} onCall={onStartCall} onMessage={() => setChatOpen(true)} onArrive={() => void handleStatusUpdate('arrived', 'Arrived at pickup', 'Waiting for the rider')} onSafety={() => setSafetyOpen(true)} onDestination={() => setDestinationConfirmOpen(true)} onCancel={() => setCancelReasonOpen(true)} />
      </>}
      <DriverMessageSheet
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        rideId={activeTrip.id}
        currentUserId={userId}
        viewerRole="driver"
        driverUserId={userId}
        passengerName={passengerName}
        passengerPhone={dialNumber}
        etaMinutes={etaMinutes}
      />


      {destinationConfirmOpen && isInTrip && (
        <DriverDestinationReached
          mapNode={navigationMap}
          passengerName={passengerName}
          passengerCount={activeTrip.passenger_count ?? null}
          destination={activeTrip.dropoff_address}
          fare={activeTrip.fare}
          paymentMethod={activeTrip.payment_method}
          confirming={completing}
          farFromDropoff={confirmingEndTrip}
          onBack={() => {
            if (completing) return;
            setDestinationConfirmOpen(false);
            setConfirmingEndTrip(false);
          }}
          onConfirm={handleEndTripTap}
        />
      )}

      {/* Cancel reason — asked after a completed hold, before the cancel actually submits */}
      <AnimatePresence>
        {cancelReasonOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110]" style={{ background: 'rgba(17,17,17,.4)' }}
              onClick={() => !cancelling && setCancelReasonOpen(false)}
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="fixed left-4 right-4 z-[120]" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
            >
              <div className="flex flex-col" style={{ background: '#fff', borderRadius: 20, padding: 16, gap: 10, boxShadow: '0 20px 50px rgba(0,0,0,.25)' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: RIDE_TEXT }}>Why are you cancelling?</p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Rider unreachable, wrong pickup pin…"
                  rows={2}
                  maxLength={140}
                  className="w-full outline-none resize-none"
                  style={{ padding: '8px 10px', borderRadius: 10, fontSize: 13, background: 'rgba(17,17,17,.04)', color: RIDE_TEXT }}
                />
                <div className="flex items-center" style={{ gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setCancelReasonOpen(false); setCancelReason(''); }}
                    disabled={cancelling}
                    className="flex-1 flex items-center justify-center active:scale-95 transition-transform"
                    style={{ height: 44, borderRadius: 12, background: 'rgba(17,17,17,.06)' }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: RIDE_TEXT_2 }}>Never mind</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => submitCancel(cancelReason.trim())}
                    disabled={cancelling}
                    className="flex-1 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-60"
                    style={{ height: 44, borderRadius: 12, background: RIDE_RED }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{cancelling ? 'Cancelling…' : 'Cancel ride'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SafetySheet
        open={safetyOpen}
        onClose={() => setSafetyOpen(false)}
        rideId={activeTrip.id}
        counterpartName={passengerName}
        counterpartAvatarUrl={riderInfo?.avatar_url}
        plateNumber={null}
        startedAt={null}
        pickupAddress={activeTrip.pickup_address}
        dropoffAddress={activeTrip.dropoff_address}
        role="driver"
      />
    </motion.div>
  );
}

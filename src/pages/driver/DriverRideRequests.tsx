import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import LazyMapboxMap from '@/components/map/LazyMapboxMap';
import { NotificationBell } from '@/components/NotificationCenter';
import { supabase } from '@/lib/supabaseClient';
import { getDriverProfile, submitOffer, defaultNightMultiplier } from '@/lib/offerHelpers';
import { fetchEnrichedOpenRides, type EnrichedRideRequest } from '@/lib/driverRideRequests';
import { expireOldRides } from '@/lib/rideExpiry';
import { useTrackRideViewer } from '@/lib/rideViewerPresence';
import { playNewRequestSound } from '@/lib/notificationSounds';
import { vibrateAlert, showBrowserNotification } from '@/lib/alerts';
import { getDismissedRideIds, dismissRide, undismissRide } from '@/lib/driverDismissedRides';
import RideGlassPanel from '@/components/ride/RideGlassPanel';
import SwipeDismissCard from '@/components/driver/SwipeDismissCard';
import GenderChip from '@/components/driver/GenderChip';
import DriverBottomNav from '@/components/driver/DriverBottomNav';
import { redCta, RIDE_FONT, RIDE_RED, RIDE_TEXT, RIDE_TEXT_2 } from '@/components/ride/rideGlass';
import DriverAvailabilityControl from '@/components/driver/DriverAvailabilityControl';
import { getDriverEarnings } from '@/lib/walletApi';

function fmtUSD(n: number): string {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

const AUTO_ACCEPT_KEY = 'pickme-driver-auto-accept';
const actionClass = 'min-h-11 rounded-[14px] px-3 text-sm font-semibold';

export default function DriverRideRequests() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const view = params.get('view');
  const showHome = view === 'home';
  const showWaiting = view === 'waiting';
  const showDrive = view === 'drive';
  const [rides, setRides] = useState<EnrichedRideRequest[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => getDismissedRideIds());
  const [loading, setLoading] = useState(true);
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [earnings, setEarnings] = useState<number | null>(null);
  const [tripsToday, setTripsToday] = useState<number | null>(null);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [requestKind, setRequestKind] = useState<'ride' | 'parcel' | null>(null);
  const [autoAccept] = useState(() => localStorage.getItem(AUTO_ACCEPT_KEY) === '1');
  const autoAcceptedIds = useRef<Set<string>>(new Set());
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [undoRide, setUndoRide] = useState<EnrichedRideRequest | null>(null);
  const lastRideIds = useRef<Set<string>>(new Set());
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastExpirySweep = useRef(0);


  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setDriverCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  const [driverRowId, setDriverRowId] = useState<string | null>(null);
  const handleAvailabilityChange = useCallback((online: boolean) => {
    setIsOnline(online);
    if (!online) { setRides([]); lastRideIds.current = new Set(); }
  }, []);
  useEffect(() => {
    getDriverProfile().then((p) => { setIsOnline(p?.is_online ?? false); setDriverRowId(p?.id ?? null); }).catch(() => {});
  }, []);

  // If a rider accepts this driver's offer while they're sitting on this
  // screen (or the app relaunches mid-trip — force-quit recovery), bounce
  // straight to /driver/dashboard, which owns rendering FullScreenNavigation
  // for an active trip. Without this, an accepted ride only showed up if the
  // driver happened to already be on the dashboard route.
  useEffect(() => {
    if (!driverRowId) return;
    let cancelled = false;
    const checkActiveTrip = async () => {
      const { data } = await supabase
        .from('rides')
        .select('id')
        .eq('driver_id', driverRowId)
        .in('status', ['accepted', 'arrived', 'in_progress'])
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) navigate('/driver/dashboard', { replace: true });
    };
    checkActiveTrip();
    const channel = supabase
      .channel(`driver-active-trip-${driverRowId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `driver_id=eq.${driverRowId}` }, () => { checkActiveTrip(); })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [driverRowId, navigate]);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      supabase.from('profiles').select('full_name').eq('user_id', uid).maybeSingle()
        .then(({ data: profile }) => {
          if (!cancelled && profile?.full_name) setDriverName(profile.full_name.trim().split(/\s+/)[0]);
        });
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!driverRowId || !showHome) return;
    let cancelled = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    void getDriverEarnings().then((entries) => {
      if (cancelled) return;
      const total = entries
        .filter((entry) => new Date(entry.created_at) >= today)
        .reduce((sum, entry) => sum + entry.driver_earnings, 0);
      setEarnings(total);
    }).catch(() => {});
    supabase.from('rides').select('id', { count: 'exact', head: true })
      .eq('driver_id', driverRowId).eq('status', 'completed').gte('created_at', today.toISOString())
      .then(({ count, error }) => { if (!cancelled && !error) setTripsToday(count); });
    return () => { cancelled = true; };
  }, [driverRowId, showHome]);

  const refresh = useCallback(async () => {
    try {
      // The expiry sweep is a write-heavy admin RPC — at a 5s refresh cadence
      // it only needs to run once a minute, and it must never delay showing a
      // freshly broadcast request, so it is fired-and-forgotten.
      if (Date.now() - lastExpirySweep.current > 60_000) {
        lastExpirySweep.current = Date.now();
        void expireOldRides();
      }
      const profile = await getDriverProfile();

      const online = profile?.is_online ?? false;
      setIsOnline(online);
      if (!online) {
        setRides([]);
        lastRideIds.current = new Set();
        return;
      }
      const list = await fetchEnrichedOpenRides(profile?.gender);
      setRides(list);

      const currentIds = new Set(list.map((r) => r.id));
      let hasNewRide = false;
      for (const id of currentIds) {
        if (!lastRideIds.current.has(id)) { hasNewRide = true; break; }
      }
      if (hasNewRide) {
        playNewRequestSound();
        vibrateAlert();
        showBrowserNotification('🚗 New Ride Request', 'A rider is looking for a driver near you', '/driver/requests');
      }
      lastRideIds.current = currentIds;

      if (autoAccept) {
        for (const ride of list) {
          if (autoAcceptedIds.current.has(ride.id)) continue;
          autoAcceptedIds.current.add(ride.id);
          const mult = defaultNightMultiplier();
          const price = Math.max(0.5, Math.round(ride.fare * mult * 2) / 2);
          submitOffer({ ride_id: ride.id, price, eta_minutes: 10 })
            .then(() => toast.success('Auto-accepted a ride', { description: `${fmtUSD(price)} offer sent` }))
            .catch(() => {});
        }
      }
    } catch (e) {
      toast.error('Could not load ride requests', { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [autoAccept]);

  useEffect(() => {
    refresh();
    // Unfiltered on purpose — a ride leaving 'pending' (another driver took
    // it, the rider cancelled) needs to disappear from this list too, and
    // Supabase realtime filters can only match the row's new/old value, not
    // "status changed away from pending". Debounced instead: a burst of
    // unrelated rides changing status system-wide (which every online
    // driver's list is subscribed to) collapses into one refetch instead of
    // one per event — with 100 concurrent drivers, an un-debounced refetch
    // per system-wide ride write was a real O(rides × drivers) query storm.
    const scheduleRefresh = () => {
      if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
      refreshDebounceRef.current = setTimeout(refresh, 400);
    };
    const channel = supabase
      .channel('driver-open-rides-list')
      // A brand new request must land on the driver's screen immediately —
      // no debounce on INSERT. Status churn from other rides stays debounced.
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides' }, () => refresh())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides' }, scheduleRefresh)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rides' }, scheduleRefresh)
      .subscribe();
    // Fallback poll: realtime can drop on mobile networks, so guarantee a new
    // request is seen within 5s regardless.
    const id = setInterval(refresh, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(id);
      if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
    };
  }, [refresh]);

  const minutesAwayFor = (ride: EnrichedRideRequest): number | null => {
    if (!driverCoords || ride.pickup_lat == null || ride.pickup_lon == null) return null;
    const dLat = (ride.pickup_lat - driverCoords.lat) * 111;
    const dLng = (ride.pickup_lon - driverCoords.lng) * 111 * Math.cos((driverCoords.lat * Math.PI) / 180);
    const km = Math.sqrt(dLat * dLat + dLng * dLng);
    return Math.max(1, Math.round((km / 25) * 60));
  };

  const distanceKmFor = (ride: EnrichedRideRequest): number | null => {
    if (!driverCoords || ride.pickup_lat == null || ride.pickup_lon == null) return null;
    const dLat = (ride.pickup_lat - driverCoords.lat) * 111;
    const dLng = (ride.pickup_lon - driverCoords.lng) * 111 * Math.cos((driverCoords.lat * Math.PI) / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  };

  const visibleRides = useMemo(() => {
    return rides
      .filter((r) => !dismissedIds.has(r.id))
      .map((r) => ({ ride: r, minutes: minutesAwayFor(r), km: distanceKmFor(r) }))
      .sort((a, b) => (a.minutes ?? 999) - (b.minutes ?? 999));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rides, dismissedIds, driverCoords]);

  const handleDismiss = (ride: EnrichedRideRequest) => {
    dismissRide(ride.id);
    setDismissedIds((prev) => new Set(prev).add(ride.id));
    setUndoRide(ride);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoRide((cur) => (cur?.id === ride.id ? null : cur)), 4000);
  };

  const handleUndo = () => {
    if (!undoRide) return;
    undismissRide(undoRide.id);
    setDismissedIds((prev) => { const next = new Set(prev); next.delete(undoRide.id); return next; });
    setUndoRide(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const filteredRides = visibleRides.filter(({ ride }) => {
    const isParcel = ride.vehicle_type === 'parcel';
    return requestKind === null || (requestKind === 'parcel' ? isParcel : !isParcel);
  });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const handleAvailabilityApplied = (online: boolean) => {
    navigate(online ? '/driver/requests?view=waiting' : '/driver/requests?view=home', { replace: true });
  };

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-[#f2f4f7] text-[#1f2129]" style={{ fontFamily: RIDE_FONT }}>
      <div className="absolute inset-0">
        <LazyMapboxMap
          defaultCenter={driverCoords ?? undefined}
          driverLocation={driverCoords}
          height="100%"
          navigationFollow={recenterSignal > 0}
          recenterSignal={recenterSignal}
          followZoom={13}
        />
      </div>

      <div className="absolute inset-x-0 top-[max(16px,env(safe-area-inset-top))] z-20 mx-auto flex max-w-[480px] items-center gap-2 px-4">
        <button
          type="button"
          onClick={() => navigate(showHome ? '/profile' : '/driver/requests?view=home')}
          className="grid size-11 place-items-center rounded-full bg-white shadow-sm"
          aria-label={showHome ? 'Back to Rider account' : 'Back to Driver home'}
        >
          <img src="/brand/ride/driver-back.svg" alt="" />
        </button>
        <span className="grid size-11 place-items-center rounded-full bg-white shadow-sm" aria-hidden="true">
          <img src="/brand/ride/map-location.svg" alt="" className="size-5" />
        </span>
        <NotificationBell className="ml-auto size-11 bg-white shadow-sm" iconSource="/brand/ride/driver-notifications.svg" />
      </div>

      <div className="absolute inset-x-0 bottom-0 top-[clamp(166px,52dvh,540px)] z-10 mx-auto flex max-w-[480px] flex-col">
        {driverCoords && (
          <button
            type="button"
            onClick={() => setRecenterSignal((value) => value + 1)}
            className="absolute -top-[70px] right-4 grid size-11 place-items-center rounded-full bg-white shadow-sm"
            aria-label="Center map on your location"
          >
            <img src="/brand/ride/map-recenter.svg" alt="" className="size-[21px]" />
          </button>
        )}
        <RideGlassPanel variant="ribbon" handleWidth={56} className="min-h-0 flex-1">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(104px,calc(86px_+_env(safe-area-inset-bottom)))] pt-3">
            {showHome ? (
              <div className="flex flex-col gap-3">
                <div>
                  <h1 className="text-[21px] font-bold leading-tight">{greeting}{driverName ? `, ${driverName}` : ''}</h1>
                  <p className="mt-1 text-xs text-[#667085]">Ready when you are. Drive on your schedule.</p>
                </div>
                <div className="relative rounded-[17px] border border-[#e4e7ed] bg-white p-3.5">
                  <img src="/brand/ride/availability-accent.svg" alt="" className="pointer-events-none absolute inset-x-0 top-0 h-auto w-full rounded-[17px]" />
                  <div className="relative flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2.5 text-[15px] font-bold">
                      <span className={`size-3 shrink-0 rounded-full ${isOnline ? 'bg-[#138862]' : 'bg-[#667085]'}`} />
                      {isOnline ? 'You’re online' : 'You’re offline'}
                    </p>
                    <DriverAvailabilityControl
                      isOnline={isOnline}
                      onChange={handleAvailabilityChange}
                      onApplied={handleAvailabilityApplied}
                      coords={driverCoords}
                      appearance="switch"
                    />
                  </div>
                  <p className="relative text-[11px] text-[#667085]">{isOnline ? 'Available for verified ride requests' : 'Turn on when you’re ready for requests'}</p>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#667085]">Your drive at a glance</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => navigate('/driver/wallet')} className="rounded-[17px] bg-[#f3f4f6] p-3 text-left">
                      <span className="block text-[11px] text-[#667085]">Today’s earnings</span>
                      <strong className="mt-0.5 block text-lg">{earnings === null ? '—' : `$${earnings.toFixed(2)}`}</strong>
                    </button>
                    <button type="button" onClick={() => navigate('/driver/trips')} className="rounded-[17px] bg-[#f3f4f6] p-3 text-left">
                      <span className="block text-[11px] text-[#667085]">Trips today</span>
                      <strong className="mt-0.5 block text-lg">{tripsToday ?? '—'}</strong>
                    </button>
                  </div>
                </div>
              </div>
            ) : showWaiting ? (
              <div className="flex flex-col gap-3">
                <h1 className="text-[21px] font-bold leading-tight">Waiting for ride requests</h1>
                <p className="text-xs text-[#667085]">Stay online to receive your next booking.</p>
                <div className="rounded-[17px] bg-[#1f2129] p-4 text-white">
                  <p className="flex items-center gap-2.5 text-sm font-semibold">
                    <span className={`size-3 rounded-full ${isOnline ? 'bg-[#22b364]' : 'bg-[#667085]'}`} />
                    {isOnline ? 'You’re online' : 'You’re offline'}
                  </p>
                  <p className="mt-1.5 text-xs">{isOnline ? 'Ready for incoming ride requests' : 'Go online when you’re ready for requests'}</p>
                </div>
                <button type="button" onClick={() => navigate('/driver/requests')} className="rounded-[14px] border border-[#e4e7ed] bg-[#f3f4f6] px-3 py-2 text-left">
                  <span className="block text-sm font-semibold">
                    {visibleRides.length > 0 ? `${visibleRides.length} incoming ${visibleRides.length === 1 ? 'request' : 'requests'}` : 'No incoming requests yet'}
                  </span>
                  <span className="block text-[11px] text-[#667085]">New bookings will appear in Requests.</span>
                </button>
                <DriverAvailabilityControl
                  isOnline={isOnline}
                  onChange={handleAvailabilityChange}
                  onApplied={handleAvailabilityApplied}
                  coords={driverCoords}
                  appearance="outline"
                />
              </div>
            ) : showDrive ? (
              <div className="flex flex-col gap-3">
                <h1 className="text-[21px] font-bold leading-tight">Drive status</h1>
                <p className="text-xs text-[#667085]">Review trip changes and driving tools.</p>
                <div className="rounded-[17px] border border-[#e4e7ed] bg-[#f3f4f6] p-4">
                  <p className="font-bold">No trip in progress</p>
                  <p className="mt-4 text-xs text-[#667085]">Your next confirmed trip appears here.</p>
                </div>
                <button type="button" onClick={() => navigate('/driver/trips')} className={`${actionClass} bg-primary text-primary-foreground`}>Trip history</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <h1 className="text-[21px] font-bold leading-tight">Ride requests</h1>
                <p className="text-xs text-[#667085]">Requests arrive here when you’re online and approved.</p>
                <div className="flex gap-3">
                  {(['ride', 'parcel'] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      aria-pressed={requestKind === kind}
                      onClick={() => setRequestKind((current) => current === kind ? null : kind)}
                      className={`${actionClass} flex-1 border border-primary ${requestKind === kind ? 'bg-primary text-primary-foreground' : 'bg-white text-[#111]'}`}
                    >
                      {kind === 'ride' ? 'Ride requests' : 'Parcel requests'}
                    </button>
                  ))}
                </div>
                {loading ? (
                  <div role="status" className="h-20 animate-pulse rounded-[17px] bg-[#f3f4f6]" aria-label="Loading requests" />
                ) : filteredRides.length === 0 ? (
                  <div className="rounded-[17px] border border-[#e4e7ed] bg-[#f3f4f6] p-4">
                    <p className="font-bold">No active requests</p>
                    <p className="mt-4 text-xs text-[#667085]">{isOnline ? 'New bookings will appear here.' : 'Go online on Home to receive offers.'}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-[#667085]">Swipe a card left to dismiss.</p>
                    {filteredRides.map(({ ride, km, minutes }) => (
                      <SwipeDismissCard key={ride.id} onDismiss={() => handleDismiss(ride)}>
                        <RequestCard ride={ride} km={km} minutes={minutes} onView={() => navigate(`/driver/ride/${ride.id}`)} onDismiss={() => handleDismiss(ride)} />
                      </SwipeDismissCard>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </RideGlassPanel>
      </div>

      {undoRide && (
        <div className="absolute inset-x-0 bottom-24 z-30 flex justify-center">
          <div className="flex items-center gap-3 rounded-full bg-[#1f2129] px-4 py-2.5 text-xs font-semibold text-white shadow-lg">
            <span>Request dismissed</span>
            <button type="button" onClick={handleUndo} className="font-bold text-[#ffdd00]">Undo</button>
          </div>
        </div>
      )}

      <DriverBottomNav requestBadgeCount={visibleRides.length} />
    </main>
  );
}

function RequestCard({
  ride, km, minutes, onView, onDismiss,
}: {
  ride: EnrichedRideRequest;
  km: number | null;
  minutes: number | null;
  onView: () => void;
  onDismiss: () => void;
}) {
  // Marks this driver as "viewing" the ride for as long as this card is
  // mounted, so the rider sees a live "N drivers are viewing your request"
  // count (RideMatching.tsx's useRideViewerCount) while they wait.
  useTrackRideViewer(ride.id);

  return (
    <div
      style={{ borderRadius: 20, background: '#fff', boxShadow: '0 8px 20px rgba(17,17,17,.08), inset 0 0 0 .5px rgba(17,17,17,.05)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div className="flex items-start" style={{ gap: 12 }}>
        <span className="shrink-0 flex items-center justify-center rounded-full overflow-hidden" style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#C6CBD4,#868E9B)', boxShadow: '0 0 0 2px rgba(255,255,255,.95)' }}>
          {ride.passenger_avatar_url ? (
            <img src={ride.passenger_avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User style={{ width: 22, height: 22, color: '#fff' }} strokeWidth={2} />
          )}
        </span>
        <div className="min-w-0" style={{ flex: 1 }}>
          <div className="flex items-center" style={{ gap: 6 }}>
            <p className="truncate" style={{ fontSize: 15, fontWeight: 700, color: RIDE_TEXT }}>{ride.passenger_display_name ?? 'Rider'}</p>
            <GenderChip gender={ride.passenger_gender} />
          </div>
          <p className="flex items-center truncate" style={{ gap: 5, fontSize: 12, fontWeight: 600, color: RIDE_TEXT_2, marginTop: 4 }}>
            <span className="rounded-full shrink-0" style={{ width: 6, height: 6, background: '#1A73E8' }} />
            {ride.pickup_address}
          </p>
          <p className="flex items-center truncate" style={{ gap: 5, fontSize: 12, fontWeight: 600, color: RIDE_TEXT_2, marginTop: 3 }}>
            <span className="rounded-full shrink-0" style={{ width: 6, height: 6, background: RIDE_RED }} />
            {ride.dropoff_address}
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="tabular-nums" style={{ fontSize: 19, fontWeight: 800, color: RIDE_RED, lineHeight: 1.1 }}>{fmtUSD(ride.fare)}</span>
          <span className="tabular-nums" style={{ fontSize: 11.5, fontWeight: 600, color: RIDE_TEXT_2, marginTop: 3 }}>
            {km != null ? `${km.toFixed(1)} km` : 'Nearby'}{minutes != null ? ` · ${minutes} min` : ''}
          </span>
        </div>
      </div>

      <div className="flex items-center" style={{ gap: 8 }}>
        <button
          type="button"
          onClick={onView}
          className="flex-1 flex items-center justify-center active:scale-[0.97] transition-transform"
          style={{ height: 44, borderRadius: 14, ...redCta }}
        >
          <span style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>View request</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 flex items-center justify-center active:scale-[0.97] transition-transform"
          style={{ height: 44, padding: '0 18px', borderRadius: 14, background: '#fff', boxShadow: `inset 0 0 0 1.5px ${RIDE_RED}` }}
        >
          <span style={{ fontSize: 14.5, fontWeight: 700, color: RIDE_RED }}>Decline</span>
        </button>
      </div>
    </div>
  );
}

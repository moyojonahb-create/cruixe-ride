const rider = { id: 'isolated-ui-rider', user_metadata: { full_name: 'Fixture rider' } };
export const fixtureEvents: Array<{ action: string; detail?: unknown }> = [];
export function blocked(action: string): never {
  fixtureEvents.push({ action });
  throw new Error('ISOLATED FIXTURE: service mutation blocked: ' + action);
}
export const useAuth = () => ({ user: rider, loading: false });
export const useWallet = () => ({ balance: Number(new URLSearchParams(location.search).get('wallet') ?? 12.5), loading: false });
export const usePricingSettings = () => ({ data: null });
const pricing = { id: 'fixture-pricing', town_id: 'gwanda', town_name: 'Fixture town', currency_code: 'USD', currency_symbol: '$', base_fare: 2, per_km_rate: 1.25, minimum_fare: 1, offer_floor: 1, offer_ceiling: 50, night_multiplier: 1, demand_multiplier: 1, is_negotiation_enabled: true };
export const useTownPricing = () => ({ pricing, loading: false });
export const useOSRMRoute = (pickup: unknown, dropoff: unknown) => ({ route: pickup && dropoff ? { distanceKm: 3, durationMinutes: 9, geometry: null, isEstimate: true } : null, loading: false, error: null });
const empty: never[] = [];
const fixturePlaces = [1, 2, 3].map(n => ({ id: `fixture-place-${n}`, name: n === 1 ? 'Fixture destination' : `Fixture destination ${n}`, category: 'ISOLATED test data', latitude: -20.95 - n * .001, longitude: 29.02, matchScore: 100 - n }));
export const useLandmarks = (options: { searchQuery?: string } = {}) => ({ landmarks: options.searchQuery?.toLowerCase().includes('fixture') ? fixturePlaces : empty, loading: false, error: null, findNearestLandmark: () => null });
export const useStreets = () => ({ streets: empty, loading: false, error: null });
export const useAppBootstrap = () => ({ favorites: empty, recentRides: empty, loading: false });
export const useNearbyDrivers = () => empty;
export const useRideViewerCount = () => 0;
export const useRideRealtime = () => {};
export const useStudentDiscountAvailable = () => ({ available: false, usedToday: 0, dailyCap: 0 });
export const useRiderPreferences = () => ({ prefs: { gender: 'male', gender_preference: 'any', quiet_ride: false, cool_temperature: false, wav_required: false, hearing_impaired: false }, loaded: true });
export const haptic = () => {};
export const toast = (detail: unknown) => fixtureEvents.push({ action: 'toast', detail });
export const useToast = () => ({ toast });
const readResult = { data: null, error: null };
function query(): any {
  const chain: any = new Proxy({}, { get: (_target, key) => {
    if (key === 'then') return Promise.resolve(readResult).then.bind(Promise.resolve(readResult));
    if (['insert', 'update', 'upsert', 'delete'].includes(String(key))) return () => blocked('supabase.' + String(key));
    if (['single', 'maybeSingle'].includes(String(key))) return async () => readResult;
    return () => chain;
  } });
  return chain;
}
export const supabase: any = { from: query, auth: { getSession: async () => ({ data: { session: null }, error: null }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) }, channel: () => ({ on() { return this; }, subscribe() { return this; }, unsubscribe() {} }), removeChannel() {}, functions: { invoke: () => blocked('edge function') } };
export const goBackend = { get: async () => { throw new Error('ISOLATED FIXTURE: backend reads unavailable'); }, post: () => blocked('backend.post') };
export const requestRide = async (detail: unknown) => { fixtureEvents.push({ action: 'requestRide denied', detail }); return { ok: false, error: 'ISOLATED FIXTURE: booking is disabled; no ride was created' }; };
export const searchCachedPlacesPrefix = async () => [];
export const cachePlaceFromNominatim = async () => {};
export const getCachedPlaceDetails = async () => null;
export const resolveCachedPlaceSelection = async () => null;
export const reverseZW = async () => ({ name: 'Fixture map selection' });
const photoUrls = new Map<string, string>();
export async function uploadLuggagePhoto(file: File) {
  const key = 'isolated-photo-' + photoUrls.size;
  photoUrls.set(key, URL.createObjectURL(file)); fixtureEvents.push({ action: 'in-memory photo added' }); return key;
}
export async function deleteLuggagePhoto(key: string) { const url = photoUrls.get(key); if (url) URL.revokeObjectURL(url); photoUrls.delete(key); fixtureEvents.push({ action: 'in-memory photo removed' }); }
export async function getLuggageSignedUrls(keys: string[]) { return keys.map(key => photoUrls.get(key) ?? ''); }
export const fetchPendingOffers = async () => [];
export const fetchDriversByIds = async () => [];
export const acceptOffer = () => blocked('acceptOffer');
export const declineOffer = () => blocked('declineOffer');
export const backendSocketClient = { on: () => () => {}, off() {}, subscribe: () => () => {}, connect() {}, disconnect() {}, joinRideRoom() {}, leaveRideRoom() {} };
export const eventDriverId = () => null;
export const eventOfferId = () => null;
export const eventNumber = () => null;
export const eventString = () => null;
export const subscribeRideLocation = () => () => {};
export const useAgoraCall = () => ({ callStatus: 'idle', callState: 'idle', isSpeaker: false, callDuration: 0, answerCall: () => blocked('call'), toggleSpeaker() {}, incomingCall: null, localAudioTrack: null, remoteAudioTrack: null, isMuted: false, startCall: () => blocked('call'), acceptCall: () => blocked('call'), declineCall() {}, endCall() {}, toggleMute() {} });
export const useUnreadRideMessages = () => 0;
export const fetchRideById = async () => ({ id: 'isolated-pending-ui-state', user_id: rider.id, driver_id: null, distance_km: 3, duration_minutes: 9, status: 'requested', pickup_address: 'Fixture pickup', pickup_lat: -20.9355, pickup_lon: 29.0147, dropoff_address: 'Fixture destination', dropoff_lat: -20.95, dropoff_lon: 29.02, fare: 6, payment_method: 'cash', vehicle_type: 'economy', passenger_count: 1, created_at: new Date().toISOString(), town_id: 'gwanda', route_polyline: null });
export const fetchAssignedDriver = async () => null;
export const updateRideFare = () => blocked('updateRideFare');
export const cancelRideRequest = () => blocked('cancelRideRequest');
export const createNotification = () => blocked('notification');
export const createRidePreferences = () => blocked('preferences');
export const createRideStops = () => blocked('stops');
export const createStudentDiscountUsage = () => blocked('student discount');
export const submitDriverRating = () => blocked('rating');
export const createTip = () => blocked('tip');

export const formatCallDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
export const createEmergencyEvent = () => blocked("createEmergencyEvent");
export const submitDispute = () => blocked("submitDispute");
export const markNotificationRead = () => blocked("markNotificationRead");
export const markNotificationsRead = () => blocked("markNotificationsRead");
export const updateMyProfile = () => blocked("updateMyProfile");

export const SUPABASE_URL = null;
export const SUPABASE_PUBLISHABLE_KEY = null;
export const getGoBackendBaseUrl = () => null;

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
const root = __dirname;
const services = path.resolve(root, 'qa-stabilization/fixture-services.ts');
const mocked = ['hooks/useAuth', 'hooks/useWallet', 'hooks/usePricingSettings', 'hooks/useOSRMRoute', 'hooks/useLandmarks', 'hooks/useStreets', 'hooks/useAppBootstrap', 'hooks/useNearbyDrivers', 'hooks/useRideRealtime', 'hooks/useStudentProfile', 'hooks/useAgoraCall', 'hooks/useUnreadRideMessages', 'hooks/use-toast', 'lib/haptics', 'lib/supabaseClient', 'integrations/supabase/client', 'lib/goBackendClient', 'lib/requestRide', 'lib/placeCache', 'lib/geo_osm', 'lib/luggageStorage', 'lib/offerHelpers', 'lib/backendSocketClient', 'lib/rideLocationSubscription', 'lib/rideViewerPresence', 'lib/rideMatching', 'lib/businessApi', 'components/settings/RiderPreferencesSettings'];
export default defineConfig({
 root: path.resolve(root, 'qa-stabilization/fixture-site'),
 envDir: path.resolve(root, 'qa-stabilization/empty-env'),
 envPrefix: 'STABILIZATION_PUBLIC_',
 publicDir: path.resolve(root, 'public'),
 cacheDir: path.resolve(root, 'qa-stabilization/vite-fixture-cache'),
 css: { postcss: root },
 plugins: [{
  name: 'isolated-relative-service-boundary',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!importer || (!source.startsWith('.') && !path.isAbsolute(source))) return;
    const candidate = path.resolve(path.dirname(importer.split('?')[0]), source).replace(/\.(?:tsx?|jsx?)$/, '').toLowerCase();
    const target = mocked.find(name => path.resolve(root, 'src', name).toLowerCase() === candidate);
    if (target) return services;
  },
 }, react()],
 resolve: { alias: [
  ...mocked.map(name => ({ find: '@/' + name, replacement: services })),
  { find: '@/hooks/useTownPricing', replacement: path.resolve(root, 'qa-stabilization/fixture-pricing.ts') },
  { find: '@/components/map/LazyMapboxMap', replacement: path.resolve(root, 'qa-stabilization/fixture-map.tsx') },
  { find: '@', replacement: path.resolve(root, 'src') },
 ] },
 server: { host: '127.0.0.1', port: 8083, strictPort: true, fs: { allow: [root] } },
});

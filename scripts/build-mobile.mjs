import { spawnSync } from 'node:child_process';

// Native releases must never inherit Vite's historical fallback services.
const profile = process.argv[2] ?? 'production';
const profiles = {
  production: {
    VITE_APP_ENV: 'production',
    VITE_GO_BACKEND_URL: 'https://koloi-ride-with-confidence-production.up.railway.app',
    VITE_WS_URL: 'wss://koloi-ride-with-confidence-production.up.railway.app/ws',
    VITE_SUPABASE_URL: 'https://foksbnjtzubsjpeoorvo.supabase.co',
  },
  staging: {
    VITE_APP_ENV: 'staging',
    VITE_GO_BACKEND_URL: 'https://cruixe-go-staging-staging.up.railway.app',
    VITE_WS_URL: 'wss://cruixe-go-staging-staging.up.railway.app/ws',
    VITE_SUPABASE_URL: 'https://sgqqhrrdfyrebqreodfl.supabase.co',
    CRUIXE_STAGING_API_HOST: 'cruixe-go-staging-staging.up.railway.app',
    CRUIXE_STAGING_SUPABASE_PROJECT_REF: 'sgqqhrrdfyrebqreodfl',
  },
};
if (!Object.hasOwn(profiles, profile)) throw new Error('Use production or staging.');
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
if (!key) throw new Error('Set the selected project publishable key explicitly before building a mobile app.');
if (!key.startsWith('sb_publishable_')) {
  try {
    const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
    const ref = new URL(profiles[profile].VITE_SUPABASE_URL).hostname.split('.')[0];
    if (claims.role !== 'anon' || claims.ref !== ref) throw new Error();
  } catch { throw new Error('Mobile build requires a publishable key or matching project anon key.'); }
}
const result = spawnSync('npm', ['run', profile === 'production' ? 'build' : 'build:staging'], {
  stdio: 'inherit',
  env: { ...process.env, ...profiles[profile], VITE_SUPABASE_PUBLISHABLE_KEY: key },
});
process.exit(result.status ?? 1);

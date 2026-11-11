import { describe, expect, it } from 'vitest';
import { validateStagingEnvironment } from '../../scripts/stagingEnvironment';
const config = {
  VITE_GO_BACKEND_URL: 'https://api.staging.example.com',
  VITE_WS_URL: 'wss://api.staging.example.com/ws',
  VITE_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture',
  CRUIXE_STAGING_API_HOST: 'api.staging.example.com',
  CRUIXE_STAGING_SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst',
};
describe('fail-closed staging build configuration', () => {
  it('accepts explicit allowlisted HTTPS/WSS and isolated Supabase configuration', () => {
    expect(validateStagingEnvironment(config)).toMatchObject({ VITE_APP_ENV: 'staging', VITE_WS_URL: config.VITE_WS_URL });
  });
  for (const key of Object.keys(config)) it(`fails when ${key} is absent`, () => {
    expect(() => validateStagingEnvironment({ ...config, [key]: '' })).toThrow(/Staging/);
  });
  it.each([
    { VITE_GO_BACKEND_URL: 'https://koloi-ride-with-confidence-production.up.railway.app', VITE_WS_URL: 'wss://koloi-ride-with-confidence-production.up.railway.app/ws', CRUIXE_STAGING_API_HOST: 'koloi-ride-with-confidence-production.up.railway.app' },
    { VITE_SUPABASE_URL: 'https://foksbnjtzubsjpeoorvo.supabase.co', CRUIXE_STAGING_SUPABASE_PROJECT_REF: 'foksbnjtzubsjpeoorvo' },
    { VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_vgKlnioVW-ZyBiPeHgmaNw_411hQVXA' },
    { VITE_GO_BACKEND_URL: 'http://api.staging.example.com' },
    { VITE_WS_URL: 'ws://api.staging.example.com/ws' },
    { VITE_WS_URL: 'wss://other.example.com/ws' },
    { VITE_WS_URL: 'wss://api.staging.example.com/wrong' },
    { VITE_GO_BACKEND_URL: 'https://api.staging.example.com:8443' },
    { VITE_SUPABASE_URL: 'http://abcdefghijklmnopqrst.supabase.co' },
    { VITE_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co/auth' },
    { VITE_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co/#fragment' },
    { VITE_GO_BACKEND_URL: '/go-api' },
    { VITE_GO_BACKEND_URL: 'https://api.staging.example.com/api' },
    { VITE_GO_BACKEND_URL: 'https://username:password@api.staging.example.com' },
    { VITE_WS_URL: 'wss://api.staging.example.com/ws?token=do-not-log' },
    { VITE_SUPABASE_URL: 'https://differentprojectrefx.supabase.co' },
    { VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_fixture' },
  ])('rejects unsafe or mismatched deployment configuration %#', (override) => {
    expect(() => validateStagingEnvironment({ ...config, ...override })).toThrow(/Staging/);
  });
  it('accepts legacy anon JWT only when project claims match and never reports key values', () => {
    const token = (claims: object) => `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
    expect(validateStagingEnvironment({ ...config, VITE_SUPABASE_PUBLISHABLE_KEY: token({ role: 'anon', ref: config.CRUIXE_STAGING_SUPABASE_PROJECT_REF }) })).toBeDefined();
    for (const claims of [{ role: 'service_role', ref: config.CRUIXE_STAGING_SUPABASE_PROJECT_REF }, { role: 'anon', ref: 'foksbnjtzubsjpeoorvo' }]) {
      const key = token(claims);
      try { validateStagingEnvironment({ ...config, VITE_SUPABASE_PUBLISHABLE_KEY: key }); throw new Error('accepted'); }
      catch (error) { expect((error as Error).message).not.toContain(key); expect((error as Error).message).toMatch(/Staging/); }
    }
  });
});

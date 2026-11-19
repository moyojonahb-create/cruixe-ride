import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Exercise the real Vite entrypoint so the guard cannot silently stop being
// called while its pure validator tests remain green. Invalid builds must
// stop during configuration, before transforms or a deployable artifact.
const root = process.cwd();
const blankStaging = {
  VITE_GO_BACKEND_URL: '', VITE_WS_URL: '', VITE_SUPABASE_URL: '',
  VITE_SUPABASE_PUBLISHABLE_KEY: '', CRUIXE_STAGING_API_HOST: '',
  CRUIXE_STAGING_SUPABASE_PROJECT_REF: '',
};
function invalidBuild(mode: string, override: Record<string, string>) {
  return spawnSync(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build', '--mode', mode], {
    cwd: root,
    env: { ...process.env, ...blankStaging, VITE_APP_ENV: '', SENTRY_AUTH_TOKEN: '', ...override },
    encoding: 'utf8', timeout: 20_000,
  });
}
describe('real Vite staging guard wiring', () => {
  it.each([
    ['explicit staging mode', 'staging', {}],
    ['production mode tagged staging', 'production', { VITE_APP_ENV: 'staging' }],
  ])('rejects missing identities for %s', (_label, mode, override) => {
    const result = invalidBuild(mode as string, override as Record<string, string>);
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain('Staging VITE_GO_BACKEND_URL');
    expect(result.stdout + result.stderr).not.toContain('modules transformed');
  });
  it.each(['staging', 'production'])('rejects production mapping through actual %s config', (mode) => {
    const result = invalidBuild(mode, {
      VITE_APP_ENV: 'staging',
      VITE_GO_BACKEND_URL: 'https://koloi-ride-with-confidence-production.up.railway.app',
      VITE_WS_URL: 'wss://koloi-ride-with-confidence-production.up.railway.app/ws',
      VITE_SUPABASE_URL: 'https://foksbnjtzubsjpeoorvo.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ci_dummy',
      CRUIXE_STAGING_API_HOST: 'koloi-ride-with-confidence-production.up.railway.app',
      CRUIXE_STAGING_SUPABASE_PROJECT_REF: 'foksbnjtzubsjpeoorvo',
    });
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain('Staging API allowlist must identify a separate DNS host');
    expect(result.stdout + result.stderr).not.toContain('modules transformed');
  });
});

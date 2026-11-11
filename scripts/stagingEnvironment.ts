/** Build-time staging isolation checks. Allowlists must be set by the staging
 * operator after independently verifying the deployed services and database. */
export function validateStagingEnvironment(env: Record<string, string | undefined>): Record<string, string> {
  const required = (key: string): string => {
    const value = env[key]?.trim();
    if (!value) throw new Error(`Staging build requires ${key}; production defaults are disabled.`);
    return value;
  };
  const parse = (key: string, protocol: string): URL => {
    let url: URL;
    try { url = new URL(required(key)); } catch { throw new Error(`Staging ${key} must be an explicit ${protocol} URL.`); }
    if (url.protocol !== protocol || url.username || url.password || url.search || url.hash || url.port) {
      throw new Error(`Staging ${key} must use ${protocol} with no credentials, query, fragment, or custom port.`);
    }
    return url;
  };
  const productionApi = 'koloi-ride-with-confidence-production.up.railway.app';
  const productionRef = 'foksbnjtzubsjpeoorvo';
  const api = parse('VITE_GO_BACKEND_URL', 'https:');
  const socket = parse('VITE_WS_URL', 'wss:');
  const database = parse('VITE_SUPABASE_URL', 'https:');
  const apiHost = required('CRUIXE_STAGING_API_HOST').toLowerCase();
  const projectRef = required('CRUIXE_STAGING_SUPABASE_PROJECT_REF').toLowerCase();

  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])$/.test(apiHost) || !apiHost.includes('.') || apiHost === productionApi) {
    throw new Error('Staging API allowlist must identify a separate DNS host.');
  }
  if (!/^[a-z0-9]{20}$/.test(projectRef) || projectRef === productionRef) {
    throw new Error('Staging Supabase allowlist must identify a separate project ref.');
  }
  if (api.hostname !== apiHost || socket.hostname !== apiHost || api.pathname !== '/' || socket.pathname !== '/ws') {
    throw new Error('Staging API and WebSocket must use the allowlisted host, API root, and /ws endpoint.');
  }
  if (database.hostname !== `${projectRef}.supabase.co` || database.pathname !== '/') {
    throw new Error('Staging Supabase URL must match the allowlisted separate project ref.');
  }
  const key = required('VITE_SUPABASE_PUBLISHABLE_KEY');
  if (key === 'sb_publishable_vgKlnioVW-ZyBiPeHgmaNw_411hQVXA') {
    throw new Error('Staging cannot use the known production publishable key.');
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    // Legacy anon JWTs are accepted only when their public claims match this project.
    try {
      const parts = key.split('.');
      if (parts.length !== 3) throw new Error('Invalid key');
      const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      if (claims.role !== 'anon' || claims.ref !== projectRef) throw new Error('Invalid claims');
    } catch { throw new Error('Staging requires a publishable key or an anon JWT for the allowlisted project.'); }
  }
  return {
    VITE_APP_ENV: 'staging',
    VITE_GO_BACKEND_URL: api.origin,
    VITE_WS_URL: `${socket.origin}/ws`,
    VITE_SUPABASE_URL: database.origin,
    VITE_SUPABASE_PUBLISHABLE_KEY: key,
  };
}

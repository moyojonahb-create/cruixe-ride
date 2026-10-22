import { realpath, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const sensitive = /(?:password|passwd|secret|token|credential|wallet_pin|^pin$|private_key|encrypted|payload|raw_response|identity_data)/i;

export function safeName(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value || '')) throw new Error('Use an explicit application table and valid column names.');
  return value;
}

export function isInside(root, target) {
  const rel = relative(root, target);
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith('../'));
}

export async function privateDir(path) {
  if (!path) throw new Error('Set EXPORT_DIR to a private directory outside the repository.');
  const target = resolve(path);
  if (isInside(repoRoot, target)) throw new Error('Output inside the repository is forbidden.');
  // Resolve existing ancestors before creating anything, including symlinked parents.
  let ancestor = target;
  while (true) {
    try { if (isInside(await realpath(repoRoot), await realpath(ancestor))) throw new Error('Output resolves inside the repository.'); break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; ancestor = dirname(ancestor); }
  }
  await mkdir(target, { recursive: true, mode: 0o700 });
  const actual = await realpath(target);
  if (isInside(await realpath(repoRoot), actual)) throw new Error('Output resolves inside the repository.');
  return actual;
}

export function csv(rows) {
  return rows.map(row => row.map(value => {
    let text = String(value ?? '');
    if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  }).join(',')).join('\n') + '\n';
}

export async function save(path, data) {
  await writeFile(path, data, { mode: 0o600, flag: 'wx' });
}

export function config(env = process.env) {
  const url = new URL(env.EXPORT_SOURCE_URL || 'invalid');
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Use the HTTPS source origin only.');
  const key = env.EXPORT_PUBLISHABLE_KEY;
  const token = env.EXPORT_ADMIN_TOKEN;
  if (!key || !token || key.startsWith('sb_secret_')) throw new Error('Use a publishable key and authenticated administrator token only.');
  for (const value of [key, token]) {
    if (value.split('.').length === 3) {
      let role;
      try { role = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()).role; } catch { throw new Error('Invalid credentials.'); }
      if (role === 'service_role' || role === 'supabase_admin') throw new Error('Privileged keys are forbidden.');
    }
  }
  return { url: url.origin, headers: { apikey: key, Authorization: `Bearer ${token}` } };
}

export async function authorize(request) {
  const user = await (await request('/auth/v1/user')).json();
  if (!user.id || user.email?.toLowerCase() !== 'moyojonahb@gmail.com') throw new Error('Designated administrator required.');
  const role = await (await request('/rest/v1/rpc/has_role', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _user_id: user.id, _role: 'admin' }),
  })).json();
  // A source-server result is mandatory; user metadata is never authorization.
  if (role !== true) throw new Error('Server administrator verification failed.');
}
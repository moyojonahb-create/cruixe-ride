import { open } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { authorize, config, privateDir, safeName, sensitive, csv, save } from './export-utils.mjs';

export async function exportTable({ request, table, order, output }) {
  safeName(table);
  if (sensitive.test(table) || /^(?:auth|user_roles|phone_verifications|mirror_outbox|wallet_pins)$/.test(table)) throw new Error('Credential-bearing or authorization tables are excluded; use the supported private backup.');
  const keys = order.split(',').map(safeName);
  const manifest = { table, exportedAt: new Date().toISOString(), authorizedCountBefore: null, authorizedCountAfter: null, exportedCount: 0, failedOrInaccessibleCount: null, primaryKey: 'unverified', orderingColumns: keys, file: `${table}.jsonl`, complete: false, limitations: ['RLS-visible data only', 'No transactional snapshot', 'Ordering must be a real unique key'] };
  let file;
  try {
    const schema = await (await request('/rest/v1/', { headers: { Accept: 'application/openapi+json' } })).json();
    const properties = schema.definitions?.[table]?.properties;
    if (!properties) throw new Error('Accurate column metadata unavailable; refusing a blind export.');
    const columns = Object.keys(properties);
    if (columns.some(column => sensitive.test(column))) throw new Error('Credential-like columns found; use the supported private backup instead.');
    if (keys.some(key => !columns.includes(key))) throw new Error('Ordering column does not exist.');
    const query = `/rest/v1/${table}?select=${encodeURIComponent(columns.join(','))}&order=${encodeURIComponent(keys.map(key => `${key}.asc`).join(','))}`;
    const count = async () => {
      const response = await request(`${query}&limit=0`, { headers: { Prefer: 'count=exact' } });
      const total = response.headers.get('content-range')?.split('/')[1];
      if (!total || total === '*' || !/^\d+$/.test(total)) throw new Error('Exact authorized count unavailable.');
      return Number(total);
    };
    manifest.authorizedCountBefore = await count();
    file = await open(join(output, manifest.file), 'wx', 0o600);
    let previous;
    const seen = new Set();
    while (true) {
      const rows = await (await request(`${query}&offset=${manifest.exportedCount}&limit=500`)).json();
      if (!Array.isArray(rows)) throw new Error('Invalid record response.');
      if (rows.length === 0) break;
      for (const row of rows) {
        if (Object.keys(row).some(key => sensitive.test(key))) throw new Error('Sensitive field unexpectedly returned.');
        const id = JSON.stringify(keys.map(key => row[key]));
        if (keys.some(key => row[key] == null) || seen.has(id) || id === previous) throw new Error('Ordering key is not unique or records changed; export incomplete.');
        seen.add(id); previous = id;
        await file.write(`${JSON.stringify(row)}\n`);
        manifest.exportedCount++;
      }
    }
    manifest.authorizedCountAfter = await count();
    manifest.failedOrInaccessibleCount = Math.max(0, manifest.authorizedCountBefore - manifest.exportedCount);
    manifest.complete = manifest.authorizedCountBefore === manifest.exportedCount && manifest.authorizedCountAfter === manifest.exportedCount;
    await save(join(output, `${table}-inventory.csv`), csv([
      ['table', 'column', 'type', 'authorized_row_count', 'exported_count', 'failed_visible_count', 'timestamp', 'primary_key', 'relationships', 'export_file'],
      ...columns.map(column => [table, column, properties[column].format || properties[column].type, manifest.authorizedCountBefore, manifest.exportedCount, manifest.failedOrInaccessibleCount, manifest.exportedAt, 'unverified', 'unavailable from API metadata', manifest.file]),
    ]));
  } catch {
    manifest.failure = 'Export failed or access/metadata unavailable. No sensitive server error bodies are logged.';
  } finally {
    await file?.close();
    await save(join(output, `${table}-manifest.json`), JSON.stringify(manifest, null, 2));
  }
  return manifest;
}

async function main() {
  const args = process.argv.slice(2);
  const table = args[args.indexOf('--table') + 1];
  const order = args[args.indexOf('--order') + 1];
  if (!args.includes('--table') || !args.includes('--order')) throw new Error('Usage: --table selected_table --order unique_key');
  const { url, headers } = config();
  const request = async (path, options = {}) => {
    const response = await fetch(`${url}${path}`, { ...options, headers: { ...headers, ...options.headers }, redirect: 'error', signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Source request failed (${response.status}).`);
    return response;
  };
  await authorize(request);
  const output = await privateDir(process.env.EXPORT_DIR);
  const result = await exportTable({ request, table, order, output });
  console.log(result.complete ? 'Selected-table export complete; run verification.' : 'Export incomplete; inspect the private manifest.');
  if (!result.complete) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => { console.error('Export stopped. Check administrator access, source availability, arguments and private output configuration.'); process.exitCode = 1; });
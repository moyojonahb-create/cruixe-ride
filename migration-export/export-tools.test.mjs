import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { authorize, privateDir, repoRoot, config } from './export-utils.mjs';
import { exportTable } from './export-database.mjs';
import { verify } from './verify-export.mjs';

test('Private output is forbidden anywhere inside the Git repository', async () => {
  await assert.rejects(privateDir(join(repoRoot, 'private-exports')), /forbidden/);
});
test('An authenticated designated email alone does not grant admin exports', async () => {
  await assert.rejects(authorize(async path => new Response(JSON.stringify(path === '/auth/v1/user' ? { id: 'test-id', email: 'moyojonahb@gmail.com' } : false))), /verification failed/);
});
test('Service-role keys are refused', () => {
  assert.throws(() => config({ EXPORT_SOURCE_URL: 'https://source.example', EXPORT_PUBLISHABLE_KEY: 'sb_secret_test', EXPORT_ADMIN_TOKEN: 'test' }));
});
test('Pagination continues past a server row cap and verifies exact counts', async () => {
  const output = await mkdtemp(join(tmpdir(), 'migration-test-'));
  try {
    const rows = Array.from({ length: 1001 }, (_, id) => ({ id, amount: id }));
    const request = async path => {
      if (path === '/rest/v1/') return new Response(JSON.stringify({ definitions: { rides: { properties: { id: { type: 'integer' }, amount: { type: 'number' } } } } }));
      const url = new URL(path, 'https://source.example');
      if (url.searchParams.get('limit') === '0') return new Response('[]', { headers: { 'content-range': '*/1001' } });
      const offset = Number(url.searchParams.get('offset'));
      return new Response(JSON.stringify(rows.slice(offset, offset + 200)));
    };
    const manifest = await exportTable({ request, table: 'rides', order: 'id', output });
    assert.equal(manifest.exportedCount, 1001);
    assert.equal(manifest.complete, true);
    assert.equal(await verify(output), 1);
    const lines = (await readFile(join(output, 'rides.jsonl'), 'utf8')).trim().split('\n');
    await writeFile(join(output, 'rides.jsonl'), lines.slice(1).join('\n'));
    await assert.rejects(verify(output), /failed verification/);
  } finally { await rm(output, { recursive: true, force: true }); }
});
test('Credential-bearing mirror outbox is not exported', async () => {
  await assert.rejects(exportTable({ request: () => { throw new Error('Must not request'); }, table: 'mirror_outbox', order: 'id', output: tmpdir() }), /excluded/);
});
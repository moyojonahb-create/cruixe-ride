#!/usr/bin/env node
/**
 * The increment gate. One command, one exit code.
 *
 * SCOPE CHANGED 8 Sep 2026. This was written during the React Native migration,
 * when `src/` was frozen and the RN app was the thing being built. That reversed
 * — CruiXe stays on Capacitor — so `src/` IS the app again and the RN app is
 * paused on branch `feat/rn-slice-3a-3c`.
 *
 * Two consequences, both of which would otherwise make this gate lie:
 *   - The "web byte-identical" gate is GONE. It now enforces the opposite of
 *     what is wanted: every intended edit to `src/` would fail it.
 *   - The RN gates (core/mobile typecheck, Metro bundles) only run when
 *     `apps/mobile` is checked out, which it is not on a Capacitor branch.
 *
 * This exists because a green test run twice masked a broken typecheck:
 * vitest does not typecheck, so `packages/core` shipped a real TS2493 while
 * 89 tests passed, and the `.js`-extension bug before that bundled-failed while
 * `tsc` was clean. Different resolvers, different failures — checking one and
 * reporting "gates green" is how both got through.
 *
 * Every gate runs even if an earlier one fails, so a single run reports every
 * problem rather than the first. Exit code is non-zero if any gate failed.
 *
 * Usage:  node scripts/verify.mjs
 */

import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE = path.join(ROOT, 'packages/core');
const MOBILE = path.join(ROOT, 'apps/mobile');
const METRO_PORT = 8081;

const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  process.stdout.write(`${ok ? '  PASS' : '  FAIL'}  ${name}${detail ? ` — ${detail}` : ''}\n`);
};

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: 'pipe', shell: true });
}

function gate(name, fn) {
  process.stdout.write(`\n> ${name}\n`);
  try {
    const detail = fn();
    record(name, true, detail);
  } catch (error) {
    const out = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim() || error.message;
    record(name, false, out.split('\n').slice(0, 6).join('\n         '));
  }
}

// ── 1. the web app — this is the shipping app ────────────────────────────────
gate('web typecheck', () => {
  run('npx', ['--no-install', 'tsc', '--noEmit', '-p', 'tsconfig.app.json'], ROOT);
  return 'tsc --noEmit clean';
});

gate('go build', () => {
  run('go', ['build', './...'], path.join(ROOT, 'backend'));
  return 'backend compiles';
});

// ── 2. RN package, only when that branch is checked out ──────────────────────
if (existsSync(CORE)) {
  gate('core typecheck', () => {
    run('npx', ['--no-install', 'tsc', '--noEmit'], CORE);
    return 'tsc --noEmit clean';
  });
}

if (existsSync(path.join(MOBILE, 'package.json'))) {
  gate('mobile typecheck', () => {
    run('npx', ['--no-install', 'tsc', '--noEmit'], MOBILE);
    return 'tsc --noEmit clean';
  });
}

if (existsSync(path.join(CORE, 'vitest.config.ts'))) gate('core test suite', () => {
  const out = run('npx', ['vitest', 'run', '--config', 'packages/core/vitest.config.ts'], ROOT);
  // Strip ANSI before matching — vitest colours its summary, and an unstripped
  // regex silently degrades the report to a bare "passed" with no count.
  // eslint-disable-next-line no-control-regex
  const plain = out.replace(/\[[0-9;]*m/g, '');
  const m = plain.match(/Tests\s+(\d+) passed/);
  return m ? `${m[1]} passed` : 'passed (count not parsed)';
});

// ── 2b. no SQL references a column that does not exist ───────────────────
// Three production bugs shared this shape; see scripts/schema-check.mjs.
gate('schema-check (phantom columns)', () => {
  const out = run('node', ['scripts/schema-check.mjs'], ROOT);
  const m = out.match(/([0-9]+) column refs/);
  return m ? m[1] + ' refs, none phantom' : 'clean';
});

// ── 3. both platform bundles ─────────────────────────────────────────────────
// Metro is reused when already running, since a dev session usually has one up.
// When it is not, one is started and torn down again so the gate is standalone.
let metro = null;

async function metroUp() {
  try {
    const res = await fetch(`http://127.0.0.1:${METRO_PORT}/status`, { signal: AbortSignal.timeout(3000) });
    return (await res.text()).includes('running');
  } catch {
    return false;
  }
}

const RN_PRESENT = existsSync(path.join(MOBILE, 'package.json'));
const alreadyUp = RN_PRESENT ? await metroUp() : false;
if (RN_PRESENT && !alreadyUp) {
  process.stdout.write('\n> starting Metro (none running)\n');
  metro = spawn('npx', ['expo', 'start', '--dev-client', '--host', 'lan'], {
    cwd: MOBILE, stdio: 'ignore', shell: true, detached: false,
  });
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline && !(await metroUp())) {
    await new Promise((r) => setTimeout(r, 2000));
  }
}

for (const platform of RN_PRESENT ? ['android', 'ios'] : []) {
  // eslint-disable-next-line no-await-in-loop
  await (async () => {
    process.stdout.write(`\n> ${platform} bundle\n`);
    try {
      const url = `http://127.0.0.1:${METRO_PORT}/index.bundle?platform=${platform}&dev=true&minify=false`;
      const res = await fetch(url, { signal: AbortSignal.timeout(900_000) });
      const body = await res.text();
      const valid = res.status === 200 && body.includes('__BUNDLE_START_TIME__');
      record(
        `${platform} bundle`,
        valid,
        valid ? `${body.length.toLocaleString()} bytes` : `status ${res.status}: ${body.slice(0, 300)}`,
      );
    } catch (error) {
      record(`${platform} bundle`, false, error.message);
    }
  })();
}

if (metro) metro.kill();

// ── summary ──────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
process.stdout.write(`\n${'='.repeat(60)}\n`);
process.stdout.write(`  ${results.length - failed.length}/${results.length} gates passed\n`);
if (failed.length) {
  process.stdout.write(`  FAILED: ${failed.map((f) => f.name).join(', ')}\n`);
}
process.stdout.write(`${'='.repeat(60)}\n`);
process.exit(failed.length ? 1 : 0);

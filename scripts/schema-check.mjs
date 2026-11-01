#!/usr/bin/env node
/**
 * Phantom-column detector.
 *
 * Three production bugs this year shared one shape: code written against an
 * *intended* schema that diverged from the *actual* one, invisible because
 * nothing forced a comparison.
 *
 *   - `status` / `payment_provider` queried on wallet_transactions — columns
 *     that never existed. Every call 500'd with SQLSTATE 42703.
 *   - `short_trip_fare` configured in 13 towns, read by no code.
 *   - `driver_sessions` written only by a branch gated on its own output.
 *
 * The first was found by a 500 in production. The second and third were found by
 * reading, 1,100 lines apart. That does not scale, and the next one surfaces as
 * a 500 in front of a driver.
 *
 * This turns the class into a check: extract every `table.column` reference from
 * SQL in the Go backend, diff against the generated schema types, report
 * anything with no matching column.
 *
 *   node scripts/schema-check.mjs                # report
 *   node scripts/schema-check.mjs --json         # machine-readable
 *
 * Schema is read from src/integrations/supabase/types.ts, which the Supabase
 * CLI regenerates from the live database.
 *
 * Exit code is non-zero when phantom references are found, so it can join
 * scripts/verify.mjs.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GO_ROOT = path.join(ROOT, 'backend');

/**
 * Schema comes from the Supabase-generated types rather than a hand-kept
 * snapshot. That file is regenerated from the live database by the Supabase
 * CLI, so this check cannot drift from reality without someone noticing the
 * types are stale too — a snapshot committed here would become its own
 * phantom-schema problem, which is the exact bug class this script exists for.
 */
const TYPES = path.join(ROOT, 'src/integrations/supabase/types.ts');

if (!existsSync(TYPES)) {
  console.error(`Cannot find generated types at ${TYPES}`);
  process.exit(2);
}

/** Parses `<table>: { Row: { <col>: <type> ... } }` out of the generated types. */
function loadSchema(src) {
  const out = new Map();
  // Table blocks look like:  name: {\n  Row: {\n    col: type\n ... }
  const re = /^ {6}([a-z_][a-z0-9_]*): \{\n {8}Row: \{\n((?: {10}.*\n)+?) {8}\}/gm;
  for (const m of src.matchAll(re)) {
    const cols = new Set();
    for (const line of m[2].split('\n')) {
      const c = line.match(/^ {10}([a-z_][a-z0-9_]*)\??:/);
      if (c) cols.add(c[1]);
    }
    if (cols.size) out.set(m[1], cols);
  }
  return out;
}

// Normalise CRLF - the regexes above are anchored on newlines and this repo
// checks out with Windows line endings.
const RAW = readFileSync(TYPES, 'utf8');
const tables = loadSchema(RAW.split(String.fromCharCode(13)).join(''));

if (tables.size === 0) {
  console.error('Parsed 0 tables from the generated types — the format has changed.');
  process.exit(2);
}

/** SQL keywords and functions that look like columns but are not. */
const NOT_COLUMNS = new Set([
  'select', 'from', 'where', 'and', 'or', 'not', 'null', 'as', 'on', 'join', 'left', 'right',
  'inner', 'outer', 'group', 'order', 'by', 'limit', 'offset', 'insert', 'into', 'values',
  'update', 'set', 'delete', 'returning', 'case', 'when', 'then', 'else', 'end', 'distinct',
  'count', 'sum', 'avg', 'min', 'max', 'coalesce', 'now', 'true', 'false', 'is', 'in', 'exists',
  'asc', 'desc', 'having', 'union', 'all', 'with', 'json_build_object', 'json_agg', 'array_agg',
  'string_agg', 'conflict', 'do', 'nothing', 'cast', 'interval', 'extract', 'public',
]);

function goFiles(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (e !== 'vendor' && e !== 'node_modules') goFiles(p, out);
    } else if (e.endsWith('.go') && !e.endsWith('_test.go')) {
      out.push(p);
    }
  }
  return out;
}

const findings = [];
const checked = { files: 0, statements: 0, refs: 0 };

for (const file of goFiles(GO_ROOT)) {
  checked.files += 1;
  const src = readFileSync(file, 'utf8');

  // Backtick-quoted Go raw strings are where the SQL lives in this codebase.
  for (const m of src.matchAll(/`([^`]*)`/g)) {
    const sql = m[1];
    if (!/\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(sql)) continue;
    checked.statements += 1;

    // Which tables does this statement touch? Only single-table statements are
    // judged: with a join, an unqualified column is ambiguous and a false
    // positive is worse than a miss.
    const touched = [...sql.matchAll(/\b(?:FROM|INTO|UPDATE|JOIN)\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi)]
      .map((x) => x[1].toLowerCase())
      .filter((t) => tables.has(t));
    const unique = [...new Set(touched)];
    if (unique.length !== 1) continue;

    const table = unique[0];
    const cols = tables.get(table);
    const line = src.slice(0, m.index).split('\n').length;

    // Strip, in order, the things that produce false column names:
    //   1. `::type` casts. `SELECT user_id::text` made `text` look like a
    //      column on `rides` — three of the first fourteen findings were this,
    //      and three false alarms out of fourteen is how a checker gets ignored
    //      by the third run and then stops catching the real ones.
    //   2. Qualified refs `alias.col` — the alias may point at another table.
    const bare = sql
      .replace(/::\s*[a-z_][a-z0-9_]*(\s*\[\s*\])?/gi, ' ')
      .replace(/\b[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*/gi, ' ');

    // Two patterns, both chosen to keep false positives near zero — a noisy
    // detector gets muted, and a muted detector is worse than none.
    //
    //   1. `'col', col`  — the json_build_object key/value pair this codebase
    //      uses everywhere. Requiring the quoted key and the bare identifier to
    //      be IDENTICAL is what excludes value lists: `IN ('cancelled', ...)`
    //      never repeats itself, so `rides.cancelled` stops being reported.
    //   2. `col = ` / `col IS [NOT] NULL` — predicates. This is the shape that
    //      produced the wallet_transactions 42703s.
    const seen = new Set();
    const patterns = [
      /'([a-z_][a-z0-9_]*)'\s*,\s*\1\b/gi,
      // The left side of `=` is a column whether the right side is a bound
      // parameter or a literal. An earlier version matched only `= $`, to
      // exclude value lists — and silently lost every `SET col = 'value'`,
      // which is how `rides.ride_status` (a phantom column that breaks all ride
      // cancellation) went unreported. Anchoring on the LEFT of `=` keeps the
      // precision without the recall cost: a value in `IN ('a','b')` is never
      // followed by `=`.
      /\b([a-z_][a-z0-9_]*)\s*=\s*(?:\$|'|now\(\))/gi,
      /\b([a-z_][a-z0-9_]*)\s+IS\s+(?:NOT\s+)?NULL/gi,
    ];
    for (const c of [...patterns].flatMap((re) => [...bare.matchAll(re)])) {
      const name = (c[1] || '').toLowerCase();
      if (!name || NOT_COLUMNS.has(name) || seen.has(name)) continue;
      seen.add(name);
      checked.refs += 1;
      if (!cols.has(name)) {
        findings.push({
          file: path.relative(ROOT, file).replace(/\\/g, '/'),
          line,
          table,
          column: name,
        });
      }
    }
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ checked, findings }, null, 2));
} else {
  console.log(`schema-check: ${checked.files} Go files, ${checked.statements} SQL statements, ${checked.refs} column refs\n`);
  if (findings.length === 0) {
    console.log('  no phantom column references found');
  } else {
    console.log(`  ${findings.length} PHANTOM COLUMN REFERENCE(S):\n`);
    for (const f of findings) {
      console.log(`  ${f.file}:${f.line}`);
      console.log(`     ${f.table}.${f.column}  <- no such column\n`);
    }
  }
}

process.exit(findings.length ? 1 : 0);

import { readdir, readFile, lstat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { privateDir, sensitive } from './export-utils.mjs';

export async function verify(output) {
  const manifests = (await readdir(output)).filter(name => name.endsWith('-manifest.json'));
  if (!manifests.length) throw new Error('No manifests; no export verified.');
  let failures = 0;
  for (const name of manifests) {
    try {
      const manifest = JSON.parse(await readFile(join(output, name), 'utf8'));
      if (!manifest.file || basename(manifest.file) !== manifest.file) throw new Error('Unsafe file path.');
      const path = join(output, manifest.file);
      if ((await lstat(path)).isSymbolicLink()) throw new Error('Symlinks are not accepted.');
      let count = 0;
      for await (const line of createInterface({ input: createReadStream(path), crlfDelay: Infinity })) {
        if (!line.trim()) continue;
        const row = JSON.parse(line);
        if (Object.keys(row).some(key => sensitive.test(key))) throw new Error('Sensitive field.');
        count++;
      }
      if (!manifest.complete || count !== manifest.exportedCount || count !== manifest.authorizedCountBefore || count !== manifest.authorizedCountAfter) throw new Error('Count mismatch or incomplete export.');
    } catch { failures++; }
  }
  if (failures) throw new Error(`${failures} table exports failed verification. Inspect private manifests.`);
  return manifests.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  privateDir(process.env.EXPORT_DIR).then(verify).then(count => console.log(`${count} selected-table exports verified locally. Global counts, storage and auth are not verified.`)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
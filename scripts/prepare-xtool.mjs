import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const profile = process.argv[2] ?? 'production';
for (const [command, args] of [
  [process.execPath, ['scripts/build-mobile.mjs', profile]],
  ['npm', ['exec', '--', 'cap', 'sync', 'ios']],
]) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const output = 'native/xtool/Resources';
mkdirSync(output, { recursive: true });
rmSync(`${output}/public`, { recursive: true, force: true });
cpSync('ios/App/App/public', `${output}/public`, { recursive: true });
cpSync('ios/App/App/capacitor.config.json', `${output}/capacitor.config.json`);
let plist = readFileSync('ios/App/App/Info.plist', 'utf8');
for (const key of ['UIMainStoryboardFile', 'UILaunchStoryboardName', 'CAPACITOR_DEBUG']) {
  plist = plist.replace(new RegExp(`<key>${key}</key>\\s*<string>[^<]*</string>`, 'g'), '');
}
plist = plist.replaceAll('$(EXECUTABLE_NAME)', 'CruiXe')
  .replaceAll('$(PRODUCT_BUNDLE_IDENTIFIER)', 'zw.co.pickme')
  .replaceAll('$(PRODUCT_NAME)', 'CruiXe')
  .replaceAll('$(MARKETING_VERSION)', '1.0')
  .replaceAll('$(CURRENT_PROJECT_VERSION)', '1');
writeFileSync(`${output}/Info.plist`, plist);
console.log(`${profile} assets and native plugin configuration prepared for xtool.`);

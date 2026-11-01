import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(path.join(process.env.TEMP, 'cruize-approved-ride-qa/package.json'));
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const origin = 'http://127.0.0.1:8083';
const out = process.env.CRUIXE_ISOLATED_OUT || 'qa-resume/browser';
await fs.mkdir(out, { recursive: true });
const report = { authority: 'MOCKED/ISOLATED UI ONLY', cases: [], pageErrors: [], consoleErrors: [], httpErrors: [], blockedRequests: [], forbiddenWrites: [], checks: [] };
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const context = await browser.newContext({ timezoneId: 'Africa/Johannesburg', reducedMotion: 'reduce' });
await context.route('**/*', async route => {
 const request = route.request(); const url = new URL(request.url());
 if (url.origin !== origin || !['GET', 'HEAD'].includes(request.method())) {
  report.blockedRequests.push({ origin: url.origin, path: url.pathname, method: request.method() });
  if (!['GET', 'HEAD'].includes(request.method())) report.forbiddenWrites.push({ origin: url.origin, path: url.pathname });
  return route.abort();
 }
 return route.continue();
});
await context.addInitScript(() => {
 const NativeWebSocket = window.WebSocket;
 window.WebSocket = class extends NativeWebSocket {
  constructor(url, protocols) {
   const parsed = new URL(String(url), location.href);
   if (!['127.0.0.1', 'localhost'].includes(parsed.hostname)) throw new Error('ISOLATED: live WebSocket blocked');
   super(url, protocols);
  }
 };
});
const page = await context.newPage();page.setDefaultTimeout(20000);
let fatalReject; const fatal = new Promise((_, reject) => { fatalReject = reject; }); fatal.catch(() => {});
page.on('pageerror', e => { report.pageErrors.push(e.stack || e.message); console.error('PAGE ERROR:',e.stack || e.message); fatalReject(e); });
page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(m.text()); });
page.on('response', r => { if (r.status() >= 400) report.httpErrors.push({ url: r.url(), status: r.status() }); });
async function snap(name) { await page.screenshot({ path: `${out}/${name}.png` }); }
async function axe(name) {
 const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
 return { name, violations: result.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })) };
}
async function configure(width, height) {
 await page.setViewportSize({ width, height });
 await page.goto(origin + '/ride?view=choose', { waitUntil: 'domcontentloaded', timeout: 120000 });
 await Promise.race([page.getByRole('button', { name: 'Choose Economy', exact: true }).waitFor({ timeout: 90000 }), fatal]);
 const dismiss = page.getByRole('button', { name: 'Set pickup manually', exact: true });if (await dismiss.count()) await dismiss.click();
 await snap(`choose-${width}`);
 await page.getByRole('button', { name: 'Choose Economy', exact: true }).click();
 const input = page.getByRole('textbox', { name: 'Destination', exact: true });await input.fill('Fixture');
 await snap(`destination-${width}`);
 await page.getByRole('button', { name: 'Fixture destination ISOLATED test data', exact: true }).click();
 await page.getByRole('button', { name: 'Confirm location & continue', exact: true }).waitFor();
 await page.waitForTimeout(300);await snap(`configuration-${width}`);
 return await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, tierCount: document.querySelectorAll('[aria-pressed="true"]').length, route: document.querySelector('[data-testid="fixture-route"]').textContent, buttons: ['More passengers','Fewer passengers'].map(label => { const el = document.querySelector(`[aria-label="${label}"]`);const r = el.getBoundingClientRect();return { label, width: r.width, height: r.height, y:r.y }; }), ribbon: Array.from(document.querySelectorAll('.ride-booking-sheet .ride-sheet-curve path')).map(p=>p.getAttribute('d')), confirmation: (()=>{const button=document.querySelector('.ride-config-confirm'); const label=document.querySelector('.ride-config-confirm__label'); const arrow=document.querySelector('.ride-config-confirm__arrow');const b=button.getBoundingClientRect(),a=arrow.getBoundingClientRect();return {arrowInside:a.left>=b.left&&a.right<=b.right,labelNotClipped:label.scrollWidth<=label.clientWidth,labelFont:getComputedStyle(label).fontSize};})(), configText: document.querySelector('.ride-booking-sheet').textContent }));
}


try {
 for (const [width,height] of [[393,852],[360,800]]) {
  await page.setViewportSize({width,height});
  await page.goto(origin+'/ride/isolated-pending-ui-state/matching',{waitUntil:'domcontentloaded',timeout:120000});
  await page.getByText('Finding drivers near you',{exact:true}).waitFor();
  await page.locator('.ride-finding-decoration__car img').evaluate(img=>img.decode());
  await page.waitForTimeout(500);
  await snap(`finding-drivers-stable-${width}`);
 }
} finally { await browser.close(); }

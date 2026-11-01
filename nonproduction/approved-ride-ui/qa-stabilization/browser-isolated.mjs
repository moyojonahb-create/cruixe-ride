import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(path.join(process.env.TEMP, 'cruize-approved-ride-qa/package.json'));
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const origin = 'http://127.0.0.1:8083';
const out = process.env.CRUIXE_ISOLATED_OUT || 'qa-stabilization/browser';
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
 for (const [width, height] of [[393, 852], [360, 800]]) {
  const item = { width, height, configuration: await configure(width, height) };
  item.accessibility = await axe(`configuration-${width}`);
  for (let count = 0; count < 3; count++) await page.getByRole('button', { name: 'More passengers', exact: true }).click();
  item.passengerMaxDisabled = await page.getByRole('button', { name: 'More passengers', exact: true }).isDisabled();
  await page.locator('.ride-config-utility--cash').click();
  await page.getByRole('dialog', { name: 'Choose payment method' }).waitFor();
  item.paymentAccessibility = await axe(`payment-${width}`);await snap(`payment-${width}`);
  await page.getByRole('radio', { name: /CruiXe wallet/ }).click();
  await page.getByRole('button', { name: 'Pay from wallet', exact: true }).click();
  await page.getByRole('dialog', { name: 'Choose payment method' }).waitFor({ state: 'hidden' });
  item.paymentReturns = await page.getByRole('button', { name: 'Confirm location & continue', exact: true }).isVisible();
  item.paymentFocusReturns = await page.locator('.ride-config-utility--cash').evaluate(element=>document.activeElement===element);
  item.prematureBookingAttempts = await page.evaluate(() => window.__fixtureEvents.filter(e => e.action === 'requestRide denied').length);
  await page.locator('.ride-config-utility--luggage').click();
  await page.getByRole('heading', { name: 'Add Luggage', exact: true }).waitFor();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jpZkAAAAASUVORK5CYII=', 'base64');
  await page.locator('input[type="file"][multiple]').setInputFiles({ name: 'isolated-luggage.png', mimeType: 'image/png', buffer: png });
  await page.getByText('Photos (1/5)', { exact: true }).waitFor();
  item.photoPreview = await page.locator('img[alt="Luggage photo 1"]').evaluate(image=>({complete:image.complete,naturalWidth:image.naturalWidth}));
  item.luggageAccessibility = await axe(`luggage-${width}`);await snap(`luggage-${width}`);
  await page.getByRole('button', { name: 'Save Luggage Details', exact: true }).click();
  await page.getByRole('heading', { name: 'Add Luggage' }).waitFor({ state: 'hidden' });
  item.photoSaved = await page.locator('.ride-config-utility--luggage').innerText();
  await page.locator('.ride-config-utility--luggage').click();await page.getByText('Photos (1/5)', { exact: true }).waitFor();
  await page.getByRole('button',{name:'Remove luggage photo 1',exact:true}).click();
  await page.getByText('Photos (0/5)', { exact: true }).waitFor();item.photoRemoved = true;
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Schedule', exact: true }).click();await page.getByText('Schedule your ride', { exact: true }).waitFor();
  await page.getByRole('button', { name: /Tomorrow/ }).click();
  item.scheduleAccessibility = await axe(`schedule-${width}`);await snap(`schedule-${width}`);
  await page.getByRole('button', { name: /^Schedule for / }).click();
  await page.waitForTimeout(300);
  item.deniedAttempt = await page.evaluate(() => window.__fixtureEvents.filter(e => e.action === 'requestRide denied'));
  report.cases.push(item);
 }
 await page.goto(origin + '/ride?view=choose', { waitUntil: 'domcontentloaded' });await page.getByRole('button', { name: 'Choose Economy', exact: true }).waitFor();
 report.navigation = [];
 for (const name of ['Account','Activity','Wallet']) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const before = await page.locator('.rider-navigation__background path').getAttribute('d');
  const frames=await page.evaluate(async label=>{const path=document.querySelector('.rider-navigation__background path');const frames=[getComputedStyle(path).d];const button=Array.from(document.querySelectorAll('.rider-navigation button')).find(b=>b.getAttribute('aria-label')===label);button.click();for(let i=0;i<12;i++){await new Promise(requestAnimationFrame);frames.push(getComputedStyle(path).d);}return [...new Set(frames)];},name);
  await page.waitForTimeout(400);
  const after = await page.locator('.rider-navigation__background path').getAttribute('d');
  report.navigation.push({ name, interpolatedCurveStates:frames.length, url:page.url(), selected:await page.getByRole('button',{name,exact:true}).getAttribute('aria-current'), curveChanged:before!==after });
  await snap(`navigation-${name.toLowerCase()}`);await page.reload();await page.getByRole('button',{name,exact:true}).waitFor();
  report.navigation.at(-1).reloadSelected=await page.getByRole('button',{name,exact:true}).getAttribute('aria-current');
  await page.goBack();await page.getByRole('button',{name:'Choose Economy',exact:true}).waitFor();
  report.navigation.at(-1).backSelected=await page.getByRole('button',{name:'Ride',exact:true}).getAttribute('aria-current');
 }
 await page.emulateMedia({reducedMotion:'reduce'});report.reducedMotion=await page.locator('.rider-navigation__background path').evaluate(el=>getComputedStyle(el).transitionDuration);
 for (const [width,height] of [[393,852],[360,800]]) {
  await page.setViewportSize({width,height});await page.goto(origin+'/ride/isolated-pending-ui-state/matching',{waitUntil:'domcontentloaded'});
  await page.getByText('Finding drivers near you',{exact:true}).waitFor();await page.waitForTimeout(200);await snap(`finding-drivers-${width}`);
  report.checks.push({name:`MOCKED pending UI ${width}`,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),accessibility:await axe(`finding-${width}`),ribbon:await page.locator('.ride-sheet-curve path').evaluateAll(paths=>paths.map(path=>path.getAttribute('d')))});
 }
} catch(error) { report.failure=String(error);await snap('failure').catch(()=>{}); }
finally { await fs.writeFile(`${out}/results.json`,JSON.stringify(report,null,2));await browser.close(); }
console.log(JSON.stringify(report,null,2));
const accessibilityFailures=[...report.cases.flatMap(c=>[c.accessibility,c.paymentAccessibility,c.luggageAccessibility,c.scheduleAccessibility]),...report.checks.map(c=>c.accessibility)].filter(Boolean).flatMap(a=>a.violations);
report.assertions={
 mobileCases:report.cases.length===2,
 controlsFit:report.cases.every(c=>!c.configuration.overflow&&c.configuration.confirmation.arrowInside&&c.configuration.confirmation.labelNotClipped),
 photoDecodes:report.cases.every(c=>c.photoPreview.complete&&c.photoPreview.naturalWidth>0),
 paymentAndPassengers:report.cases.every(c=>c.passengerMaxDisabled&&c.paymentReturns&&c.prematureBookingAttempts===0&&c.photoRemoved),
 paymentFocus:report.cases.every(c=>c.paymentFocusReturns),
 pendingViews:report.checks.length===2&&report.checks.every(c=>!c.overflow),
 sharedRibbon:report.checks.length===2&&report.checks.every((c,i)=>JSON.stringify(c.ribbon)===JSON.stringify(report.cases[i]?.configuration.ribbon)),
 navigation:report.navigation?.length===3&&report.navigation.every(n=>n.selected==='page'&&n.reloadSelected==='page'&&n.backSelected==='page'&&n.curveChanged&&n.interpolatedCurveStates>2),
 reducedMotion:report.reducedMotion==='0s',
 accessibility:accessibilityFailures.length===0,
 noLiveTraffic:report.blockedRequests.length===0&&report.forbiddenWrites.length===0,
};
await fs.writeFile(`${out}/assertions.json`,JSON.stringify(report.assertions,null,2));
if (report.failure || report.pageErrors.length || Object.values(report.assertions).some(pass=>!pass)) process.exitCode = 1;

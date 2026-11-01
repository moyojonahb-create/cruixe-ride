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
 await page.setViewportSize({width:393,height:852});
 await page.goto(origin+'/ride/isolated-pending-ui-state/matching',{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByText('Finding drivers near you',{exact:true}).waitFor();
 await page.evaluate(async()=>{
  const {supabase}=await import('/@fs/C:/Users/MUSAE/Documents/koloi-ride-with-confidence/nonproduction/approved-ride-ui/qa-stabilization/fixture-services.ts');
  const original=supabase.from;
  // Explicit local denial adapter. No session and no backend request or successful save.
  supabase.auth.getUser=async()=>({data:{user:null}});
  window.__noteAttempts=0;
  supabase.from=table=>table==='trip_events'?{insert:()=>{window.__noteAttempts++;return new Promise(resolve=>{window.__denyNote=()=>resolve({error:{message:'ISOLATED delayed denial'}});});}}:original(table);
 });
 await page.getByRole('button',{name:'Note for driver',exact:true}).click();
 const field=page.getByRole('textbox',{name:'Note for your driver'});
 await field.fill('Meet at the gate');
 await page.getByRole('button',{name:'Save note',exact:true}).click();
 await page.getByRole('button',{name:/Saving note/}).waitFor();
 if(!await field.isDisabled())throw Error('Pending note is editable');
 await page.getByRole('button',{name:/Saving note/}).evaluate(el=>el.click());
 await page.getByRole('button',{name:'Toggle sheet',exact:true}).last().click();
 if(await page.evaluate(()=>window.__noteAttempts)!==1||!await field.isVisible())throw Error('Duplicate pending save or early close');
 await page.evaluate(()=>window.__denyNote());
 await page.getByRole('alert').filter({hasText:'Could not save note. Please try again.'}).waitFor();
 if(await field.inputValue()!=='Meet at the gate'||await field.isDisabled())throw Error('Denied note lost draft or stayed disabled');
 await page.getByRole('button',{name:'Save note',exact:true}).click();
 await page.getByRole('button',{name:/Saving note/}).waitFor();
 if(await page.evaluate(()=>window.__noteAttempts)!==2)throw Error('Could not retry');
 await page.evaluate(()=>window.__denyNote());
 await page.getByRole('button',{name:'Save note',exact:true}).waitFor();
 await snap('note-denied-retry');
 report.pass=true;
 report.checks=['one pending submission','pending controls disabled','ribbon cannot close pending note','denial retains draft','denial re-enables controls','retry reaches denied local adapter'];
} catch(error){report.pass=false;report.failure=String(error);}
finally{await browser.close();}
report.pass=report.pass&&report.pageErrors.length===0&&report.consoleErrors.length===0&&report.blockedRequests.length===0&&report.forbiddenWrites.length===0;
await fs.writeFile('qa-resume/note-lifecycle-results.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;

import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(path.join(process.env.TEMP, 'cruize-approved-ride-qa/package.json'));
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const origin = 'http://127.0.0.1:8083';
const out = process.env.CRUIXE_ISOLATED_OUT || 'qa-resume/final-edge';
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


const canonical=JSON.parse(await fs.readFile('qa-stabilization/browser-verified/results.json','utf8')).cases[0].configuration.ribbon;
report.browser={name:'Microsoft Edge',executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',version:browser.version()};
const check=(ok,message)=>{if(!ok)throw Error(message);};
const state=async()=>JSON.parse(await page.getByTestId('secondary-state').textContent());
const events=async(action)=>(await state()).events.filter(e=>e.action===action);
async function reopen(){await page.getByRole('button',{name:'Fixture reopen',exact:true}).click();await page.locator('.ride-sheet-curve').waitFor();await page.waitForTimeout(400);}
async function ribbonClose(){await page.getByRole('button',{name:'Toggle sheet',exact:true}).click();await page.locator('.ride-sheet-curve').waitFor({state:'hidden'});}
async function capture(name){await page.locator('.ride-booking-sheet img').evaluateAll(images=>Promise.allSettled(images.map(img=>img.decode())));await page.waitForTimeout(400);await snap(name);}
try {
 for(const overlay of ['note','schedule','someone','parcel','share']) {
  for(const [width,height] of [[393,852],[360,800]]) {
   const item={overlay,width,height,status:'NOT RUN',checks:[]};report.cases.push(item);
   try {
    await page.setViewportSize({width,height});
    await page.goto(origin+'/secondary-overlays.html?overlay='+overlay,{waitUntil:'domcontentloaded',timeout:120000});
    await page.locator('.ride-sheet-curve').waitFor({timeout:90000});await page.waitForTimeout(500);
    const geometry=await page.locator('.ride-booking-sheet').evaluate(el=>{const r=el.getBoundingClientRect(),svg=el.querySelector('.ride-sheet-curve'),button=el.querySelector(':scope > button'),handle=button.querySelector('span');return {paths:[...svg.querySelectorAll('path')].map(p=>p.getAttribute('d')),svgHeight:svg.getBoundingClientRect().height,handleColor:getComputedStyle(handle).backgroundColor,handleHeight:handle.getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth,panelInside:r.left>=-1&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1};});
    item.geometry=geometry;check(JSON.stringify(geometry.paths)===JSON.stringify(canonical),'Canonical ribbon paths differ');check(geometry.svgHeight===30&&geometry.handleColor==='rgb(255, 255, 255)'&&geometry.handleHeight===5,'Ribbon dimensions or handle differ');check(!geometry.overflow&&geometry.panelInside,'Overlay overflow');
    item.checks.push('canonical paths, height and white handle; viewport fit');
    if(overlay==='note') {
     item.accessibility=await axe('note-final-'+width);
     item.helperColor=await page.getByText(/Keep it short/).evaluate(el=>getComputedStyle(el).color);
     check(item.accessibility.violations.length===0,'Note accessibility recheck failed');
     await fs.writeFile('qa-resume/note-contrast-final.json',JSON.stringify({status:'PASS',browser:report.browser,cases:report.cases.filter(c=>c.overlay==='note').map(c=>({width:c.width,helperColor:c.helperColor,accessibility:c.accessibility}))},null,2));
     await capture('note-final-'+width);
     const field=page.getByRole('textbox',{name:'Note for your driver'});
     await field.fill('Meet at fixture gate');
     await page.getByRole('button',{name:'Call when you arrive',exact:true}).click();
     check((await field.inputValue()).includes('Meet at fixture gate'),'Chip discarded draft');
     await page.getByRole('button',{name:'Call when you arrive',exact:true}).click();
     check(await field.inputValue()==='Meet at fixture gate','Chip removal changed draft');
     await page.getByRole('button',{name:'Use this note every trip',exact:true}).click();
     await page.getByRole('button',{name:'Save note',exact:true}).click();
     await page.getByRole('button',{name:/Saving note/}).waitFor();
     check(await field.isDisabled(),'Note editable while pending');
     await page.getByRole('button',{name:/Saving note/}).evaluate(el=>el.click());
     await page.getByRole('button',{name:'Toggle sheet',exact:true}).click();
     check((await events('note pending')).length===1&&(await state()).open,'Duplicate note or early closure');
     check((await events('note pending'))[0].detail.reuseDraft===true,'Reuse choice not passed');
     await page.getByRole('button',{name:'Fixture deny note',exact:true}).click();
     await page.getByRole('alert').waitFor();check(await field.inputValue()==='Meet at fixture gate'&&!await field.isDisabled(),'Denied note draft or controls lost');
     await page.getByRole('button',{name:'Save note',exact:true}).click();
     await page.getByRole('button',{name:/Saving note/}).waitFor();check((await events('note pending')).length===2,'Note retry did not run');
     await page.getByRole('button',{name:'Fixture deny note',exact:true}).click();await page.getByRole('button',{name:'Save note',exact:true}).waitFor();
     await capture('note-denied-final-'+width);
     await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('.ride-sheet-curve').waitFor({state:'hidden'});await reopen();await ribbonClose();
     item.checks.push('chip append/remove preserves draft','reuse forwarded','single pending save; controls disabled; ribbon cannot close','denial retains draft and permits retry','close/reopen and ribbon close');
    }
    if(overlay==='schedule') {
     await page.getByRole('button',{name:/Tomorrow/}).click();
     await page.getByRole('button',{name:'Remind me 30 min before',exact:true}).click();
     check((await events('schedule callback')).length===0,'Schedule callback fired before confirm');
     await capture('schedule-final-'+width);
     await page.getByRole('button',{name:/^Schedule for /}).click();
     const calls=await events('schedule callback');check(calls.length===1&&new Date(calls[0].detail.at).getTime()>Date.now()&&calls[0].detail.remind===false,'Schedule date/reminder callback mismatch');
     await reopen();await ribbonClose();
     item.checks.push('day selection; reminder toggle','no premature callback; future date and reminder forwarded once','reopen and ribbon close');
    }
    if(overlay==='someone') {
     await page.getByRole('button',{name:'Someone else',exact:true}).click();
     check(await page.getByRole('button',{name:/^Book for /}).isDisabled(),'Invalid third-party data accepted');
     await page.getByPlaceholder("Passenger's name",{exact:true}).fill('Fixture rider');
     await page.getByPlaceholder(/^Phone number/).fill('0770000000');
     await page.getByRole('button',{name:'Pick from contacts',exact:true}).click();check((await events('contacts callback')).length===1,'Contacts callback lost');
     await page.getByRole('button',{name:'Also keep me updated',exact:true}).click();
     await page.getByRole('button',{name:/^I'm paying/}).click();await page.getByRole('button',{name:/^Fixture pays/}).click();
     check((await state()).payer==='passenger','Cash payer choice lost');
     await page.getByRole('button',{name:'Fixture payment',exact:true}).click();await page.waitForTimeout(100);check((await state()).payer==='booker','Wallet did not reset payer');
     await page.getByRole('button',{name:/^I'm paying/}).click();check(await page.getByRole('button',{name:/^Fixture pays/}).isDisabled(),'Wallet allowed passenger payer');
     await page.getByRole('button',{name:/^I'm paying/}).click();
     await page.getByRole('button',{name:'Fixture submitting',exact:true}).click();check(await page.getByRole('button',{name:/Booking/}).isDisabled(),'Third-party submit guard lost');await page.getByRole('button',{name:'Fixture submitting',exact:true}).click();
     await capture('someone-final-'+width);
     await page.getByRole('button',{name:/^Book for /}).click();check((await events('third-party callback denied')).length===1,'Third-party callback lost');
     await page.getByRole('button',{name:'Myself',exact:true}).click();const self=await state();check(!self.enabled&&!self.passengerName&&!self.phone&&self.payer==='booker','Myself did not clear third-party fields');
     await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('.ride-sheet-curve').waitFor({state:'hidden'});await reopen();await ribbonClose();
     item.checks.push('invalid recipient blocks submit; controlled name/phone','contacts callback only; notification toggle','cash payer; wallet fallback and cash-only restriction','submitting guard; denied local callback','Myself clears details; Continue closes; reopen/ribbon close');
    }
    if(overlay==='parcel') {
     check(await page.getByRole('button',{name:/^Find a driver/}).isDisabled(),'Parcel accepted missing recipient');
     await page.getByRole('button',{name:/^Medium/}).click();check((await state()).size==='medium','Parcel size callback lost');
     await page.getByRole('button',{name:/Add recipient details/}).click();
     await page.getByPlaceholder(/Recipient.*name/).fill('Fixture recipient');await page.getByPlaceholder(/^Phone number/).fill('0770000000');await page.getByPlaceholder(/^Delivery note/).fill('Fixture reception');
     await page.getByRole('button',{name:'Done',exact:true}).click();
     await page.getByRole('button',{name:/Who pays the driver/}).click();await page.getByRole('button',{name:/^Recipient pays/}).click();
     await page.getByRole('button',{name:'Fixture payment',exact:true}).click();await page.waitForTimeout(100);
     await page.getByRole('button',{name:/Who pays the driver/}).click();check(await page.getByRole('button',{name:/^Recipient pays/}).isDisabled(),'Wallet allowed recipient payer');await page.getByRole('button',{name:/^I pay now/}).click();
     const chooserEvent=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Upload',exact:true}).click();const chooser=await chooserEvent;check((await chooser.element().getAttribute('accept'))==='image/*','Photo picker hook lost');
     await page.getByRole('button',{name:'Fixture submitting',exact:true}).click();check(await page.getByRole('button',{name:/Finding a driver/}).isDisabled(),'Parcel submit guard lost');await page.getByRole('button',{name:'Fixture submitting',exact:true}).click();
     await capture('parcel-final-'+width);
     await page.getByRole('button',{name:/^Find a driver/}).click();const calls=await events('parcel callback denied');check(calls.length===1&&calls[0].detail.packageSize==='medium'&&calls[0].detail.recipientName==='Fixture recipient'&&calls[0].detail.deliveryNote==='Fixture reception'&&calls[0].detail.whoPays==='sender'&&calls[0].detail.photoPath===null,'Parcel callback payload changed');
     await page.getByRole('button',{name:'Back',exact:true}).click();await page.locator('.ride-sheet-curve').waitFor({state:'hidden'});await reopen();await ribbonClose();
     item.checks.push('recipient required; size, recipient, phone and note editing','wallet resets recipient payer; recipient option disabled','Upload opens image chooser; no upload performed','optional photo remains optional; submitting guard; denied callback payload','Back/reopen/ribbon close');
    }
    if(overlay==='share') {
     await capture('share-final-'+width);
     await page.getByRole('button',{name:'Ride alone',exact:true}).click();check((await events('ride alone callback')).length===1,'Ride-alone callback lost');
     await page.getByRole('button',{name:'Fixture submitting',exact:true}).click();check(await page.getByRole('button',{name:/Finding a driver/}).isDisabled(),'Share submit guard lost');await page.getByRole('button',{name:'Fixture submitting',exact:true}).click();
     await page.getByRole('button',{name:/^Share /}).click();check((await events('share callback denied')).length===1,'Share callback lost');
     await ribbonClose();await reopen();await page.mouse.click(10,60);await page.locator('.ride-sheet-curve').waitFor({state:'hidden'});
     item.checks.push('Ride alone callback','submitting guard; denied share callback','ribbon close/reopen/backdrop close');
    }
    item.status='PASS';
   } catch(error){item.status='FAIL';item.failure=String(error);await snap(overlay+'-failure-'+width).catch(()=>{});if(overlay==='note')throw error;}
   await fs.writeFile('qa-resume/overlays-edge-results.json',JSON.stringify(report,null,2));
  }
 }
} catch(error){report.failure=String(error);}
finally{await browser.close();}
report.status=!report.failure&&report.cases.length===10&&report.cases.every(c=>c.status==='PASS')&&report.pageErrors.length===0&&report.consoleErrors.length===0&&report.httpErrors.length===0&&report.blockedRequests.length===0&&report.forbiddenWrites.length===0?'PASS':'FAIL';
await fs.writeFile('qa-resume/overlays-edge-results.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;

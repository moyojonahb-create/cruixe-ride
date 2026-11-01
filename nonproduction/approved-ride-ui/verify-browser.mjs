import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(path.join(process.env.TEMP, 'cruize-approved-ride-qa/package.json'));
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const out = path.resolve('qa');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, timeout: 60000, executablePath: path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe') });
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://127.0.0.1:8082/ride', { waitUntil: 'commit', timeout: 180000 });
await page.waitForSelector('.ride-start', { timeout: 180000 });
console.log('Ride screen loaded');
// Dismiss the real optional GPS explanation without granting or inventing a fix.
const later = page.getByRole('button', { name: /set pickup manually/i });
if (await later.count()) await later.first().click();
const layouts = [];
for (const [name,width,height] of [['android',360,800],['iphone',390,844],['narrow',320,568],['small-height',375,480],['large-phone',430,932],['desktop',1440,900]]) {
 await page.setViewportSize({width,height});
 await page.waitForTimeout(600);
 await page.screenshot({path:path.join(out,`${name}.png`)});
 const layout = await page.evaluate(() => {
  const selectors=['.ride-booking-sheet','.ride-destination-card','.ride-shortcut--home','.ride-shortcut--work','.ride-schedule','.ride-start'];
  return {overflow:document.documentElement.scrollWidth>innerWidth, controls:selectors.map(selector=>{const el=document.querySelector(selector); const r=el.getBoundingClientRect();return {selector,x:r.x,y:r.y,width:r.width,height:r.height,visible:r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight};})};
 });
 layouts.push({name,width,height,...layout});
}
await page.setViewportSize({width:390,height:844});
const axe = await new AxeBuilder({page}).include('.approved-ride').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
await page.getByRole('button',{name:'Where to? Search destination'}).click();
await page.getByText('Choose a ride',{exact:true}).waitFor();
await page.screenshot({path:path.join(out,'tier-picker.png')});
await page.reload();
await page.locator('.ride-start').waitFor();
if(await later.count()) await later.first().click();
await page.getByRole('button',{name:'Schedule a ride',exact:true}).click();
await page.screenshot({path:path.join(out,'schedule.png')});
await page.reload();
await page.locator('.ride-start').waitFor();
if(await later.count()) await later.first().click();
await page.getByRole('button',{name:'Select town, currently Gwanda'}).click();
await page.getByRole('textbox',{name:'Search towns'}).fill('Bulawayo');
await page.screenshot({path:path.join(out,'town-selector.png')});
await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify({layouts,errors,violations:axe.violations.map(({id,impact,description,nodes})=>({id,impact,description,nodes:nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))},null,2));
console.log(JSON.stringify({layouts,errors,violations:axe.violations.map(v=>({id:v.id,impact:v.impact}))},null,2));
await browser.close();



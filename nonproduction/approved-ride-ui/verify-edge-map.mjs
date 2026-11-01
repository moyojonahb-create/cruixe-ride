import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs/promises';
const require=createRequire(path.join(process.env.TEMP,'cruize-approved-ride-qa/package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,timeout:60000,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const context=await browser.newContext({viewport:{width:390,height:694},reducedMotion:'reduce'});
const page=await context.newPage();
const evidence={consoleErrors:[],pageErrors:[],requestFailures:[],httpErrors:[]};
const safeUrl=u=>{const x=new URL(u);return x.origin+x.pathname;};
page.on('console',m=>{if(m.type()==='error')evidence.consoleErrors.push(m.text().replace(/([?&](?:access_token|key|apikey)=)[^&\s]+/gi,'$1[redacted]'));});
page.on('pageerror',e=>evidence.pageErrors.push(e.message));
page.on('requestfailed',r=>evidence.requestFailures.push({url:safeUrl(r.url()),error:r.failure()?.errorText}));
page.on('response',r=>{if(r.status()>=400)evidence.httpErrors.push({url:safeUrl(r.url()),status:r.status()});});
try {
 await page.goto('http://localhost:8081/ride',{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('.ride-start').waitFor({timeout:90000});
 const dismiss=page.getByRole('button',{name:'Set pickup manually',exact:true});
 if(await dismiss.count())await dismiss.click();
 try {await page.waitForFunction(()=>!!document.querySelector('.mapboxgl-canvas')||!!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Retry')),{},{timeout:30000});} catch { evidence.mapWaitTimedOut=true; }
 try { await page.waitForLoadState('networkidle', { timeout: 30000 }); } catch { evidence.networkIdleTimedOut = true; }
 await page.waitForTimeout(8000);
 await page.screenshot({path:'qa-edge/reference-viewport.png'});
 evidence.rendered=await page.evaluate(()=>{
 const selectors=['.ride-booking-sheet > div:last-child','.ride-shortcut--home','.ride-shortcut--work','.ride-town-pill','.ride-area-pill','.ride-start'];
 return {mapCanvas:!!document.querySelector('.mapboxgl-canvas'),loadingMap:document.body.innerText.includes('Loading Mapbox'),mapMessages:document.body.innerText.split('\n').filter(s=>/map|retry|unavailable/i.test(s)),styles:selectors.map(selector=>{const e=document.querySelector(selector); const c=getComputedStyle(e);return {selector,background:c.backgroundColor,backgroundImage:c.backgroundImage,paddingBottom:c.paddingBottom};})};
 });
} catch(e){evidence.failure=e.message;}
await fs.writeFile('qa-edge/live-map-review.json',JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence,null,2));
await browser.close();


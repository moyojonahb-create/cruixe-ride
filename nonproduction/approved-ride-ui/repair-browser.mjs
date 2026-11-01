import {createRequire} from 'node:module';import fs from 'node:fs/promises';import path from 'node:path';
const require=createRequire(path.join(process.env.TEMP,'cruize-approved-ride-qa/package.json'));const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const context=await browser.newContext();const page=await context.newPage();page.setDefaultTimeout(30000);
const report={sizes:[],errors:[],console:[],failures:[],httpErrors:[],writes:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text())});
page.on('requestfailed',r=>report.failures.push({url:r.url(),error:r.failure()}));page.on('response',r=>{if(r.status()>=400)report.httpErrors.push({url:r.url(),status:r.status()})});
await context.route('**/*',async route=>{const r=route.request();if(['POST','PUT','PATCH','DELETE'].includes(r.method())&&/\/rides(?:\/|$)|request-ride/.test(new URL(r.url()).pathname)){report.writes.push({url:r.url(),method:r.method()});await route.abort();return;}await route.continue()});
try{
for(const [width,height] of [[393,852],[360,800]]){
await page.setViewportSize({width,height});await page.goto('http://localhost:8081/ride?view=choose',{waitUntil:'domcontentloaded',timeout:120000});
await page.getByRole('button',{name:'Choose Economy',exact:true}).waitFor({timeout:120000});const dismiss=page.getByRole('button',{name:'Set pickup manually',exact:true});if(await dismiss.count())await dismiss.click();
const entry={width,height};await page.screenshot({path:`qa-repair/choose-${width}.png`});
entry.images=await page.locator('.ride-selection-card__vehicle').evaluateAll(es=>es.map(e=>({src:e.currentSrc,width:e.naturalWidth,complete:e.complete})));
entry.chooseOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
await page.getByRole('button',{name:'Choose Economy',exact:true}).click();entry.destinationUrl=page.url();
const field=page.getByRole('textbox',{name:'Destination',exact:true});await field.waitFor();await page.screenshot({path:`qa-repair/destination-${width}.png`});
await field.fill('Gwanda');const result=page.locator('.destination-option').filter({hasText:'Gwanda Public Swimming Pool'}).first();
try{
await result.waitFor({timeout:45000});await result.click();await page.locator('.destination-screen').waitFor({state:'hidden'});
await page.getByRole('button',{name:'Confirm location & continue',exact:true}).waitFor();
entry.configText=await page.locator('.ride-booking-sheet').innerText();entry.configImages=await page.locator('.ride-booking-sheet img').evaluateAll(es=>es.map(e=>({src:e.currentSrc,width:e.naturalWidth})));
await page.screenshot({path:`qa-repair/configuration-${width}.png`});entry.configOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
await page.locator('.ride-config-utility--cash').click();await page.getByRole('dialog',{name:'Choose payment method'}).waitFor();await page.getByRole('button',{name:'Pay with cash',exact:true}).click();
entry.paymentReturnsToConfiguration=await page.getByRole('button',{name:'Confirm location & continue',exact:true}).isVisible();entry.writesAfterPayment=report.writes.length;
await page.locator('.ride-config-utility--luggage').click();entry.luggageDialog=await page.getByRole('dialog').innerText();await page.keyboard.press('Escape');
}catch(e){entry.configurationBlocked=String(e);entry.body=await page.locator('body').innerText()}
report.sizes.push(entry);
}
report.matchingImport=await page.evaluate(async()=>{try{const m=await import('/src/pages/RideMatching.tsx');return {ok:typeof m.default==='function'}}catch(e){return {error:String(e)}}});
await page.goto('http://localhost:8081/ride?view=choose',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Choose Economy',exact:true}).waitFor();
report.navigation=[];for(const name of ['Account','Activity','Wallet']){await page.getByRole('button',{name,exact:true}).click();await page.waitForURL('**/auth');report.navigation.push({name,url:page.url(),authGuard:true});await page.goBack();await page.getByRole('button',{name:'Choose Economy',exact:true}).waitFor()}
await page.emulateMedia({reducedMotion:'no-preference'});report.cradleDuration=await page.locator('.rider-navigation__background path').evaluate(e=>getComputedStyle(e).transitionDuration);
await page.emulateMedia({reducedMotion:'reduce'});report.reducedDuration=await page.locator('.rider-navigation__background path').evaluate(e=>getComputedStyle(e).transitionDuration);
}catch(e){report.failure=String(e)}finally{await fs.writeFile('qa-repair/browser-results.json',JSON.stringify(report,null,2));await browser.close()}console.log(JSON.stringify(report,null,2));

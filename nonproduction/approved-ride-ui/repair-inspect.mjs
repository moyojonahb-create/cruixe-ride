import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(path.join(process.env.TEMP,'cruize-approved-ride-qa/package.json'));
const {chromium}=require('playwright');
await fs.mkdir('qa-repair',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const page=await browser.newPage({viewport:{width:393,height:852}});
const report={errors:[],console:[],failures:[],responses:[]};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')report.console.push(m.text())});
page.on('requestfailed',r=>report.failures.push({url:r.url(),error:r.failure()}));
page.on('response',async r=>{if(r.status()>=400||/brand\/.*webp/.test(r.url()))report.responses.push({url:r.url(),status:r.status(),type:r.headers()['content-type'],body:r.status()>=400?(await r.text().catch(()=>'')).slice(0,2500):undefined})});
try{
await page.goto('http://localhost:8081/ride?view=choose',{waitUntil:'domcontentloaded',timeout:120000});
await page.getByRole('button',{name:'Choose Economy',exact:true}).waitFor({timeout:120000});
const dismiss=page.getByRole('button',{name:'Set pickup manually',exact:true});if(await dismiss.count())await dismiss.click();
report.images=await page.locator('img').evaluateAll(es=>es.map(e=>({src:e.currentSrc,complete:e.complete,width:e.naturalWidth})));
await page.screenshot({path:'qa-repair/before-choose.png'});
report.matchingImport=await page.evaluate(async()=>{try{const m=await import('/src/pages/RideMatching.tsx');return {ok:typeof m.default==='function'}}catch(e){return {error:String(e),stack:e.stack}}});
}catch(e){report.failure=String(e)}
await fs.writeFile('qa-repair/before.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();

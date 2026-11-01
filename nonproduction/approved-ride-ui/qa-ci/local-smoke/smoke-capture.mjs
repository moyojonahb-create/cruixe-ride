import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(path.join(process.env.TEMP,'cruize-approved-ride-qa/package.json'));
const {chromium}=require('playwright');
const report={status:'NOT RUN',url:'http://localhost:8081/ride',viewport:{width:393,height:852},playwright:require('playwright/package.json').version,browser:'Microsoft Edge',executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',consoleErrors:[],pageErrors:[],blockedRequests:[],httpErrors:[]};
let browser,page;
try {
 browser=await chromium.launch({headless:true,executablePath:report.executablePath});report.browserVersion=browser.version();
 const context=await browser.newContext({viewport:report.viewport,serviceWorkers:'block',timezoneId:'Africa/Johannesburg'});
 await context.route('**/*',route=>{const r=route.request(),u=new URL(r.url());if(u.origin!=='http://localhost:8081'||!['GET','HEAD'].includes(r.method())){report.blockedRequests.push({origin:u.origin,path:u.pathname,method:r.method()});return route.abort();}return route.continue();});
 await context.addInitScript(()=>{const Native=window.WebSocket;window.WebSocket=class extends Native{constructor(url,protocols){const u=new URL(String(url),location.href);if(!['localhost','127.0.0.1'].includes(u.hostname)||u.pathname!=='/')throw Error('Read-only smoke: external WebSocket denied');super(url,protocols);}};});
 page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.httpErrors.push({url:r.url().split('?')[0],status:r.status()});});
 const response=await page.goto(report.url,{waitUntil:'domcontentloaded',timeout:60000});report.httpStatus=response.status();
 await page.locator('#root').waitFor({timeout:20000});await page.waitForTimeout(1500);
 report.rendered=await page.locator('#root').evaluate(el=>el.childElementCount>0&&el.getBoundingClientRect().height>0);
 report.ribbon=await page.locator('.ride-sheet-curve').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return{visible:r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight,paths:[...el.querySelectorAll('path')].map(p=>p.getAttribute('d'))};}));
 report.ribbonVisible=report.ribbon.some(r=>r.visible);
 report.screenshot='qa-ci/local-smoke/localhost-8081-ride-edge-393.png';await page.screenshot({path:report.screenshot});
 report.status=report.rendered&&report.ribbonVisible&&report.httpStatus===200&&report.pageErrors.length===0&&report.consoleErrors.length===0?'PASS':'FAIL';
} catch(error){report.status=String(error).includes('ERR_CONNECTION_REFUSED')?'BLOCKED':'FAIL';report.failure=String(error);if(page){report.screenshot='qa-ci/local-smoke/unavailable-8081-edge-393.png';report.screenshotScope='Navigation failure only; no application rendered';await page.screenshot({path:report.screenshot}).catch(()=>{delete report.screenshot;});}}
finally{if(browser)await browser.close();await fs.writeFile('qa-ci/local-smoke/result.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));

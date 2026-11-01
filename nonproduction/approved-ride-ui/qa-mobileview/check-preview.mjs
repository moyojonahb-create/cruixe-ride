import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(path.join(process.env.TEMP,'cruize-approved-ride-qa/package.json'));
const {chromium,devices}=require('playwright');
const origin='http://127.0.0.1:8083',out='qa-mobileview';
const report={url:origin+'/ride',scope:'Existing labelled isolated fixture; no live services',device:'iPhone XR',browser:'Microsoft Edge (headless diagnostic only)',errors:[],consoleErrors:[],httpErrors:[],blocked:[]};
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const context=await browser.newContext({...devices['iPhone XR'],defaultBrowserType:undefined,serviceWorkers:'block'});
 await context.route('**/*',route=>{const r=route.request(),u=new URL(r.url());if(u.origin!==origin||!['GET','HEAD'].includes(r.method())){report.blocked.push({origin:u.origin,path:u.pathname,method:r.method()});return route.abort();}return route.continue();});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.httpErrors.push({url:r.url().split('?')[0],status:r.status()});});
 await page.goto(report.url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('#root > *').first().waitFor({timeout:60000});
 await page.waitForTimeout(1200);
 report.viewport=page.viewportSize();report.rootChildren=await page.locator('#root').evaluate(el=>el.childElementCount);report.visibleText=(await page.locator('body').innerText()).slice(0,1200);report.status=report.errors.length===0&&report.rootChildren>0?'PASS':'FAIL';
 await page.screenshot({path:out+'/iphone-xr-preview.png'});
}catch(e){report.status='FAIL';report.failure=String(e);}finally{await browser.close();await fs.writeFile(out+'/diagnostics.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}

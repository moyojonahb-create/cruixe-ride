import {createRequire} from 'node:module';import fs from 'node:fs/promises';import path from 'node:path';
const require=createRequire(path.join(process.env.TEMP,'cruize-approved-ride-qa/package.json'));const {chromium}=require('playwright');const {default:AxeBuilder}=require('@axe-core/playwright');
const out='qa-stabilization/browser-finding-final';await fs.mkdir(out,{recursive:true});
const report={authority:'MOCKED/ISOLATED pending UI; no matching success',cases:[],errors:[],blockedRequests:[],retries:[]};
const original=JSON.parse(await fs.readFile('qa-stabilization/browser-final/results.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const context=await browser.newContext({reducedMotion:'reduce',timezoneId:'Africa/Johannesburg'});
await context.route('**/*',route=>{const r=route.request(),u=new URL(r.url());if(u.origin!=='http://127.0.0.1:8083'||!['GET','HEAD'].includes(r.method())){report.blockedRequests.push({origin:u.origin,path:u.pathname,method:r.method()});return route.abort()}return route.continue()});
const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.stack||e.message));page.setDefaultTimeout(20000);
try{
for(const [width,height] of [[393,852],[360,800]]){
 await page.setViewportSize({width,height});const url='http://127.0.0.1:8083/ride/isolated-pending-ui-state/matching';
 try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000})}catch(e){if(!String(e).includes('ERR_NETWORK_IO_SUSPENDED'))throw e;report.retries.push({width,reason:'browser network I/O suspended; safe local GET retried once'});await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000})}
 await page.getByText('Finding drivers near you',{exact:true}).waitFor();await page.waitForTimeout(250);
 const ribbon=await page.locator('.ride-sheet-curve path').evaluateAll(paths=>paths.map(p=>p.getAttribute('d')));
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 const state=await page.locator('.ride-finding-content').innerText();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 const expected=original.cases.find(c=>c.width===width).configuration.ribbon;
 const sameRibbon=JSON.stringify(ribbon)===JSON.stringify(expected);
 await page.screenshot({path:`${out}/finding-drivers-${width}.png`});
 report.cases.push({width,height,overflow,sameRibbon,ribbon,state,violations:axe.violations.map(({id,impact,nodes})=>({id,impact,targets:nodes.map(n=>n.target)}))});
}
}catch(e){report.failure=String(e)}finally{await fs.writeFile(`${out}/results.json`,JSON.stringify(report,null,2));await browser.close()}
report.pass=!report.failure&&report.errors.length===0&&report.blockedRequests.length===0&&report.cases.length===2&&report.cases.every(c=>!c.overflow&&c.sameRibbon&&c.violations.length===0);
await fs.writeFile(`${out}/status.json`,JSON.stringify({authority:report.authority,pass:report.pass},null,2));console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;

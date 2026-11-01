import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(path.join(process.env.TEMP,'cruize-approved-ride-qa/package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const page=await browser.newPage({viewport:{width:393,height:852}});
const report={errors:[],failed:[],responses:[],console:[]}; const pending=new Set(); page.on('request',r=>pending.add(r.url()));page.on('requestfinished',r=>pending.delete(r.url()));page.on('requestfailed',r=>pending.delete(r.url()));page.on('console',m=>{if(m.type()==='error')report.console.push(m.text())});
page.on('pageerror',e=>report.errors.push(e.message));
page.on('requestfailed',r=>report.failed.push({url:r.url(),error:r.failure()?.errorText}));
page.on('response',async r=>{if(r.status()>=400)report.responses.push({url:r.url(),status:r.status(),body:(await r.text().catch(()=>'' )).slice(0,1200)});});
try{await page.goto(process.argv[2]||'http://localhost:8080/',{waitUntil:'commit',timeout:90000});await page.waitForTimeout(45000);report.pending=[...pending];const manual=page.getByRole('button',{name:'Set pickup manually',exact:true});if(await manual.count())await manual.click(); report.url=page.url();report.text=(await page.locator('body').innerText()).slice(0,2000);report.rootChildren=await page.locator('#root').evaluate(e=>e.childElementCount);await page.screenshot({path:'nonproduction/startup-check.png'});}catch(e){report.failure=String(e);}finally{console.log(JSON.stringify(report));await browser.close();}



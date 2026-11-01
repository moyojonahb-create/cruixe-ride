import {createRequire} from 'node:module';import fs from 'node:fs/promises';import path from 'node:path';
const require=createRequire(path.join(process.env.TEMP,'cruize-approved-ride-qa/package.json'));const {chromium}=require('playwright');const {default:AxeBuilder}=require('@axe-core/playwright');
const out='qa-destination-flow';await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,timeout:180000,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();const report={sizes:[],errors:[],posts:[]};page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'&&/rides|request-ride/.test(r.url()))report.posts.push(r.url())});
try {
 report.journeys=[];
 for(const [name,id] of [['Economy','economy'],['Shared','share'],['Parcel','parcel']]) {
 await page.goto('http://localhost:8081/ride?view=choose',{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByRole('button',{name:`Choose ${name}`}).waitFor({timeout:90000});
 const dismiss=page.getByRole('button',{name:'Set pickup manually',exact:true});if(await dismiss.count())await dismiss.click();
 await page.getByRole('button',{name:`Choose ${name}`}).click();
 const field=page.getByRole('textbox',{name:'Destination',exact:true});await field.waitFor();
 const entryUrl=page.url();await field.fill('Gwanda');
 const result=page.locator('.destination-option').filter({hasText:'Gwanda Public Swimming Pool'}).first();await result.waitFor({timeout:45000});await result.click();
 await page.locator('.destination-screen').waitFor({state:'hidden',timeout:45000});
 report.journeys.push({name,entryUrl,preservedTier:page.url().includes('tier='+id),destinationVisible:(await page.locator('body').innerText()).includes('Gwanda Public Swimming Pool'),prematurePosts:report.posts.length});
 await page.screenshot({path:out+'/'+id+'-next.png'});
 await page.goBack();await page.getByRole('heading',{name:'Choose a ride',exact:true}).waitFor();
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
 report.motion=await page.locator('.rider-navigation__background path').evaluate(e=>getComputedStyle(e).transitionDuration);
 await page.emulateMedia({reducedMotion:'reduce'});report.reducedMotion=await page.locator('.rider-navigation__background path').evaluate(e=>getComputedStyle(e).transitionDuration);
 for(const name of ['Account','Activity','Wallet']){await page.getByRole('button',{name,exact:true}).click();await page.waitForURL('**/auth');report[name]='auth guard';await page.goto('http://localhost:8081/ride?view=choose',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Choose Economy'}).waitFor();}
} catch(e){report.failure=String(e);await page.screenshot({path:out+'/failure.png'}).catch(()=>{});}finally{await fs.writeFile(out+'/results.json',JSON.stringify(report,null,2));await browser.close();}console.log(JSON.stringify(report));

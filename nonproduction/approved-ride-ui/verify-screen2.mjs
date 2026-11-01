import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(path.join(process.env.TEMP,'cruize-approved-ride-qa/package.json'));
const {chromium}=require('playwright'); const {default:AxeBuilder}=require('@axe-core/playwright');
const out=path.resolve('qa-screen2');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,timeout:180000,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}});
const page=await context.newPage();page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(90000);
const result={pageErrors:[],bookingPosts:[],viewports:[],selectionJourneys:[],protectedRoutes:[]};
page.on('pageerror',e=>result.pageErrors.push(e.message));
page.on('request',r=>{const u=new URL(r.url());if(r.method()==='POST'&&(/\/rides\/?$/.test(u.pathname)||u.pathname.includes('request_cash_ride')))result.bookingPosts.push(u.pathname);});
const dismiss=async()=>{const b=page.getByRole('button',{name:'Set pickup manually',exact:true});if(await b.count())await b.click();};
const ready=async()=>{await page.getByRole('heading',{name:'Choose a ride',exact:true}).waitFor();await page.getByRole('textbox',{name:'Destination',exact:true}).waitFor({state:'hidden'});await page.waitForFunction(()=>Array.from(document.querySelectorAll('.ride-selection-card img')).length===3&&Array.from(document.querySelectorAll('.ride-selection-card img')).every(i=>i.complete&&i.naturalWidth>0));};
try{
 await page.goto('http://localhost:8081/ride',{waitUntil:'domcontentloaded'});await page.locator('.ride-start').waitFor();await dismiss();
 result.homeNavHidden=await page.getByRole('navigation',{name:'Rider navigation'}).count()===0;
 await page.screenshot({path:path.join(out,'screen1-preserved.png')});
 await page.locator('.ride-start').click();await ready();
 result.entryUrl=page.url();
 result.initialRideSelected=await page.getByRole('button',{name:'Ride',exact:true}).getAttribute('aria-current')==='page';
 for(const [name,width,height] of [['small',320,640],['android',360,800],['iphone-small',375,812],['iphone',390,844],['pixel',393,852],['large',430,932],['short',375,480],['landscape',800,400]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(250);
  result.viewports.push({name,width,height,...await geometry(page)});
  await page.screenshot({path:path.join(out,`${name}.png`)});
 }
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>document.documentElement.style.fontSize='20px');await page.waitForTimeout(250);
 result.largeText=await geometry(page);await page.screenshot({path:path.join(out,'large-text.png')});
 await page.evaluate(()=>document.documentElement.style.fontSize='');
 const axe=await new AxeBuilder({page}).include('.ride-selection-content').include('.rider-navigation').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 result.accessibility=axe.violations.map(({id,impact,nodes})=>({id,impact,nodes:nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
 result.reducedMotion=await page.locator('.rider-navigation__icon').first().evaluate(e=>getComputedStyle(e).transitionDuration);
 for(const [name,id] of [['Economy','economy'],['Shared','share'],['Parcel','parcel']]){
  const choice = page.getByRole('button',{name:`Choose ${name}`,exact:true});
  if (id === 'economy') { await choice.focus(); await page.keyboard.press('Enter'); } else await choice.click();
  await page.getByRole('textbox',{name:'Destination',exact:true}).waitFor();
  const url=page.url();const navHidden=await page.getByRole('navigation',{name:'Rider navigation'}).count()===0;
  await page.screenshot({path:path.join(out,`screen3-${id}.png`)});
  await page.goBack();await ready();
  result.selectionJourneys.push({name,id,url,navHidden,selectedRestored:await page.getByRole('button',{name:`Choose ${name}`,exact:true}).getAttribute('aria-pressed')==='true'});
 }
 await page.setViewportSize({width:320,height:640});
 await page.getByRole('button',{name:'Choose Parcel',exact:true}).click();
 await page.getByRole('textbox',{name:'Destination',exact:true}).waitFor();
 result.smallParcelReachable = true;
 await page.goBack(); await ready();
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Home',exact:true}).focus();
 await page.keyboard.press('Tab');
 result.keyboardFocus = await page.evaluate(() => ({ label: document.activeElement.getAttribute('aria-label'), outline: getComputedStyle(document.activeElement).outlineWidth }));
 for(const name of ['Account','Activity','Wallet']){
  await page.getByRole('button',{name,exact:true}).click();
  await page.waitForURL(u=>u.pathname==='/auth'||['/profile','/history','/wallet'].includes(u.pathname));
  await page.waitForTimeout(500);
  result.protectedRoutes.push({name,url:page.url(),authenticationRequired:new URL(page.url()).pathname==='/auth'});
  await page.goBack();await ready();
 }
 await page.getByRole('button',{name:'Home',exact:true}).click();
 await page.locator('.ride-start').waitFor();await page.waitForTimeout(300);
 result.homeReturn={url:page.url(),navHidden:await page.getByRole('navigation',{name:'Rider navigation'}).count()===0};
 await page.locator('.ride-start').click();await ready();
 await page.getByRole('button',{name:'Back to ride home',exact:true}).click();
 await page.locator('.ride-start').waitFor();result.backToHome=true;
 // Verify deep linking and the single normal-motion active icon after all real journeys.
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('http://localhost:8081/ride?view=choose',{waitUntil:'domcontentloaded'});await ready();await dismiss();
 try { await page.waitForLoadState('networkidle', { timeout:30000 }); } catch {}
 await page.waitForTimeout(2000);await page.screenshot({path:path.join(out,'final-screen2.png')});
 result.normalMotion=await page.locator('.rider-navigation__icon').first().evaluate(e=>getComputedStyle(e).transitionDuration);
}catch(e){result.failure=e.message;try{await page.screenshot({path:path.join(out,'failure.png')});}catch{}}
await fs.writeFile(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();
async function geometry(page){return page.evaluate(()=>{
 const nav=document.querySelector('.rider-navigation'),card=nav.querySelector('.rider-navigation__card'),nr=card.getBoundingClientRect();
 const selected=nav.querySelectorAll('[data-selected="true"]');
 const labels=Array.from(nav.querySelectorAll('.rider-navigation__label')).map(e=>({label:e.textContent,opacity:getComputedStyle(e).opacity,inside:e.getBoundingClientRect().bottom<=nr.bottom}));
 const scroller=document.querySelector('.ride-selection-cards-scroll');
 const ir=nav.querySelector('[data-selected="true"] .rider-navigation__icon').getBoundingClientRect();
 return {horizontalOverflow:document.documentElement.scrollWidth>innerWidth,selectedIcons:selected.length,visibleLabels:labels.filter(l=>Number(l.opacity)>0).map(l=>l.label),labelsInside:labels.every(l=>l.inside),activeCircleClearance:ir.top-scroller.getBoundingClientRect().bottom,activeCircleUnclipped:ir.top>=0&&ir.left>=0&&ir.right<=innerWidth,navInViewport:nr.left>=0&&nr.right<=innerWidth&&nr.bottom<=innerHeight,scrollable:scroller.scrollHeight>scroller.clientHeight,
 cards:Array.from(document.querySelectorAll('.ride-selection-card')).map(e=>{const r=e.getBoundingClientRect(),i=e.querySelector('img'),ir=i.getBoundingClientRect(),title=e.querySelector('.ride-selection-card__title'),tr=title.getBoundingClientRect(),body=e.querySelector('.ride-selection-card__body').getBoundingClientRect();return {name:title.textContent,width:r.width,height:r.height,touchTarget:r.height>=44&&r.width>=44,imageContained:ir.left>=r.left&&ir.right<=r.right&&ir.top>=r.top&&ir.bottom<=r.bottom,objectFit:getComputedStyle(i).objectFit,titleWithinBody:tr.left>=body.left-1&&tr.right<=body.right+1};}),
 panelBackground:getComputedStyle(document.querySelector('.ride-booking-sheet > div:last-child')).backgroundColor};
 });}

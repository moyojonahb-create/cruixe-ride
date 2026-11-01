import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs/promises';
const require=createRequire(path.join(process.env.TEMP,'cruize-approved-ride-qa/package.json'));
const {chromium}=require('playwright');
const out=path.resolve('qa-vehicles');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,timeout:180000,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const context=await browser.newContext({reducedMotion:'reduce'});
const page=await context.newPage();
page.setDefaultTimeout(60000);
const result={pageErrors:[],assetResponses:[],viewports:[]};
page.on('pageerror',e=>result.pageErrors.push(e.message));
page.on('response',r=>{if(/\/brand\/cruize-.*\.webp$/.test(new URL(r.url()).pathname))result.assetResponses.push({url:new URL(r.url()).pathname,status:r.status()});});
try{
 await page.goto('http://localhost:8081/ride',{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('.ride-start').waitFor();
 const dismiss=page.getByRole('button',{name:'Set pickup manually',exact:true});
 if(await dismiss.count())await dismiss.click();
 for(const [name,width,height] of [['android',360,800],['iphone',390,844],['narrow',320,568],['small-height',375,480],['large-phone',430,932]]){
  await page.setViewportSize({width,height});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.ride-start').waitFor();
  if(await dismiss.count())await dismiss.click();
  await page.waitForFunction(()=>{const i=document.querySelector('.ride-destination-card img');return i?.complete&&i.naturalWidth>0;});
  await page.screenshot({path:path.join(out,`${name}-search.png`)});
  const search=await inspectImages(page);
  await page.getByRole('button',{name:'Where to? Search destination'}).click();
  await page.getByText('Choose a ride',{exact:true}).waitFor();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('img[src^="/brand/cruize-"]')).length===3&&Array.from(document.querySelectorAll('img[src^="/brand/cruize-"]')).every(i=>i.complete&&i.naturalWidth>0));
  await page.screenshot({path:path.join(out,`${name}-tiers.png`)});
  const tiers=await inspectImages(page);
  result.viewports.push({name,width,height,search,tiers});
 }
 result.pass=result.pageErrors.length===0&&result.viewports.every(v=>!v.search.overflow&&!v.tiers.overflow&&[...v.search.images,...v.tiers.images].every(i=>i.loaded&&i.inViewport&&i.withinCard&&i.objectFit==='contain'&&i.filter==='none'));
}catch(e){result.pass=false;result.failure=e.message;}
await fs.writeFile(path.join(out,'results.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
await browser.close();
async function inspectImages(page){return page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,images:Array.from(document.querySelectorAll('img[src^="/brand/cruize-"]')).map(i=>{const r=i.getBoundingClientRect(),b=i.closest('button').getBoundingClientRect(),c=getComputedStyle(i);return {src:i.getAttribute('src'),naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,loaded:i.complete&&i.naturalWidth>0,width:r.width,height:r.height,objectFit:c.objectFit,filter:c.filter,inViewport:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,withinCard:r.left>=b.left&&r.right<=b.right&&r.top>=b.top&&r.bottom<=b.bottom,cardWidth:b.width,cardHeight:b.height};})}));}


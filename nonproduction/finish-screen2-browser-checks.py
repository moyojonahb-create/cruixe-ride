from pathlib import Path
ui=Path('nonproduction/approved-ride-ui')
p=ui/'src/components/ride/rideSelection.css';s=p.read_text(encoding='utf-8-sig');s=s.replace('  .ride-selection-nav-space { height: calc(90px + env(safe-area-inset-bottom)); }\n','');p.write_text(s,encoding='utf-8')
p=ui/'verify-screen2.mjs';s=p.read_text(encoding='utf-8-sig')
s=s.replace("await page.getByRole('button',{name:`Choose ${name}`,exact:true}).click();", "const choice = page.getByRole('button',{name:`Choose ${name}`,exact:true});\n  if (id === 'economy') { await choice.focus(); await page.keyboard.press('Enter'); } else await choice.click();",1)
s=s.replace(" for(const name of ['Account','Activity','Wallet']){", """ await page.setViewportSize({width:320,height:640});
 await page.getByRole('button',{name:'Choose Parcel',exact:true}).click();
 await page.getByRole('textbox',{name:'Destination',exact:true}).waitFor();
 result.smallParcelReachable = true;
 await page.goBack(); await ready();
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Home',exact:true}).focus();
 await page.keyboard.press('Tab');
 result.keyboardFocus = await page.evaluate(() => ({ label: document.activeElement.getAttribute('aria-label'), outline: getComputedStyle(document.activeElement).outlineWidth }));
 for(const name of ['Account','Activity','Wallet']){""",1)
s=s.replace("  result.protectedRoutes.push({name,url:page.url(),authenticationRequired:new URL(page.url()).pathname==='/auth'});", "  await page.waitForTimeout(500);\n  result.protectedRoutes.push({name,url:page.url(),authenticationRequired:new URL(page.url()).pathname==='/auth'});",1)
s=s.replace(" await page.waitForTimeout(500);await page.screenshot({path:path.join(out,'final-screen2.png')});", " try { await page.waitForLoadState('networkidle', { timeout:30000 }); } catch {}\n await page.waitForTimeout(2000);await page.screenshot({path:path.join(out,'final-screen2.png')});",1)
s=s.replace(" const scroller=document.querySelector('.ride-selection-cards-scroll');", " const scroller=document.querySelector('.ride-selection-cards-scroll');\n const ir=nav.querySelector('[data-selected=\"true\"] .rider-navigation__icon').getBoundingClientRect();",1)
s=s.replace("navInViewport:nr.left>=0", "activeCircleClearance:ir.top-scroller.getBoundingClientRect().bottom,activeCircleUnclipped:ir.top>=0&&ir.left>=0&&ir.right<=innerWidth,navInViewport:nr.left>=0",1)
p.write_text(s,encoding='utf-8')

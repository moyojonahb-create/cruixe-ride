from pathlib import Path
p=Path('nonproduction/approved-ride-ui/verify-browser.mjs')
s=p.read_text(encoding='utf-8-sig').replace("http://127.0.0.1:8081/ride","http://127.0.0.1:8082/ride").replace("waitUntil: 'domcontentloaded'","waitUntil: 'commit'")
s=s.replace("await page.waitForSelector('.ride-start', { timeout: 180000 });", "await page.waitForSelector('.ride-start', { timeout: 180000 });")
p.write_text(s,encoding='utf-8')

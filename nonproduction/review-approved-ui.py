from pathlib import Path
import json,hashlib
ui=Path('nonproduction/approved-ride-ui')
s=(ui/'verify-browser.mjs').read_text(encoding='utf-8-sig')
s=s.replace("'ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'", "'../../../../Program Files (x86)/Microsoft/Edge/Application/msedge.exe'")
s=s.replace("path.join(process.env.LOCALAPPDATA, '../../../../Program Files (x86)/Microsoft/Edge/Application/msedge.exe')", "'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'")
s=s.replace("http://127.0.0.1:8082/ride", "http://localhost:8081/ride")
s=s.replace("const out = path.resolve('qa');", "const out = path.resolve('qa-edge');")
s=s.replace("const page = await context.newPage();", "const page = await context.newPage();\npage.setDefaultTimeout(30000);\npage.setDefaultNavigationTimeout(60000);")
(ui/'verify-edge.mjs').write_text(s,encoding='utf-8')
manifest=json.loads((ui/'integration-manifest.json').read_text())
rows=[]
for name,expected in manifest.items():
 p=Path(name); q=ui/name
 b=p.read_bytes() if p.exists() else b''; c=q.read_bytes()
 rows.append({'path':name,'main_matches_baseline':hashlib.sha256(b).hexdigest()==expected if expected else not p.exists(),'different_ui_content':b!=c,'main_crlf':b.count(b'\r\n'),'main_lf':b.count(b'\n'),'ui_crlf':c.count(b'\r\n'),'ui_lf':c.count(b'\n')})
print(json.dumps(rows,indent=2))
patch=(ui/'approved-ride-ui.patch').read_bytes()
print('Patch CRLF:',patch.count(b'\r\n'),'LF:',patch.count(b'\n'))

"""Prepare a new, reviewed CI payload; never stage, commit, push, or read .env files."""
import gzip,hashlib,io,json,os,re,subprocess,tarfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
IMAGE='node:22.23.4-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da'
sha=lambda data:hashlib.sha256(data).hexdigest()
manifest=json.loads((ROOT/'qa-resume/source-manifest.json').read_text())
for changed in manifest['changes']:
 if sha((ROOT/changed['path']).read_bytes())!=changed['afterSHA256']:raise SystemExit('Approved source changed since evidence: '+changed['path'])
files={}
def add(path,name=None):
 if path.is_symlink() or not path.is_file():raise SystemExit('Not a regular source file: '+str(path))
 rel=path.relative_to(ROOT).as_posix()
 if any(p.startswith('.env') or p in ('node_modules','.git','.npmrc') for p in Path(rel).parts):raise SystemExit('Forbidden input path')
 data=path.read_bytes()
 if len(data)>32*1024*1024:raise SystemExit('Input exceeds size guard: '+rel)
 # Detect private credential formats without printing any matched value.
 for pattern in (rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',rb'sb_secret_[A-Za-z0-9_\-]{12,}',rb'sk_live_[A-Za-z0-9]{16,}',rb'gh[pousr]_[A-Za-z0-9]{30,}',rb'github_pat_[A-Za-z0-9_]{30,}',rb'AKIA[0-9A-Z]{16}'):
  if re.search(pattern,data):raise SystemExit('Private credential pattern found; review input file: '+rel)
 files[name or rel]=data
for directory in ('src','public','packages'):
 for current,dirs,names in os.walk(ROOT/directory,followlinks=False):
  dirs.sort();names.sort()
  for d in dirs:
   if (Path(current)/d).is_symlink():raise SystemExit('Input directory junction/symlink is not allowed')
  dirs[:]=[d for d in dirs if d not in ('node_modules','.git') and not d.startswith('.env')]
  for name in names:
   if name.startswith('.env') or name=='.npmrc':raise SystemExit('Forbidden file under source roots')
   add(Path(current)/name)
for name in ['package.json','package-lock.json','index.html','vite.config.ts','vite.stabilization-build.config.ts','vitest.config.ts','vitest.stabilization.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json','tailwind.config.ts','postcss.config.js','eslint.config.js','qa-ci/run-remote.mjs','qa-ci/vite.ci-build.config.ts','qa-stabilization/network-guard.ts','qa-stabilization/fixture-services.ts','qa-stabilization/fixture-map.tsx','qa-stabilization/fixture-pricing.ts']:
 add(ROOT/name)
for p in sorted((ROOT/'qa-resume/final-edge').glob('*.png')):add(p,'qa-ci/historical-edge-baseline/'+p.name)
for name in ['overlays-edge-results.json','note-contrast-final.json','FRONTEND-RESUME-REPORT.md']:
 add(ROOT/'qa-resume'/name,'qa-ci/historical-edge-baseline/'+name)
lock=json.loads(files['package-lock.json'])
for info in lock['packages'].values():
 resolved=info.get('resolved','')
 if resolved and not resolved.startswith('https://registry.npmjs.org/'):raise SystemExit('Unapproved dependency resolution host')
 if resolved and not info.get('integrity'):raise SystemExit('Dependency lacks locked integrity')
if sum(map(len,files.values()))>256*1024*1024:raise SystemExit('Snapshot total size exceeds guard')
review=ROOT/'qa-ci/review';review.mkdir(exist_ok=False)
archive=review/'approved-frontend-ci.tgz'
with archive.open('wb') as raw,gzip.GzipFile(fileobj=raw,mode='wb',mtime=0,filename='') as compressed,tarfile.open(fileobj=compressed,mode='w|') as tar:
 for name,data in sorted(files.items()):
  member=tarfile.TarInfo(name);member.size=len(data);member.mode=0o644;member.mtime=0;tar.addfile(member,io.BytesIO(data))
archive_sha=sha(archive.read_bytes());branch='verify/cruixe-approved-ui-20261101-'+archive_sha[:8]
result={'archiveSHA256':archive_sha,'nodeImage':IMAGE,'packageLockSHA256':sha(files['package-lock.json']),'sourceWorkspaceHEAD':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'proposedBase':'1e6df6b60ce90c0b8c7779c392ad8ab4cc5d01a8','proposedBranch':branch,'approvedChanges':manifest['changes'],'expectedTests':61,'historicalScreenshotsOnly':True,'files':[{'path':name,'sha256':sha(data),'bytes':len(data)} for name,data in sorted(files.items())]}
(review/'review-manifest.json').write_text(json.dumps(result,indent=2))
print(json.dumps({'status':'PASS','files':len(files),'archiveBytes':archive.stat().st_size,'archiveSHA256':archive_sha,'branch':branch,'privateCredentials':'No recognized private credential formats; all .env/.npmrc/Git/dependency/cache paths excluded'},indent=2))

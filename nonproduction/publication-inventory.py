from pathlib import Path
import os,subprocess,json,hashlib,collections
root=Path.cwd();out=root/'nonproduction/publication-review-20261101';assert not out.exists();out.mkdir()
def git(*a,data=None):return subprocess.run(['git',*a],input=data,env={**os.environ,'GIT_OPTIONAL_LOCKS':'0'},capture_output=True,check=True).stdout
tracked=set(git('ls-files','-z').decode().split('\0'));changed=[p for p in git('diff','HEAD','--name-only','-z').decode().split('\0') if p]
roots=[p for p in git('ls-files','--others','--exclude-standard','--directory','-z').decode().split('\0') if p]
files=set(changed);excluded=[];errors=[]
skipnames={'.git','dist','build','coverage','.cache','.vite','vite-fixture-cache','.next','.venv','venv','__pycache__','.playwright-cli','test-results','playwright-report'}
for start in roots:
 base=root/start
 if base.is_file():files.add(start);continue
 for current,dirs,names in os.walk(base,topdown=True,onerror=lambda e:errors.append({'path':e.filename,'error':str(e)}),followlinks=False):
  here=Path(current);rel=here.relative_to(root).as_posix()
  if here==out:dirs[:]=[];continue
  if '.git' in dirs or '.git' in names:
   excluded.append({'path':rel,'reason':'separate Git checkout'});dirs[:]=[];continue
  keep=[]
  for d in dirs:
   child=here/d
   if d in skipnames or d.startswith('node_modules') or child.is_symlink():excluded.append({'path':child.relative_to(root).as_posix(),'reason':'dependency/cache/build or directory link'})
   else:keep.append(d)
  dirs[:]=keep
  for name in names:
   p=here/name;relative=p.relative_to(root).as_posix()
   if p.is_symlink():excluded.append({'path':relative,'reason':'file link; needs deliberate review'});continue
   files.add(relative)
# Apply existing Git ignore rules, without changing them.
paths=sorted(files);ignored=set(git('check-ignore','--no-index','--stdin','-z',data=b'\0'.join(p.encode() for p in paths)+b'\0').decode().split('\0')) if paths else set()
items=[]
for p in paths:
 f=root/p
 if p not in tracked and p in ignored:excluded.append({'path':p,'reason':'existing Git ignore rule'});continue
 if not f.exists():items.append({'path':p,'status':'DELETED','bytes':0});continue
 try:
  size=f.stat().st_size;items.append({'path':p,'status':'MODIFIED' if p in tracked else 'ADDED','bytes':size})
 except OSError as e:errors.append({'path':p,'error':str(e)})
status=git('status','--short','--untracked-files=normal');(out/'status-before.txt').write_bytes(status)
state={'HEAD':git('rev-parse','HEAD').decode().strip(),'branch':git('branch','--show-current').decode().strip(),'indexSHA256':hashlib.sha256((root/'.git/index').read_bytes()).hexdigest(),'worktrees':git('worktree','list','--porcelain').decode(),'remote':git('remote','get-url','origin').decode().strip(),'trackedChanges':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() if (root/p).is_file() else None for p in changed}}
(out/'preservation-before.json').write_text(json.dumps(state,indent=2));(out/'inventory.json').write_text(json.dumps({'files':items,'excluded':excluded,'errors':errors},indent=2));groups=collections.Counter(p['path'].split('/')[0] for p in items)
print(json.dumps({'files':len(items),'MiB':round(sum(p['bytes'] for p in items)/1048576,2),'groups':dict(groups),'largeFiles':[p for p in items if p['bytes']>25*1048576],'excludedDirectories':excluded[:30],'errors':errors[:10]},indent=2))

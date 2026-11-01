from pathlib import Path
import os,json,hashlib,subprocess,re,sys
root=Path.cwd();out=root/'nonproduction/publication-review-20261101';r=json.loads((out/'commit-result.json').read_text());before=json.loads((out/'preservation-before.json').read_text());files=json.loads((out/'committed-inventory.json').read_text())
assert r['status']=='PASS' and r['branch']=='review/cruixe-all-changes-20261101' and re.fullmatch('[0-9a-f]{40}',r['commit'])
repo=Path(r['repository']);assert repo.name.startswith('cruixe-all-changes-20261101-')
env={**os.environ,'GIT_OPTIONAL_LOCKS':'0','GIT_INDEX_FILE':r['index'],'GIT_TERMINAL_PROMPT':'0','GCM_INTERACTIVE':'Never'}
prefix=['git','--git-dir='+str(repo)]
def git(*args):return subprocess.run(prefix+list(args),cwd=root,env=env,capture_output=True,check=True).stdout
assert git('remote','get-url','origin').decode().strip()==r['remote']=='https://github.com/moyojonahb-create/PickMe-App.git'
assert git('rev-parse','refs/heads/'+r['branch']).decode().strip()==r['commit']
assert git('rev-parse',r['commit']+'^{tree}').decode().strip()==r['tree']
assert set(git('diff-tree','--no-commit-id','--name-only','--no-renames','-z','-r',r['commit']).decode().strip('\0').split('\0'))=={f['path'] for f in files}
assert hashlib.sha256((root/'.git/index').read_bytes()).hexdigest()==before['indexSHA256']
for f in files:
 p=root/f['path']
 assert not p.exists() if f['status']=='DELETED' else hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256'],f['path']
ref='refs/heads/'+r['branch'];remote=git('ls-remote','--heads','origin',ref).decode().strip();assert not remote or remote.split()[0]==r['commit'],'Remote branch already contains different work'
print('Publishing reviewed commit '+r['commit']+' to '+r['branch'],flush=True)
args=['git','-c','pack.threads=1','-c','pack.windowMemory=16m','-c','pack.deltaCacheSize=8m','-c','pack.window=10','--git-dir='+str(repo),'push','--porcelain','origin',ref+':'+ref]
push=subprocess.run(args,cwd=root,env=env,capture_output=True)
(out/'push.log').write_bytes(push.stdout+push.stderr)
if push.returncode:
 (out/'publication-result.json').write_text(json.dumps({**r,'status':'BLOCKED','push':'FAIL','exitCode':push.returncode,'reason':'Git push rejected or failed; inspect push.log'},indent=2))
 print((push.stdout+push.stderr).decode(errors='replace')[-2500:]);sys.exit(push.returncode)
verified=git('ls-remote','--heads','origin',ref).decode().split()[0];assert verified==r['commit']
assert hashlib.sha256((root/'.git/index').read_bytes()).hexdigest()==before['indexSHA256']
result={**r,'status':'PASS','push':'PASS','remoteCommit':verified,'branchURL':'https://github.com/moyojonahb-create/PickMe-App/tree/'+r['branch'],'commitURL':'https://github.com/moyojonahb-create/PickMe-App/commit/'+r['commit'],'merge':'NOT RUN','deploy':'NOT RUN','tests':'NOT RUN; existing verification evidence retained; no heavy local attempts','originalIndex':'byte-identical'}
(out/'publication-result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))

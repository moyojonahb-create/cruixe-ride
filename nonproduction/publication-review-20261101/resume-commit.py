from pathlib import Path
import os,json,hashlib,subprocess,tempfile,re
root=Path.cwd();out=root/'nonproduction/publication-review-20261101';scan=json.loads((out/'secret-scan.json').read_text());assert scan['status']=='PASS' and not scan['findings'],'Secret review must PASS'
inv=json.loads((out/'reviewed-inventory.json').read_text());before=json.loads((out/'preservation-before.json').read_text());files=inv['files'];sha=lambda b:hashlib.sha256(b).hexdigest();orig_env={**os.environ,'GIT_OPTIONAL_LOCKS':'0'};orig_env.pop('GIT_INDEX_FILE',None)
def original(*a):return subprocess.run(['git',*a],cwd=root,env=orig_env,capture_output=True,check=True).stdout
def preserve():
 assert sha((root/'.git/index').read_bytes())==before['indexSHA256']
 assert original('rev-parse','HEAD').decode().strip()==before['HEAD']
 assert original('branch','--show-current').decode().strip()==before['branch']
 assert original('worktree','list','--porcelain').decode()==before['worktrees']
 for p,h in before['trackedChanges'].items():assert (sha((root/p).read_bytes()) if (root/p).is_file() else None)==h,p
 for f in files:
  p=root/f['path']
  assert not p.exists() if f['status']=='DELETED' else sha(p.read_bytes())==f['sha256'],f['path']
preserve();assert before['remote']=='https://github.com/moyojonahb-create/PickMe-App.git'
ci=json.loads((root/'nonproduction/approved-ride-ui/qa-ci/commit-recovery-result.json').read_text())
for f in ci['committedBlobs']:assert sha((root/f['path']).read_bytes())==f['approvedSHA256']
name=original('config','--local','--get','user.name').decode().strip();email=original('config','--local','--get','user.email').decode().strip();assert name and re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email)
branch='review/cruixe-all-changes-20261101';repo=Path(json.loads((out/'staging-diagnosis.json').read_text())['repository'])
assert repo.name.startswith('cruixe-all-changes-20261101-')
env={**orig_env,'GIT_INDEX_FILE':str(repo/'reviewed.index'),'GIT_TERMINAL_PROMPT':'0','GCM_INTERACTIVE':'Never'}
for who in ['AUTHOR','COMMITTER']:env['GIT_'+who+'_NAME']=name;env['GIT_'+who+'_EMAIL']=email
prefix=['git','--git-dir='+str(repo)]
def git(*a,data=None):return subprocess.run(prefix+list(a),cwd=root,env=env,input=data,capture_output=True,check=True).stdout
assert git('remote','get-url','origin').decode().strip()==before['remote']
staged={}
for row in git('ls-files','--stage','-z').split(b'\0'):
 if row:
  meta,path=row.split(b'\t',1);mode,oid,stage=meta.decode().split();assert stage=='0';staged[path.decode()]=(mode,oid)
existing=[f for f in files if f['status']!='DELETED']
for f in files:
 if f['status']=='DELETED':assert f['path'] not in staged
 else:f['mode'],f['blob']=staged[f['path']]
assert set(git('diff','--cached','--no-renames','--name-only','-z',before['HEAD']).decode().strip('\0').split('\0'))=={f['path'] for f in files}
# Stream actual staged Git blobs with bounded memory, including duplicate-content files.
cat=subprocess.Popen(prefix+['cat-file','--batch'],cwd=root,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE);digests={}
for f in existing:
 oid=f['blob']
 if oid not in digests:
  cat.stdin.write((oid+'\n').encode());cat.stdin.flush();header=cat.stdout.readline().decode().split();assert header[0]==oid and header[1]=='blob';remaining=int(header[2]);digest=hashlib.sha256()
  while remaining:
   chunk=cat.stdout.read(min(65536,remaining));assert chunk;digest.update(chunk);remaining-=len(chunk)
  assert cat.stdout.read(1)==b'\n';digests[oid]=digest.hexdigest()
 assert digests[oid]==f['sha256'],f['path']
cat.stdin.close();assert cat.wait()==0
preserve();tree=git('write-tree').decode().strip();message=b'chore: snapshot CruiXe engineering workstreams for review\n\nInclude current frontend, backend, Android, tests, documentation, design references, installed project skills and isolated QA evidence.\n\nExclude dependency/build caches, private local configuration and the separate ECC checkout. Preserve the original working tree, index and branches. Current verification limitations remain documented; no deployment or authenticated production testing.\n'
commit=git('commit-tree',tree,'-p',before['HEAD'],data=message).decode().strip();git('update-ref','refs/heads/'+branch,commit,'0'*40)
assert git('rev-parse',commit+'^{tree}').decode().strip()==tree
assert set(git('diff-tree','--no-commit-id','--name-only','--no-renames','-z','-r',commit).decode().strip('\0').split('\0'))=={f['path'] for f in files}
assert not git('diff','--cached','--name-only',commit);preserve()
result={'status':'PASS','commit':commit,'tree':tree,'branch':branch,'repository':str(repo),'index':env['GIT_INDEX_FILE'],'remote':before['remote'],'parent':before['HEAD'],'fileCount':len(files),'bytes':sum(f['bytes'] for f in files),'stagedBlobSHA256':'PASS; every actual staged blob matched reviewed working bytes','secretReview':'PASS','originalWorkingTreeAndIndex':'PASS; unchanged','originalBranch':before['branch'],'originalHEAD':before['HEAD'],'approvedSnapshot':'unchanged exact SHA-256 values','identity':'existing repository-local identity; process-only use','excluded':'see reviewed-inventory.json','push':'NOT RUN','merge':'NOT RUN','deploy':'NOT RUN','objectStoreDependency':(root/'.git/objects').as_posix()}
(out/'commit-result.json').write_text(json.dumps(result,indent=2));(out/'committed-inventory.json').write_text(json.dumps(files,indent=2));print(json.dumps(result,indent=2))

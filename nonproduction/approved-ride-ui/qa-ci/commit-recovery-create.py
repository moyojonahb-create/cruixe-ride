import pathlib,subprocess,json,hashlib,os,tempfile,datetime,re
root=pathlib.Path.cwd();q=root/'nonproduction/approved-ride-ui/qa-ci';plan=json.loads((q/'publication-plan.json').read_text());previous=json.loads((q/'authorization-publication.json').read_text());source=pathlib.Path(previous['clone']);allowed=sorted(f['path'] for f in plan['files'])
baseenv={k:v for k,v in os.environ.items() if k not in ['GIT_DIR','GIT_WORK_TREE','GIT_INDEX_FILE'] and not k.startswith(('GIT_AUTHOR_','GIT_COMMITTER_'))};baseenv['GIT_OPTIONAL_LOCKS']='0'
def git(repo,*args,data=None,extra=None):
 p=subprocess.run(['git','-C',str(repo),*args],input=data,capture_output=True,env={**baseenv,**(extra or {})})
 if p.returncode:raise RuntimeError('Git failed ('+args[0]+'): '+p.stderr.decode(errors='replace'))
 return p.stdout
def sha(b):return hashlib.sha256(b).hexdigest()
def indexfile(repo):
 p=pathlib.Path(git(repo,'rev-parse','--git-path','index').decode().strip());return p if p.is_absolute() else repo/p
assert git(source,'config','--get','remote.origin.url').decode().strip()==plan['repository']
assert git(source,'symbolic-ref','HEAD').decode().strip()=='refs/heads/'+plan['branch']
assert git(source,'rev-parse','HEAD').decode().strip()==plan['base']
assert sorted(git(source,'diff','--cached','--name-only').decode().splitlines())==allowed
assert not git(source,'diff','--name-only').strip(), 'Unexpected unstaged changes in prior clone'
source_index=indexfile(source);source_index_hash=sha(source_index.read_bytes());source_status=git(source,'status','--porcelain=v1','-z')
identity={key:git(root,'config','--local','--get','user.'+key).decode().strip() for key in ['name','email']}
assert identity['name'] and not re.search(r'[\r\n<>]',identity['name'])
assert re.fullmatch(r'[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+',identity['email'])
assert identity['email'].lower() not in ['you@example.com','user@example.com','test@example.com']
assert identity['name'].lower() not in ['your name','unknown','test user']
identityenv={'GIT_AUTHOR_NAME':identity['name'],'GIT_AUTHOR_EMAIL':identity['email'],'GIT_COMMITTER_NAME':identity['name'],'GIT_COMMITTER_EMAIL':identity['email']}
payload={}
for f in plan['files']:
 b=(root/f['path']).read_bytes();assert sha(b)==f['sha256'], 'Original checksum mismatch: '+f['path'];payload[f['path']]=b
# A new bare repository has no worktree and cannot include the original dirty checkout.
isolated=pathlib.Path(tempfile.mkdtemp(prefix='cruixe-byte-exact-20261101-',dir=os.environ['TEMP']))
git(isolated,'init','--bare','--initial-branch='+plan['branch'],'.')
objects=pathlib.Path(git(source,'rev-parse','--path-format=absolute','--git-path','objects').decode().strip());assert objects.is_dir()
(isolated/'objects/info/alternates').write_text(objects.as_posix()+'\n',encoding='utf-8')
git(isolated,'remote','add','origin',plan['repository'])
assert git(isolated,'cat-file','-t',plan['base']).strip()==b'commit'
index=isolated/'approved-verification.index';assert not index.exists();ienv={'GIT_INDEX_FILE':str(index)}
git(isolated,'read-tree',plan['base'],extra=ienv)
attrs=git(source,'check-attr','text','eol','filter','working-tree-encoding','--',*allowed).decode()
checks=[]
for f in plan['files']:
 p=f['path'];assert not git(isolated,'ls-tree',plan['base'],'--',p).strip(), 'Approved path already exists at base'
 oid=git(isolated,'hash-object','-w','--no-filters','--stdin',data=payload[p]).decode().strip()
 git(isolated,'update-index','--add','--cacheinfo','100644,'+oid+','+p,extra=ienv)
 blob=git(isolated,'show',':'+p,extra=ienv);actual=sha(blob);assert actual==f['sha256'], 'Staged SHA256 mismatch: '+p
 checks.append({'path':p,'status':'PASS','approvedSHA256':f['sha256'],'stagedSHA256':actual,'gitBlobOID':oid,'bytes':len(blob)})
assert sorted(git(isolated,'diff','--cached',plan['base'],'--name-only',extra=ienv).decode().splitlines())==allowed
assert all(line.startswith('A\t') for line in git(isolated,'diff','--cached',plan['base'],'--name-status',extra=ienv).decode().splitlines())
assert git(isolated,'symbolic-ref','HEAD').decode().strip()=='refs/heads/'+plan['branch']
assert git(isolated,'remote','get-url','origin').decode().strip()==plan['repository']
tree=git(isolated,'write-tree',extra=ienv).decode().strip()
preflight={'status':'PASS','isolatedRepository':str(isolated),'isolatedIndex':str(index),'base':plan['base'],'branch':plan['branch'],'remote':plan['repository'],'stagedBlobs':checks,'attributesInPriorClone':attrs,'method':'hash-object --no-filters --stdin, explicit update-index --cacheinfo; no text conversion or checksum changes','identity':{'status':'PASS','source':'Original checkout repository-local user.name and user.email','identitySHA256':sha((identity['name']+'\n'+identity['email']).encode()),'globalSettingsModified':False},'tree':tree}
(q/'commit-recovery-precommit.json').write_text(json.dumps(preflight,indent=2)+'\n')
# Every gate above must pass before creating the one reviewed commit. No hooks or remote operations run.
commit=git(isolated,'commit-tree',tree,'-p',plan['base'],data=(plan['commitMessage']+'\n').encode(),extra={**ienv,**identityenv}).decode().strip()
git(isolated,'update-ref','refs/heads/'+plan['branch'],commit,'0'*40)
assert git(isolated,'rev-parse','HEAD').decode().strip()==commit
assert git(isolated,'rev-list','--parents','-n','1',commit).decode().split()==[commit,plan['base']]
assert sorted(git(isolated,'diff-tree','--no-commit-id','--name-only','-r',commit).decode().splitlines())==allowed
assert not git(isolated,'diff','--cached',commit,'--name-only',extra=ienv).strip()
assert git(isolated,'show','-s','--format=%an%x00%ae%x00%cn%x00%ce',commit).decode().strip().split('\x00')==[identity['name'],identity['email'],identity['name'],identity['email']]
for f in plan['files']:assert sha(git(isolated,'show',commit+':'+f['path']))==f['sha256']
assert sha(source_index.read_bytes())==source_index_hash
assert git(source,'status','--porcelain=v1','-z')==source_status
assert git(source,'rev-parse','HEAD').decode().strip()==plan['base']
assert sha(indexfile(root).read_bytes())==json.loads((q/'commit-recovery-preservation-before.json').read_text())['indexSHA256']
result={'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS','commit':commit,'tree':tree,'branch':plan['branch'],'base':plan['base'],'repository':str(isolated),'index':str(index),'configuredRemote':plan['repository'],'canonicalRemoteFromPriorRead':'moyojonahb-create/cruixe-ride','committedBlobs':checks,'exactThreeFileAllowlist':'PASS','unrelatedCommittedChanges':'NONE','authorIdentity':'PASS; reused original repository-local configuration exactly, for this process only','originalAndPreviousCloneIndexes':'PASS; byte-identical','previousCloneHEADAndWorktree':'PASS; unchanged','push':{'status':'NOT RUN','reason':'User requires reporting the local commit before any remote publication'},'workflowRun':{'status':'NOT RUN'},'runURL':None,'frontendIntegration':'NO-GO; current remote gates have not run','productionRelease':'NO-GO; staging and authenticated verification unavailable','objectStoreDependency':str(objects),'note':'New bare repository uses read-only alternate objects from the prior clone. Preserve both temporary repositories for a later authorized publication.'}
(q/'commit-recovery-result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))

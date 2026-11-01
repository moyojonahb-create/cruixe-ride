import pathlib,json,subprocess,hashlib,tempfile,os,re
root=pathlib.Path.cwd();out=root/'nonproduction/approved-ride-ui/qa-controlled-frontend'
def git(*a,cwd=root,env=None,data=None):
 return subprocess.run(['git',*a],cwd=cwd,env=env,input=data,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True).stdout
sha=lambda b:hashlib.sha256(b).hexdigest();before=json.loads((out/'preservation-before.json').read_text())
assert git('rev-parse','HEAD').decode().strip()==before['HEAD'];assert sha((root/'.git/index').read_bytes())==before['indexSHA256']
base=git('show',before['HEAD']+':index.html');working=(root/'index.html').read_bytes();old=b'maximum-scale=1.0, user-scalable=no, '
assert base.count(old)==1;payload=base.replace(old,b'');assert payload.replace(b'\r\n',b'\n')==working.replace(b'\r\n',b'\n')
name=git('config','--local','--get','user.name').decode().strip();email=git('config','--local','--get','user.email').decode().strip();assert name and re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email)
assert not re.search(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|(?:gh[pousr]_|github_pat_|AKIA)[A-Za-z0-9_]{15,}|eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.',payload)
# Public Supabase preconnect host is already present verbatim in HEAD; it is not a credential or database URI.
urls=re.findall(rb'https?://[^\s\"<>]+',payload);assert urls==re.findall(rb'https?://[^\s\"<>]+',base)
from urllib.parse import urlsplit,parse_qsl
assert all(urlsplit(u.decode()).username is None and urlsplit(u.decode()).password is None for u in urls)
assert all(k.lower() not in ['token','key','apikey','password','secret','access_token'] for u in urls for k,v in parse_qsl(urlsplit(u.decode()).query))
branch='fix/cruixe-accessible-viewport-20261101';repo=pathlib.Path(tempfile.mkdtemp(prefix='cruixe-viewport-review-20261101-'))
git('init','--bare','--initial-branch='+branch,str(repo));(repo/'objects/info/alternates').write_bytes((str(root/'.git/objects').replace('\\','/')+'\n').encode())
env=os.environ.copy();env['GIT_INDEX_FILE']=str(repo/'reviewed.index');env['GIT_OPTIONAL_LOCKS']='0';git('read-tree',before['HEAD'],cwd=repo,env=env)
blob=git('hash-object','-w','--no-filters','--stdin',cwd=repo,env=env,data=payload).decode().strip();git('update-index','--add','--cacheinfo','100644,'+blob+',index.html',cwd=repo,env=env)
staged=git('show',':index.html',cwd=repo,env=env);assert sha(staged)==sha(payload);assert git('diff','--cached','--name-only',before['HEAD'],cwd=repo,env=env).decode().splitlines()==['index.html']
patch=git('diff','--cached','--no-ext-diff',before['HEAD'],'--','index.html',cwd=repo,env=env);(out/'staged-review.diff').write_bytes(patch)
remote=git('remote','get-url','origin').decode().strip();assert remote=='https://github.com/moyojonahb-create/PickMe-App.git'
review={'status':'PASS','allowlist':['index.html'],'branch':branch,'base':before['HEAD'],'repository':str(repo),'index':env['GIT_INDEX_FILE'],'remote':remote,'workingSHA256':sha(working),'expectedBlobSHA256':sha(payload),'stagedBlobSHA256':sha(staged),'blob':blob,'author':'Existing repository-local identity verified; no global changes','scope':'Main viewport accessibility only; isolated application sources and QA assets excluded','publication':'NOT RUN','sensitiveContentScan':'PASS; no secret markers; public preconnect domains unchanged from HEAD; no authenticated connection strings','earlierScan':'Stopped before staging on broad supabase.co marker; manual review confirmed existing public preconnect URL, no credential'}
(out/'precommit-review.json').write_text(json.dumps(review,indent=2));print(json.dumps(review,indent=2));print(patch.decode())

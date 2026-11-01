import pathlib,json,subprocess,hashlib,os
root=pathlib.Path.cwd();out=root/'nonproduction/approved-ride-ui/qa-controlled-frontend';r=json.loads((out/'precommit-review.json').read_text());b=json.loads((out/'preservation-before.json').read_text());repo=pathlib.Path(r['repository']);env=os.environ.copy();env['GIT_INDEX_FILE']=r['index'];env['GIT_OPTIONAL_LOCKS']='0'
def git(*a,cwd=root,data=None,e=None):
 return subprocess.run(['git',*a],cwd=cwd,env=e or env,input=data,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True).stdout
sha=lambda x:hashlib.sha256(x).hexdigest()
assert sha((root/'.git/index').read_bytes())==b['indexSHA256'];assert git('rev-parse','HEAD').decode().strip()==b['HEAD']
assert git('diff','--cached','--name-only',r['base'],cwd=repo).decode().splitlines()==r['allowlist'];assert sha(git('show',':index.html',cwd=repo))==r['expectedBlobSHA256']
# Reuse only established local identity for this process, never global configuration.
name=git('config','--local','--get','user.name').decode().strip();email=git('config','--local','--get','user.email').decode().strip();assert name and email
for who in ['AUTHOR','COMMITTER']:
 env['GIT_'+who+'_NAME']=name;env['GIT_'+who+'_EMAIL']=email
# No hooks, no original index mutation, no remote operation.
tree=git('write-tree',cwd=repo).decode().strip();commit=git('commit-tree',tree,'-p',r['base'],cwd=repo,data=b'fix: allow browser zoom in the application viewport\n\nRemove the zoom ceiling and user-scalable restriction while retaining viewport-fit=cover.\n').decode().strip()
git('update-ref','refs/heads/'+r['branch'],commit,'0'*40,cwd=repo)
assert git('diff-tree','--no-commit-id','--name-only','-r',commit,cwd=repo).decode().splitlines()==r['allowlist'];assert sha(git('show',commit+':index.html',cwd=repo))==r['expectedBlobSHA256']
assert git('rev-parse',commit+'^',cwd=repo).decode().strip()==r['base'];assert git('diff','--cached','--name-only',commit,cwd=repo)==b''
assert sha((root/'.git/index').read_bytes())==b['indexSHA256'];assert git('rev-parse','HEAD').decode().strip()==b['HEAD']
result={**r,'commit':commit,'tree':tree,'committedBlobSHA256':sha(git('show',commit+':index.html',cwd=repo)),'commitScope':'Exactly index.html; one-line viewport accessibility correction','originalIndex':'PASS; byte-identical','originalBranch':'fix/ecc-sprint-1-accessibility-wallet','originalHEAD':b['HEAD'],'push':'NOT RUN','merge':'NOT RUN','deploy':'NOT RUN','objectStoreDependency':str(root/'.git/objects'),'note':'Dedicated local branch exists in separate bare repository; preserve it and the original repository.'}
(out/'local-commit-result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))

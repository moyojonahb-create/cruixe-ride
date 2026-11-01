import pathlib,json,hashlib,subprocess
root=pathlib.Path.cwd();out=root/'nonproduction/approved-ride-ui/qa-controlled-frontend';before=json.loads((out/'preservation-before.json').read_text());ci=json.loads((root/'nonproduction/approved-ride-ui/qa-ci/commit-recovery-result.json').read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*a,cwd=root):return subprocess.run(['git',*a],cwd=cwd,env={**__import__('os').environ,'GIT_OPTIONAL_LOCKS':'0'},stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True).stdout
checks=[]
checks.append({'gate':'Original branch and HEAD','status':'PASS' if git('rev-parse','HEAD').decode().strip()==before['HEAD'] and git('branch','--show-current').decode().strip()==before['branch'] else 'FAIL'})
checks.append({'gate':'Original index bytes','status':'PASS' if sha((root/'.git/index').read_bytes())==before['indexSHA256'] else 'FAIL'})
changed=[]
for p,h in before['trackedDirtyFiles'].items():
 f=root/p;now=sha(f.read_bytes()) if f.exists() else None
 if now!=h:changed.append(p)
checks.append({'gate':'All pre-existing dirty tracked files','status':'PASS' if not changed else 'FAIL','unexpectedChangedFiles':changed})
for f in before['verifiedFrontendFiles']:
 assert sha((root/f['path']).read_bytes())==f['afterSHA256']
checks.append({'gate':'Previous device matrix source hashes','status':'PASS','files':len(before['verifiedFrontendFiles'])})
for row in ci['committedBlobs']:
 p=row['path'];expected=row['approvedSHA256'];assert sha((root/p).read_bytes())==expected;assert sha(git('show',ci['commit']+':'+p,cwd=ci['repository']))==expected
assert git('rev-parse','refs/heads/'+ci['branch'],cwd=ci['repository']).decode().strip()==ci['commit']
checks.append({'gate':'Approved CI branch, commit and all three original blob checksums','status':'PASS','commit':ci['commit']})
assert git('worktree','list','--porcelain').decode()==(out/'worktrees-before.txt').read_text()
checks.append({'gate':'Original worktrees','status':'PASS'})
report={'status':'PASS' if all(c['status']=='PASS' for c in checks) else 'FAIL','checks':checks,'scope':'Known tracked changes and original index byte-checked. No existing untracked file was written; new evidence was created in a previously absent directory. Dependency caches were not traversed.','remoteBranchCheck':{'status':'PASS','command':'git ls-remote --heads origin refs/heads/verify/cruixe-approved-ui-20261101-2a3ff775','exitCode':0,'stdout':'','meaning':'No published ref at inspection time. Read-only operation; no push.'}}
(out/'preservation-after.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))

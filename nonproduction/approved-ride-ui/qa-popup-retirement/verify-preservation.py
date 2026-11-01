from pathlib import Path
import json,hashlib,subprocess,os,difflib
root=Path.cwd();out=root/'nonproduction/approved-ride-ui/qa-popup-retirement';before=json.loads((out/'preservation-before.json').read_text());allow=list(before['sourceBefore'])+before['newFiles'];sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*args,cwd=root):return subprocess.run(['git',*args],cwd=cwd,env={**os.environ,'GIT_OPTIONAL_LOCKS':'0'},capture_output=True,check=True).stdout
assert sha((root/'.git/index').read_bytes())==before['indexSHA256'];assert git('rev-parse','HEAD').decode().strip()==before['HEAD'];assert git('branch','--show-current').decode().strip()==before['branch'];assert git('worktree','list','--porcelain').decode()==before['worktrees']
for p,h in before['dirtyTracked'].items():
 if p not in allow:assert (sha((root/p).read_bytes()) if (root/p).is_file() else None)==h,p
ci=json.loads((root/'nonproduction/approved-ride-ui/qa-ci/commit-recovery-result.json').read_text());viewport=json.loads((root/'nonproduction/approved-ride-ui/qa-controlled-frontend/local-commit-result.json').read_text())
assert json.loads((out/'approved-ci-preservation.json').read_text())['commit']==ci['commit']
assert (Path(viewport['repository'])/'refs/heads'/viewport['branch']).read_text().strip()==viewport['commit']
for r in ci['committedBlobs']:assert sha((root/r['path']).read_bytes())==r['approvedSHA256']
old=json.loads((root/'nonproduction/approved-ride-ui/qa-controlled-frontend/CHANGED-FILES.json').read_text())
for item in old['newEvidenceFiles']:
 if Path(item['path']).name in ['payment-iphone-x.png','payment-iphone-x-failure.png']:assert sha((root/item['path']).read_bytes())==item['sha256']
patch=[];items=[]
for i,(p,h) in enumerate(before['sourceBefore'].items()):
 a=(out/(str(i)+'-before.txt')).read_bytes();b=(root/p).read_bytes();assert sha(a)==h;items.append({'path':p,'beforeSHA256':h,'afterSHA256':sha(b),'status':'MODIFIED'});patch.extend(difflib.unified_diff(a.decode('utf-8-sig').splitlines(True),b.decode('utf-8-sig').splitlines(True),fromfile='before/'+p,tofile='after/'+p))
for p in before['newFiles']:
 b=(root/p).read_bytes();items.append({'path':p,'afterSHA256':sha(b),'status':'ADDED'});patch.extend(difflib.unified_diff([],b.decode('utf-8-sig').splitlines(True),fromfile='/dev/null',tofile='after/'+p))
(out/'source-review.diff').write_text(''.join(patch),encoding='utf-8');(out/'SOURCE-CHANGES.json').write_text(json.dumps({'status':'PASS','sourceFiles':items,'committed':False,'scopeReview':'No commit created; exact eleven-file source scope available for review'},indent=2))
result={'status':'PASS','originalIndex':'byte-identical','originalHEAD':before['HEAD'],'originalBranch':before['branch'],'worktrees':'unchanged','unrelatedDirtyTrackedFiles':'byte-identical','approvedCICommit':ci['commit'],'previousViewportCommit':viewport['commit'],'approvedCISnapshot':'all three original approved hashes unchanged','referenceScreenshots':'both preserved byte-identically','commit':'NOT RUN','push':'NOT RUN','merge':'NOT RUN','deploy':'NOT RUN','sourceAllowlist':allow}
(out/'preservation-after.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))

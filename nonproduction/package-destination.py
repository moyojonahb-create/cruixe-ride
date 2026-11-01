from pathlib import Path
import json,hashlib,difflib
r=Path.cwd();u=r/'nonproduction/approved-ride-ui'
changed=['src/components/BottomNavBar.tsx','src/components/riderNavigation.css','src/lib/riderNavigation.ts','src/components/ride/DestinationSearchScreen.tsx','src/components/ride/destinationScreen.css','src/components/ride/RideView.tsx','src/hooks/useAppBootstrap.tsx','src/hooks/useLandmarks.ts','src/hooks/useStreets.ts','src/lib/placeCache.ts','src/test/RiderNavigation.test.tsx','src/test/DestinationSearchScreen.test.tsx','src/test/DestinationSearchPipeline.test.tsx']
manifest=json.loads((u/'integration-manifest.json').read_text());base=json.loads((u/'source-baseline.json').read_text());conflicts=[];patch=[]
for n in changed:
 if n not in manifest:
  p=r/n;b=u/'search-fix-baseline'/n
  if not b.exists(): b=u/'destination-baseline'/n
  if b.exists():manifest[n]=hashlib.sha256(b.read_bytes()).hexdigest()
  elif n in base:manifest[n]=base[n]
  elif p.exists():conflicts.append(n+' requires manual review (no original baseline)');continue
  else:manifest[n]=None
for n,expected in manifest.items():
 p=r/n
 if (expected is None and p.exists()) or (expected is not None and (not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=expected)):
  conflicts.append(n+' changed since baseline');continue
 old=p.read_bytes().decode('utf-8') if p.exists() else '';new=(u/n).read_text(encoding='utf-8-sig');new=new.rstrip()+'\n'
 if '\r\n' in old:new=new.replace('\n','\r\n')
 patch.extend(difflib.unified_diff(old.splitlines(keepends=True),new.splitlines(keepends=True),fromfile='a/'+n if old else '/dev/null',tofile='b/'+n))
(u/'destination-integration-manifest.json').write_text(json.dumps(manifest,indent=2))
(u/'approved-destination-ui.patch').write_bytes(''.join(patch).encode('utf-8'))
(u/'destination-integration-review.json').write_text(json.dumps({'changed':changed,'conflicts':conflicts,'complete_patch':not conflicts},indent=2))
print(json.dumps({'changed':changed,'conflicts':conflicts},indent=2))

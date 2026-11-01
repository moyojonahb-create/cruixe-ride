from pathlib import Path
import hashlib,json,difflib
repo=Path.cwd(); ui=repo/'nonproduction/approved-ride-ui'
manifest=json.loads((ui/'integration-manifest.json').read_text())
baseline=json.loads((ui/'source-baseline.json').read_text())
changed=['src/App.tsx','src/components/BottomNavBar.tsx','src/components/RiderNavigationProvider.tsx','src/components/riderNavigation.css','src/lib/riderNavigation.ts','src/components/ride/RideView.tsx','src/components/ride/RideTierSelector.tsx','src/components/ride/RideSelectionCards.tsx','src/components/ride/rideSelection.css','src/components/ride/approvedRide.css','src/test/RideSelectionCards.test.tsx','src/test/RiderNavigation.test.tsx','src/test/RideSelectionDraft.test.tsx']
for name in changed:
 manifest[name]=baseline.get(name)
(ui/'integration-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
patch=[]; conflicts=[]
for name,expected in manifest.items():
 p=repo/name
 if expected is None:
  if p.exists():conflicts.append(name+' (new destination already exists)')
 elif not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=expected:conflicts.append(name+' (changed since baseline)')
 original=p.read_bytes().decode('utf-8') if p.exists() else ''
 updated=(ui/name).read_bytes().decode('utf-8-sig').replace('\r\n','\n')
 if '\r\n' in original:updated=updated.replace('\n','\r\n')
 patch.extend(difflib.unified_diff(original.splitlines(keepends=True),updated.splitlines(keepends=True),fromfile='a/'+name if original else '/dev/null',tofile='b/'+name))
(ui/'approved-screen2-ui.patch').write_bytes(''.join(patch).encode('utf-8'))
(ui/'screen2-changed-files.json').write_text(json.dumps(changed,indent=2))
(ui/'screen2-integration-review.json').write_text(json.dumps({'source_paths':len(manifest),'screen2_paths':len(changed),'conflicts':conflicts},indent=2))
print(json.dumps({'accumulated_source_paths':len(manifest),'screen2_source_paths':len(changed),'conflicts':conflicts},indent=2))

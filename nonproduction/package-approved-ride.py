from pathlib import Path
import hashlib,json,difflib
root=Path.cwd(); ui=root/'nonproduction/approved-ride-ui'
files=['src/components/ride/RideView.tsx','src/components/ride/RideGlassPanel.tsx','src/components/ride/RideHomeGreeting.tsx','src/components/ride/QuickShortcutsRow.tsx','src/components/ride/TownSelectorSheet.tsx','src/components/MapboxMap.tsx','src/components/ride/approvedRide.css']
base=json.loads((ui/'source-baseline.json').read_text())
manifest={f:base.get(f) for f in files}
(ui/'integration-manifest.json').write_text(json.dumps(manifest,indent=2))
patch=[]
for f in files:
 a=(root/f).read_text(encoding='utf-8').splitlines(True) if (root/f).exists() else []
 b=(ui/f).read_text(encoding='utf-8-sig').splitlines(True)
 patch.extend(difflib.unified_diff(a,b,fromfile='a/'+f if a else '/dev/null',tofile='b/'+f))
(ui/'approved-ride-ui.patch').write_text(''.join(patch),encoding='utf-8')
print('Prepared frontend-only patch and guarded integration manifest')

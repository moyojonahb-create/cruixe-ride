from pathlib import Path
import json,difflib,hashlib
repo=Path.cwd(); ui=repo/'nonproduction/approved-ride-ui'
manifest=json.loads((ui/'integration-manifest.json').read_text())
patch=[]
for name in manifest:
 p=repo/name; original=p.read_bytes().decode('utf-8') if p.exists() else ''
 updated=(ui/name).read_bytes().decode('utf-8-sig').replace('\r\n','\n')
 eol='\r\n' if '\r\n' in original else '\n'
 updated=updated.replace('\n',eol)
 patch.extend(difflib.unified_diff(original.splitlines(keepends=True),updated.splitlines(keepends=True),fromfile='a/'+name if original else '/dev/null',tofile='b/'+name))
(ui/'approved-ride-ui-with-vehicles.patch').write_bytes(''.join(patch).encode('utf-8'))
assets={f'public/brand/{name}':hashlib.sha256((ui/'public/brand'/name).read_bytes()).hexdigest() for name in ['cruize-search-car.webp','cruize-economy-car.webp','cruize-shared-car.webp','cruize-parcel-van.webp']}
(ui/'vehicle-asset-manifest.json').write_text(json.dumps(assets,indent=2),encoding='utf-8')
p=ui/'integrate-ui.py';s=p.read_text(encoding='utf-8-sig')
s=s.replace("if not args.apply:\n", "asset_manifest=ui/'vehicle-asset-manifest.json'\nif asset_manifest.exists():\n for name,expected in json.loads(asset_manifest.read_text()).items():\n  for target in [repo/name,ui/name]:\n   if not target.is_file() or hashlib.sha256(target.read_bytes()).hexdigest()!=expected:\n    raise SystemExit(f'REFUSED: verified vehicle asset missing or changed: {target}')\nif not args.apply:\n",1)
s=s.replace("print('Check passed for all seven UI files. Pause other edits to these paths before using --apply.')", "print(f'Check passed for all {len(manifest)} UI source paths and verified vehicle assets. Pause other edits to these paths before using --apply.')")
s=s.replace("print('Applied only seven reviewed UI files. No backend changes, commits, or deployment.')", "print(f'Applied only {len(manifest)} reviewed UI files. No backend changes, commits, or deployment.')")
p.write_text(s,encoding='utf-8')
print('Prepared separate consolidated review patch; original patch retained. Assets remain owned by the parent project.')

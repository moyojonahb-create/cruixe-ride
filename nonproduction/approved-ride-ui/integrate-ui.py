from pathlib import Path
import argparse, hashlib, json, shutil
parser=argparse.ArgumentParser(description='Check or apply only the reviewed ride UI files.')
parser.add_argument('--apply',action='store_true')
args=parser.parse_args()
ui=Path(__file__).resolve().parent
repo=ui.parent.parent
manifest=json.loads((ui/'integration-manifest.json').read_text())
for name,expected in manifest.items():
 target=repo/name
 if expected is None:
  if target.exists(): raise SystemExit(f'REFUSED: new target already exists: {name}')
 elif not target.is_file() or hashlib.sha256(target.read_bytes()).hexdigest()!=expected:
  raise SystemExit(f'REFUSED: source changed since snapshot: {name}. Reconcile manually.')
asset_manifest=ui/'vehicle-asset-manifest.json'
if asset_manifest.exists():
 for name,expected in json.loads(asset_manifest.read_text()).items():
  for target in [repo/name,ui/name]:
   if not target.is_file() or hashlib.sha256(target.read_bytes()).hexdigest()!=expected:
    raise SystemExit(f'REFUSED: verified vehicle asset missing or changed: {target}')
if not args.apply:
 print(f'Check passed for all {len(manifest)} UI source paths and verified vehicle assets. Pause other edits to these paths before using --apply.')
else:
 for name in manifest: shutil.copy2(ui/name,repo/name)
 print(f'Applied only {len(manifest)} reviewed UI files. No backend changes, commits, or deployment.')

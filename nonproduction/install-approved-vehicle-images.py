from pathlib import Path
import shutil,hashlib,json
repo=Path.cwd(); ui=repo/'nonproduction/approved-ride-ui'
assets=['cruize-search-car.webp','cruize-economy-car.webp','cruize-shared-car.webp','cruize-parcel-van.webp']
for name in assets:
 source=repo/'public/brand'/name; target=ui/'public/brand'/name
 if not source.is_file():raise SystemExit('Missing verified asset: '+name)
 if target.exists() and target.read_bytes()!=source.read_bytes():raise SystemExit('Isolated asset conflicts: '+name)
 if not target.exists():shutil.copy2(source,target)
 assert target.read_bytes()==source.read_bytes()

def edit(name,pairs):
 p=ui/name; data=p.read_bytes(); s=data.decode('utf-8')
 newline='\r\n' if b'\r\n' in data else '\n'
 s=s.replace('\r\n','\n')
 for old,new in pairs:
  if old not in s:raise SystemExit('Expected source missing in '+name+': '+old)
  s=s.replace(old,new,1)
 p.write_bytes(s.replace('\n',newline).encode('utf-8'))
edit('src/components/ride/RideHomeGreeting.tsx',[
("import pickMeCarIcon from '@/assets/cars/car-search-side.png';\n",''),
('src={pickMeCarIcon}','src="/brand/cruize-search-car.webp"')])
edit('src/components/ride/RideTierSelector.tsx',[
("import carFrontEconomy from '@/assets/cars/car-front-economy.png';\n",''),
("import carSlantShare from '@/assets/cars/car-slant-share.png';\n",''),
("import carParcel from '@/assets/cars/car-parcel.png';\n",''),
('economy: carFrontEconomy,',"economy: '/brand/cruize-economy-car.webp',"),
('share: carSlantShare,',"share: '/brand/cruize-shared-car.webp',"),
('parcel: carParcel,',"parcel: '/brand/cruize-parcel-van.webp',")])
manifest=json.loads((ui/'integration-manifest.json').read_text())
baseline=json.loads((ui/'source-baseline.json').read_text())
name='src/components/ride/RideTierSelector.tsx'
assert hashlib.sha256((repo/name).read_bytes()).hexdigest()==baseline[name], 'Parent tier selector changed; reconcile before integration'
manifest[name]=baseline[name]
(ui/'integration-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Updated two isolated components; copied four verified WebP assets. Parent source untouched.')
for name in assets:print('/brand/'+name,hashlib.sha256((ui/'public/brand'/name).read_bytes()).hexdigest())

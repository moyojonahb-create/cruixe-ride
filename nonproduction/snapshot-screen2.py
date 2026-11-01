from pathlib import Path
import hashlib,json,shutil
ui=Path('nonproduction/approved-ride-ui'); snap=ui/'screen2-baseline'; snap.mkdir(exist_ok=False)
files=['src/App.tsx','src/components/BottomNavBar.tsx','src/components/ride/RideView.tsx','src/components/ride/RideTierSelector.tsx','src/components/ride/approvedRide.css','src/components/ride/RideHomeGreeting.tsx','src/components/ride/DestinationSearchScreen.tsx']
for name in files:
 p=snap/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ui/name,p)
(snap/'manifest.json').write_text(json.dumps({n:hashlib.sha256((ui/n).read_bytes()).hexdigest() for n in files},indent=2))
print('Saved isolated Screen 1/3 and component baseline before Screen 2 changes')

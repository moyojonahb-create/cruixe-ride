from pathlib import Path
import hashlib,json
root=Path.cwd(); ui=root/'nonproduction/approved-ride-ui'
paths=['src/pages/Ride.tsx','src/App.tsx','src/hooks/useNearbyDrivers.ts','src/hooks/useRideRealtime.ts','src/hooks/useTownPricing.ts','src/lib/backendSocketClient.ts','src/lib/driverPresence.ts','src/lib/requestRide.ts','src/components/ride/DestinationSearchScreen.tsx','src/components/ride/ScheduleRide.tsx','src/components/ride/PaymentMethodSelector.tsx','src/hooks/useAuth.tsx']
rows=[]
for name in paths:
 a=root/name; b=ui/name
 rows.append({'path':name,'exists_in_both':a.is_file() and b.is_file(),'matches_current_main':a.read_bytes()==b.read_bytes() if a.is_file() and b.is_file() else None})
(ui/'integration-dependency-review.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps(rows,indent=2))

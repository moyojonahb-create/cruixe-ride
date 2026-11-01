from pathlib import Path
ui=Path('nonproduction/approved-ride-ui')
p=ui/'src/test/RiderNavigation.test.tsx';s=p.read_text(encoding='utf-8-sig').replace(', exact: true','');p.write_text(s,encoding='utf-8')
p=ui/'src/components/BottomNavBar.tsx';raw=p.read_bytes();s=raw.decode().replace(', type RiderTab','');p.write_bytes(s.encode())
p=ui/'src/components/ride/RideView.tsx';raw=p.read_bytes();s=raw.decode().replace('\r\n','\n')
s=s.replace("(Boolean(selectionDraft) && !dropoffLocation && view !== 'locations')", "(Boolean(selectionDraft) && view === null && !activeField)",1)
s=s.replace("{!tierPickerOpen && serviceType !== 'ride' &&", "{!tierPickerOpen && !(selectionDraft && showHomeContent) && serviceType !== 'ride' &&",1)
s=s.replace('{!tierPickerOpen && pickupLocation && dropoffLocation && rideTierOptions.length > 0 && (','{!tierPickerOpen && !showHomeContent && pickupLocation && dropoffLocation && rideTierOptions.length > 0 && (',1)
p.write_bytes(s.replace('\n','\r\n').encode())

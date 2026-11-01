from pathlib import Path
p=Path('nonproduction/approved-ride-ui/src/components/ride/RideView.tsx');raw=p.read_bytes();s=raw.decode().replace('\r\n','\n')
a="""  useEffect(() => {
    if (pickupLocation && !dropoffLocation && !activeField && rideStatus === 'idle') {
      setActiveField('dropoff');
    }
  }, [pickupLocation, dropoffLocation, activeField, rideStatus]);"""
b="""  useEffect(() => {
    // A retained pickup is also valid on the chooser and ride home. Only the
    // actual place-entry flow should automatically reopen destination entry.
    if (view === 'choose' || (view === null && selectionDraft)) return;
    if (pickupLocation && !dropoffLocation && !activeField && rideStatus === 'idle') {
      setActiveField('dropoff');
    }
  }, [pickupLocation, dropoffLocation, activeField, rideStatus, view, selectionDraft]);"""
assert a in s;s=s.replace(a,b,1)
s=s.replace('{activeField && !mapPickMode && (','{!tierPickerOpen && activeField && !mapPickMode && (',1)
p.write_bytes(s.replace('\n','\r\n').encode())

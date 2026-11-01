from pathlib import Path
root=Path('nonproduction/approved-ride-ui/src')
p=root/'components/ride/RideView.tsx'
s=p.read_text(encoding='utf-8')
a='<MapboxMap pickup={pickupLocation}'
s=s.replace(a,'<MapboxMap currentLocation={gpsState.status === \'success\' ? gpsState.coords : null} pickup={pickupLocation}',1)
# Remove the obsolete blue wash over the light map.
s='\n'.join(line for line in s.split('\n') if "hsl(217 85% 29% / 0.12)" not in line)
p.write_text(s,encoding='utf-8')
p=root/'components/MapboxMap.tsx'
s=p.read_text(encoding='utf-8')
s=s.replace('interface MapboxMapProps {','interface MapboxMapProps {\n  /** Actual GPS fix only; never substitute the town center. */\n  currentLocation?: Coords | null;',1)
s=s.replace('  mapboxgl,\n  pickup,','  mapboxgl,\n  currentLocation,\n  pickup,',1)
s=s.replace('    if (pickup) addMarker(','''    if (currentLocation && !pickup && !isNullIslandCoord(currentLocation)) {
      const dot = markerElement('', '#f10808', '#fff', 20);
      dot.setAttribute('aria-label', 'Your location');
      dot.style.boxShadow = '0 0 0 18px rgba(241,8,8,.12), 0 2px 5px rgba(0,0,0,.2)';
      addMarker(currentLocation, dot);
    }
    if (pickup) addMarker(''',1)
s=s.replace('    loaded,\n    pickup?.lat,','    loaded,\n    currentLocation?.lat,\n    currentLocation?.lng,\n    pickup?.lat,',1)
p.write_text(s,encoding='utf-8')
print('Added GPS-only current location dot; no heading beam without heading data')

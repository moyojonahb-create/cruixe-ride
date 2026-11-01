from pathlib import Path
p=Path('nonproduction/approved-ride-ui/src/components/ride/RideView.tsx')
raw=p.read_bytes();s=raw.decode().replace('\r\n','\n')
def replace(old,new):
 global s
 if old not in s:raise ValueError(old[:150])
 s=s.replace(old,new,1)
replace("import { useNavigate, useLocation } from 'react-router-dom';", "import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';\nimport { useRiderNavigation } from '@/components/RiderNavigationProvider';")
replace("import './approvedRide.css';", "import './approvedRide.css';\nimport './rideSelection.css';")
replace('  const location = useLocation();', '''  const location = useLocation();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const { draft: selectionDraft, saveDraft } = useRiderNavigation();
  const requestedTier = searchParams.get('tier');
  const initialTier: RideTierId = requestedTier === 'economy' || requestedTier === 'share' || requestedTier === 'parcel'
    ? requestedTier : selectionDraft?.selectedTier ?? 'economy';''')
replace('useState<SelectedLocation | null>(null);','useState<SelectedLocation | null>(selectionDraft?.pickup ?? null);')
replace('useState<SelectedLocation | null>(null);','useState<SelectedLocation | null>(selectionDraft?.dropoff ?? null);')
replace("useState<ServiceType>('ride')", "useState<ServiceType>(initialTier === 'parcel' ? 'courier' : 'ride')")
replace("useState<VehicleTier>('economy')", 'useState<VehicleTier>(initialTier)')
replace('  const [tierPickerOpen, setTierPickerOpen] = useState(false);','')
replace('  const [passengerCount, setPassengerCount] = useState(1);','  const [passengerCount, setPassengerCount] = useState(selectionDraft?.passengerCount ?? 1);')
replace("  const [rideStatus, setRideStatus] = useState<RideStatus>('idle');", """  const [rideStatus, setRideStatus] = useState<RideStatus>('idle');
  const tierPickerOpen = view === 'choose' && rideStatus === 'idle';
  const setTierPickerOpen = (open: boolean) => {
    if (open) {
      if (view !== 'choose') navigate('/ride?view=choose');
    } else {
      setActiveField(null);
      navigate('/ride', { replace: true });
    }
  };""")
replace('useState<TownConfig>(DEFAULT_TOWN)', 'useState<TownConfig>(selectionDraft?.town ?? DEFAULT_TOWN)')
replace('useState<RideStop[]>([])', 'useState<RideStop[]>(selectionDraft?.stops ?? [])')
replace('useState<Date | null>(null)', 'useState<Date | null>(selectionDraft?.scheduledAt ?? null)')
replace("  const [activeStopId, setActiveStopId] = useState<string | null>(null);", """  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  useEffect(() => {
    if (view === 'choose') {
      setActiveField(null);
      setMapPickMode(false);
      setSearchQuery('');
    } else if (view === 'locations' && !dropoffLocation) {
      setActiveField('dropoff');
    }
  }, [view]);
  useEffect(() => {
    if (view !== 'choose' && view !== 'locations') return;
    saveDraft({ selectedTier, pickup: pickupLocation, dropoff: dropoffLocation,
      stops: rideStops, scheduledAt, passengerCount, town: selectedTown });
  }, [view, selectedTier, pickupLocation, dropoffLocation, rideStops, scheduledAt, passengerCount, selectedTown, saveDraft]);""")
replace("const showHomeContent = rideStatus === 'idle' && !pickupLocation && !dropoffLocation;", "const showHomeContent = rideStatus === 'idle' && ((!pickupLocation && !dropoffLocation) || (Boolean(selectionDraft) && !dropoffLocation && view !== 'locations'));")
replace('className="approved-ride relative h-[100dvh] w-full overflow-hidden bg-background"', 'className={cn("approved-ride relative h-[100dvh] w-full overflow-hidden bg-background", tierPickerOpen && "ride-selection-active")}')
replace('onClick={() => showHomeContent ? setMenuOpen(true) : navigate(-1)}', 'onClick={() => tierPickerOpen ? setTierPickerOpen(false) : showHomeContent ? setMenuOpen(true) : navigate(-1)}')
replace("aria-label={showHomeContent ? 'Menu' : 'Back'}", "aria-label={tierPickerOpen ? 'Back to ride home' : showHomeContent ? 'Menu' : 'Back'}")
replace('{showHomeContent ? <Menu', '{showHomeContent && !tierPickerOpen ? <Menu')
# Suppress extra map controls only for selection; retain the existing controls elsewhere.
s=s.replace('{!showHomeContent && (','{!showHomeContent && !tierPickerOpen && (')
replace('showHomeContent && !tierPickerOpen && "ride-booking-sheet--home")}', 'showHomeContent && !tierPickerOpen && "ride-booking-sheet--home", tierPickerOpen && "ride-booking-sheet--selection")}')
start=s.index('          {showHomeContent && tierPickerOpen && (')
end=s.index('          {/* Service type indicator */}',start)
s=s[:start]+'''          {tierPickerOpen && (
            <section className="ride-selection-content" aria-labelledby="ride-selection-title">
              <header className="ride-selection-header">
                <h1 id="ride-selection-title">Choose a ride</h1>
              </header>
              <div className="ride-selection-cards-scroll">
                <RideTierSelector
                  presentation="selection"
                  options={rideTierOptionsNoFare}
                  selected={selectedTier}
                  onSelect={(id) => {
                    handleSelectTier(id);
                    ensurePickup();
                    setActiveField('dropoff');
                    setSearchQuery('');
                    setSheetExpanded(true);
                    navigate(`/ride?view=locations&tier=${id}`);
                  }}
                  currencySymbol={fareBreakdown?.sym ?? '$'}
                />
              </div>
            </section>
          )}

'''+s[end:]
replace("{serviceType !== 'ride' &&", "{!tierPickerOpen && serviceType !== 'ride' &&")
replace('{pickupLocation && dropoffLocation && rideTierOptions.length > 0 && (','{!tierPickerOpen && pickupLocation && dropoffLocation && rideTierOptions.length > 0 && (')
replace('        {!tierPickerOpen && <div', '        {tierPickerOpen && <div className="ride-selection-nav-space" aria-hidden="true" />}\n        {!tierPickerOpen && <div')
replace('          onClose={() => {\n            setActiveField(null);', """          onClose={() => {
            if (view === 'locations') {
              setActiveField(null);
              setSearchQuery('');
              setNominatimResults([]);
              navigate('/ride?view=choose', { replace: true });
              return;
            }
            setActiveField(null);""")
p.write_bytes(s.replace('\n','\r\n').encode())
print('Connected URL stages and in-memory draft. Search UI and booking handlers retained.')

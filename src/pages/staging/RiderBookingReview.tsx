import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Crosshair, MapPin, Search } from 'lucide-react';
import RiderPreviewRideSheet from './RiderPreviewRideSheet';

const locations = [
  ['pickup', '844:90', 'Search pickup', 'Search Montrose, Bulawayo', 'Tap to choose destination', 'Pickup suggestions', 'Use Montrose pickup'],
  ['destination', '844:233', 'Search destination', 'Montrose · preview pickup', 'Search Tower Block', 'Destination results', 'Use Tower Block destination'],
  ['route-ready', '844:376', 'Route ready', 'Montrose · preview pickup', 'Tower Block · destination', 'Your route', 'Continue to ride types'],
  ['map-pin', '844:519', 'Choose on map', 'Pin placement · Montrose', 'Choose destination on map', 'Map picker', 'Use this map pin'],
] as const;
const fares = [
  ['adjust-fare', '1634:100', 'Adjust fare before requesting', 6, false],
  ['adjust-5', '1634:236', 'Adjust fare · $5', 5, false],
  ['no-drivers-5', '1634:237', 'No drivers found · $5', 5, false],
  ['adjust-7', '1634:368', 'Adjust fare · $7', 7, false],
  ['no-drivers-7', '1634:369', 'No drivers found · $7', 7, false],
  ['searching-5', '1721:93', 'Finding drivers · $5', 5, true],
  ['searching-7', '1721:228', 'Finding drivers · $7', 7, true],
] as const;

const box = 'rounded-[16px] border border-[#e1e5ed] bg-white';
const red = 'min-h-12 rounded-[15px] bg-[#ff000d] px-4 text-sm font-semibold text-white';
type Actions = { select: (id: string) => void; preview: () => void };

function LocationPreview({ frame, select, preview }: Actions & { frame: typeof locations[number] }) {
  const [id, node, title, pickup, destination, heading, button] = frame;
  const isMap = id === 'map-pin';
  const ready = id === 'route-ready';
  const suggestions = id === 'pickup' ? [['Montrose', 'Bulawayo · pickup'], ['Bulawayo CBD', 'City centre · pickup'], ['Burnside', 'Residential area · pickup']] :
    ready ? [['Pickup · Montrose', 'Location selected on the map'], ['Destination · Tower Block', 'Bulawayo CBD · destination'], ['Fare after selection', 'Choose Economy, Shared or Parcel next']] :
      [['Tower Block', 'Bulawayo CBD · destination'], ['Burnside', 'Bulawayo · destination'], ['Emakhandeni Shopping Centre', 'Emakhandeni · destination']];
  const next = () => ready ? preview() : select(id === 'destination' ? 'route-ready' : 'destination');
  return <main data-figma-node={node} className="mx-auto max-w-[400px] overflow-hidden bg-[#f2f3f5] font-['Poppins',system-ui,sans-serif] text-[#1f2129]">
    <header className="h-[184px] rounded-b-[28px] bg-[#ff000d] px-4 pt-8 text-white">
      <div className="flex items-center gap-3"><button type="button" aria-label="Back" onClick={() => select('pickup')} className="grid size-12 place-items-center rounded-full bg-white text-[#1f2129]"><ArrowLeft /></button><h1 className="text-2xl font-bold">{title}</h1></div>
      <p className="mt-3 text-xs font-medium">{ready ? 'Selected location' : 'Select a destination from the example locations'}</p>
    </header>
    <div className="relative -mt-[52px] space-y-3 px-4 pb-8">
      <dl className={box + ' divide-y px-4 shadow-md'}>
        {[['Pickup', pickup], ['Destination', destination]].map(([key, value], index) => <div key={key} className="relative min-h-[70px] py-3 pl-7">
          <span aria-hidden="true" className={`absolute left-0 top-6 size-3.5 rounded-full ${index === 0 ? 'bg-[#ffcc00]' : 'bg-[#ff000d]'}`} /><dt className="text-[10px] font-semibold uppercase text-[#626a76]">{key}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd>
        </div>)}
      </dl>
      <button type="button" className={box + ' flex min-h-14 w-full items-center gap-3 p-2 text-left'} onClick={() => select('route-ready')}><Crosshair className="m-1 size-8 rounded-full bg-[#fff0f1] p-1.5 text-[#ff000d]" /><span><strong className="block text-sm">Use current location</strong><small className="text-[11px] text-[#626a76]">{isMap ? 'Use the map pin to pick a place' : 'Preview location · Montrose, Bulawayo'}</small></span></button>
      <button type="button" className={box + ' flex min-h-14 w-full items-center gap-3 !bg-[#fff0f1] p-2 text-left'} onClick={() => select('map-pin')}><MapPin className="m-1 size-8 rounded-full bg-white p-1.5 text-[#ff000d]" /><span><strong className="block text-sm">Choose on map</strong><small className="text-[11px] text-[#626a76]">Place the pickup pin manually</small></span></button>
      <div className="flex items-center justify-between pt-3"><h2 className="font-bold uppercase">{heading}</h2>{!isMap && <button type="button" onClick={preview} className="min-h-8 text-xs font-semibold">See all</button>}</div>
      {isMap ? <div className="grid h-52 place-items-center rounded-xl bg-[#e8eef2] text-center" style={{ backgroundImage: 'linear-gradient(#d4dce3 1px,transparent 1px),linear-gradient(90deg,#d4dce3 1px,transparent 1px)', backgroundSize: '40px 40px' }}><div><MapPin className="mx-auto size-14 fill-[#ff000d] text-white" /><p className="text-sm font-semibold">Montrose · pickup</p></div></div> :
        <ul className="space-y-2">{suggestions.map(([place, info]) => <li key={place}><button type="button" onClick={next} className={box + ' flex min-h-16 w-full items-center gap-3 px-3 text-left'}><MapPin className="size-9 rounded-full bg-[#fff0f1] p-2 text-[#ff000d]" /><span><strong className="block text-sm">{place}</strong><small className="text-[11px] text-[#626a76]">{info}</small></span></button></li>)}</ul>}
      <p className="text-[11px] text-[#626a76]">Confirm your pickup before requesting a ride.</p>
      <button type="button" onClick={next} className={red + ' mt-3 w-full !rounded-full'}>{button}</button>
    </div>
  </main>;
}

function FarePreview({ frame, select, preview }: Actions & { frame: typeof fares[number] }) {
  const [id, node, , value, searching] = frame;
  const [fare, setFare] = useState<number>(value);
  const noDrivers = id.startsWith('no-drivers');
  const price = '$' + fare.toFixed(2);
  return <RiderPreviewRideSheet node={node} compact={false} preview={preview}>
    <div className="flex items-center gap-2"><Search className="size-6 text-[#ff000d]" /><div>
      <h1 className="text-lg font-bold">{searching ? 'Finding drivers near you' : 'Adjust your fare'}</h1>
      <p className="text-xs text-[#626a76]">{searching ? 'Searching for nearby drivers…' : noDrivers ? 'No drivers found nearby · keep searching' : 'Choose an offer before requesting again.'}</p>
    </div>{searching && <span className="ml-auto text-xs font-bold">Up to 30s</span>}</div>
    {searching && <div className="h-1 rounded-full bg-[#ffca31]" aria-hidden="true" />}
    <div className={box + ' flex items-center justify-between !bg-[#f7f8fa] p-3'}>
      <button type="button" aria-label="Decrease fare" onClick={() => setFare(n => n - 1)} disabled={fare <= 5} className="size-11 rounded-full bg-[#ffca31] text-2xl disabled:opacity-40">−</button>
      <div className="text-center"><p className="text-2xl font-bold">{price}</p><p className="text-xs text-[#626a76]">Adjust trip fare by $1</p></div>
      <button type="button" aria-label="Increase fare" onClick={() => setFare(n => n + 1)} disabled={fare >= 7} className="size-11 rounded-full bg-[#ff000d] text-2xl text-white disabled:opacity-40">+</button>
    </div>
    <div className={box + ' flex items-center gap-3 p-3'}><img className="w-20" src="/brand/cruize-economy-car.webp" alt="" /><div className="flex-1"><div className="flex justify-between font-semibold"><span>Economy</span><span>{price}</span></div><p className="text-xs text-[#626a76]">Montrose → Tower block</p><div className="mt-2 flex justify-between text-xs"><span>4 · 10 min</span><span className="rounded-full bg-[#ffca31] px-2 py-0.5 font-semibold">Fast Pickup</span></div></div></div>
    <div className="grid grid-cols-[1fr_2fr] gap-3"><button type="button" onClick={preview} className={box + ' min-h-12 font-semibold'}>Cancel</button><button type="button" className={red} onClick={searching ? preview : () => {
      if (fare === 6) preview();
      else select(fare === 5 ? 'searching-5' : 'searching-7');
    }}>{searching ? 'Note to driver' : 'Request again'}</button></div>
  </RiderPreviewRideSheet>;
}

export default function RiderBookingReview() {
  const [params, setParams] = useSearchParams();
  const [notice, setNotice] = useState(false);
  const selected = params.get('screen');
  const fare = fares.find(([id]) => id === selected);
  const location = locations.find(([id]) => id === selected) ?? locations[0];
  const select = (id: string) => { setParams({ screen: id }); setNotice(false); };
  const preview = () => setNotice(true);
  return <div className="min-h-dvh bg-[#f2f3f5]">
    <aside className="sticky top-0 z-20 mx-auto max-w-[400px] bg-white p-3 text-sm">
      <p className="font-semibold">Rider booking review · sample data</p>
      <label className="block">Screen
        <select value={fare?.[0] ?? location[0]} onChange={e => select(e.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border px-2">
          {[...locations, ...fares].map(([id, node, title]) => <option key={id} value={id}>{title} · {node}</option>)}
        </select>
      </label>
      {notice && <p role="status" className="mt-2">Preview only. No live request was made.</p>}
    </aside>
    {fare ? <FarePreview key={fare[0]} frame={fare} select={select} preview={preview} /> : <LocationPreview frame={location} select={select} preview={preview} />}
  </div>;
}

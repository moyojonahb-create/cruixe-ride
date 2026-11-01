import { Circle, CircleDot, Package, Users } from 'lucide-react';
import type { RideTierId, RideTierOption } from './RideTierSelector';

const vehicles: Record<RideTierId, string> = {
  economy: '/brand/cruize-economy-car.webp',
  share: '/brand/cruize-shared-car.webp',
  parcel: '/brand/cruize-parcel-van.webp',
};
const labels: Record<RideTierId, string> = { economy: 'Economy', share: 'Shared', parcel: 'Parcel' };
const descriptions: Record<RideTierId, string> = {
  economy: 'Affordable rides, everyday', share: 'Share a ride', parcel: 'Package delivery',
};

/** Pre-route selection. Availability, prices, ETAs and unsupported claims do not belong here. */
export default function RideSelectionCards({ options, selected, onSelect }: {
  options: RideTierOption[];
  selected: RideTierId;
  onSelect: (id: RideTierId) => void;
}) {
  return <div className="ride-selection-cards" role="group" aria-label="Ride categories">
    {options.map(option => {
      const isSelected = selected === option.id;
      const Radio = isSelected ? CircleDot : Circle;
      return <button key={option.id} type="button" className="ride-selection-card"
        aria-label={`Choose ${labels[option.id]}`} aria-pressed={isSelected}
        data-selected={isSelected ? 'true' : 'false'} onClick={() => onSelect(option.id)}>
        <img src={vehicles[option.id]} alt="" className="ride-selection-card__vehicle" />
        <span className="ride-selection-card__body">
          <span className="ride-selection-card__heading">
            <span className="ride-selection-card__title">{labels[option.id]}</span>
            <span className="ride-selection-card__capacity">
              {option.id === 'parcel' ? <Package aria-label="Parcel delivery" /> : <><Users aria-hidden="true" /><span aria-label={`${option.capacity} passengers`}>{option.capacity}</span></>}
            </span>
          </span>
          <span className="ride-selection-card__description">{descriptions[option.id]}</span>
        </span>
        <Radio className="ride-selection-card__radio" aria-hidden="true" />
      </button>;
    })}
  </div>;
}

import { Clock, Minus, Plus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import carImage from '@/assets/rider-home/car.webp';
import parcelImage from '@/assets/rider-home/parcel.webp';
import selectedIcon from '@/assets/rider-home/selected.svg';
import unselectedIcon from '@/assets/rider-home/unselected.svg';
import fastIcon from '@/assets/rider-home/tier-fast.svg';
import leafIcon from '@/assets/rider-home/tier-leaf.svg';
import secureIcon from '@/assets/rider-home/tier-secure.svg';
import reliableIcon from '@/assets/rider-home/tier-reliable.svg';

export type RideTierId = 'economy' | 'share' | 'parcel';

export interface RideTierOption {
  id: RideTierId;
  name: string;
  capacity: number;
  /** A fare and ETA need a real route. */
  etaMinutes: number | null;
  price: number | null;
  badge: string;
  badgeVariant: 'primary' | 'accent';
}

interface RideTierSelectorProps {
  options: RideTierOption[];
  selected: RideTierId;
  onSelect: (id: RideTierId) => void;
  currencySymbol: string;
  passengerCount?: number;
  onPassengerCountChange?: (count: number) => void;
  className?: string;
}

const tierDetails = {
  economy: {
    image: carImage,
    subtitle: 'Affordable rides',
    badges: [
      { label: 'Fast pickup', icon: fastIcon, color: '#fff4c4' },
      { label: 'Best value', icon: leafIcon, color: '#d1f5e1' },
    ],
  },
  share: {
    image: carImage,
    subtitle: 'Share a ride and save',
    badges: [
      { label: 'Lower cost', icon: null, color: '#d1f5e1' },
      { label: 'Eco friendly', icon: leafIcon, color: '#d1f5e1' },
    ],
  },
  parcel: {
    image: parcelImage,
    subtitle: 'Parcel delivery',
    badges: [
      { label: 'Secure', icon: secureIcon, color: '#f3dffb' },
      { label: 'Reliable', icon: reliableIcon, color: '#fff4c4' },
    ],
  },
} satisfies Record<RideTierId, { image: string; subtitle: string; badges: { label: string; icon: string | null; color: string }[] }>;

export default function RideTierSelector({
  options,
  selected,
  onSelect,
  currencySymbol,
  passengerCount = 1,
  onPassengerCountChange,
  className,
}: RideTierSelectorProps) {
  const passengerLimit = options.find((option) => option.id === selected)?.capacity ?? 1;

  if (options.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div role="group" aria-label="Ride options" className="space-y-3">
        {options.map((option) => {
          const isSelected = selected === option.id;
          const { image, subtitle, badges } = tierDetails[option.id];
          return (
            <motion.button
              key={option.id}
              type="button"
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelect(option.id)}
              aria-pressed={isSelected}
              className={cn(
                'flex min-h-[84px] w-full items-center gap-2 rounded-[15px] border px-2 py-1.5 text-left text-[#111] shadow-[0_4px_8px_#0002] sm:gap-3',
                isSelected ? 'border-[#ff000d] bg-[#fdebeb]' : 'border-[#d4d5d9] bg-[#f7f7fa]'
              )}
            >
              <img src={image} alt="" className="h-[74px] w-[clamp(70px,27vw,115px)] shrink-0 object-cover" />
              <div className="min-w-0 flex-1">
                <span className="block text-base font-bold leading-tight">{option.name}</span>
                <span className="block text-xs text-[#585a60]">{subtitle}</span>
                {option.price != null && (
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                    <span className="font-bold tabular-nums">{currencySymbol}{option.price.toFixed(2)}</span>
                    {option.etaMinutes != null && (
                      <span className="inline-flex items-center gap-1 text-[#585a60]"><Clock className="size-3" />{option.etaMinutes} min</span>
                    )}
                  </span>
                )}
                <span className="mt-1.5 flex flex-wrap gap-x-1.5 gap-y-1">
                  {badges.map((badge) => (
                    <span key={badge.label} className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none" style={{ background: badge.color }}>
                      {badge.icon ? <img src={badge.icon} alt="" /> : <Users className="size-3" />}
                      {badge.label}
                    </span>
                  ))}
                </span>
              </div>
              <img src={isSelected ? selectedIcon : unselectedIcon} alt="" className="shrink-0" />
            </motion.button>
          );
        })}
      </div>

      {onPassengerCountChange && selected !== 'parcel' && (
        <div className="flex items-center justify-between rounded-[15px] border border-[#e0e3e9] bg-white px-3 text-[#111]">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Users className="size-4" />
            Passengers
          </span>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => onPassengerCountChange(passengerCount - 1)}
              disabled={passengerCount <= 1}
              aria-label="Fewer passengers"
              className="grid size-11 place-items-center rounded-full disabled:opacity-30"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-4 text-center text-sm font-bold tabular-nums">{passengerCount}</span>
            <button
              type="button"
              onClick={() => onPassengerCountChange(passengerCount + 1)}
              disabled={passengerCount >= passengerLimit}
              aria-label="More passengers"
              className="grid size-11 place-items-center rounded-full disabled:opacity-30"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

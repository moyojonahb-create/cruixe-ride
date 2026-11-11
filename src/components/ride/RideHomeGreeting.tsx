import { motion } from 'framer-motion';
import carImage from '@/assets/rider-home/car.webp';
import searchIcon from '@/assets/rider-home/search.svg';
import { RIDE_RED } from './rideGlass';

interface RideHomeGreetingProps {
  name: string;
  onSearchClick: () => void;
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function RideHomeGreeting({ name, onSearchClick }: RideHomeGreetingProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSearchClick}
      className="flex min-h-[67px] min-w-0 flex-1 items-center gap-1 rounded-[15px] border border-[#d4d5d9] bg-[#f2f3f8] px-1.5 text-left shadow-[0_4px_12px_#0002] transition-transform active:scale-[0.98]"
    >
      <img
        src={carImage}
        alt=""
        className="h-[56px] w-[clamp(45px,19vw,86px)] shrink-0 object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-semibold leading-[1.2] text-[#60636a]">
          {timeGreeting()}{name ? `, ${name}` : ''}
        </p>
        <p className="text-[clamp(1rem,5vw,1.32rem)] font-bold leading-tight tracking-tight text-[#111]">Where to?</p>
      </div>
      <span className="grid size-7 shrink-0 place-items-center rounded-full" style={{ background: RIDE_RED }}>
        <img src={searchIcon} alt="" />
      </span>
    </motion.button>
  );
}

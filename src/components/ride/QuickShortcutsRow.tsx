import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import homeIcon from '@/assets/rider-home/home.svg';
import workIcon from '@/assets/rider-home/work.svg';

interface QuickPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  icon: string | null;
}

interface QuickShortcutsRowProps {
  onSelect: (place: { name: string; lat: number; lng: number }) => void;
  /** An unset Home/Work tile was tapped — caller opens the address picker
   * and saves whatever's chosen under this key. */
  onRequestSet: (key: 'home' | 'work') => void;
}

/** Row 2's two square tiles, alongside the Where-to card from RideHomeGreeting.
 * Home and Work always keep their own tint (pink / yellow) regardless of
 * whether the rider has saved an address for them yet. */
export default function QuickShortcutsRow({ onSelect, onRequestSet }: QuickShortcutsRowProps) {
  const { user } = useAuth();
  const [places, setPlaces] = useState<QuickPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPlaces([]); setLoading(false); return; }
    let cancelled = false;
    supabase
      .from('favorite_locations')
      .select('id, name, address, latitude, longitude, icon')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(6)
      .then(({ data }) => {
        if (cancelled) return;
        setPlaces(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  const homeFav = places.find((p) => (p.icon?.toLowerCase() ?? '') === 'home');
  const workFav = places.find((p) => (p.icon?.toLowerCase() ?? '') === 'work');

  const tiles = [
    { key: 'home', label: 'Home', icon: homeIcon, background: '#fdebeb', fav: homeFav },
    { key: 'work', label: 'Work', icon: workIcon, background: '#fef6c9', fav: workFav },
  ] as const;

  // Fragment, not a wrapping div — these render as direct flex items inside
  // RideView's row-2 flex row, alongside RideHomeGreeting's card.
  return (
    <>
      {tiles.map((tile, i) => (
        <motion.button
          key={tile.key}
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          disabled={loading}
          onClick={() => tile.fav
            ? onSelect({ name: tile.fav.name, lat: tile.fav.latitude, lng: tile.fav.longitude })
            : onRequestSet(tile.key)}
          className="flex h-[67px] w-[clamp(44px,13vw,54px)] shrink-0 flex-col items-center justify-center gap-1 rounded-[15px] border border-black/5 text-[#111] shadow-sm transition-transform active:scale-95 disabled:opacity-60"
          style={{ background: tile.background }}
        >
          <img src={tile.icon} alt="" />
          <span className="text-xs font-semibold">{tile.label}</span>
        </motion.button>
      ))}
    </>
  );
}

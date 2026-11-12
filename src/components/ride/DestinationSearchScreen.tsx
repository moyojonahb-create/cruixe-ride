import { useId, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase, Home, Loader2, X,
} from 'lucide-react';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { cn } from '@/lib/utils';
import backIcon from '@/assets/rider-home/back.svg';
import gpsIcon from '@/assets/rider-home/destination-gps.svg';
import pinIcon from '@/assets/rider-home/destination-pin.svg';

export interface SearchPlace {
  name: string;
  lat: number;
  lng: number;
  secondary?: string;
}

export interface SearchResultRow {
  id: string;
  name: string;
  secondary?: string;
  onSelect: () => void;
  /** Where this result came from — dev-only, shown as a debug badge to gauge whether Google is adding value over our own data. */
  source?: 'landmark' | 'street' | 'cache' | 'google' | 'nominatim';
}

interface DestinationSearchScreenProps {
  activeField: 'pickup' | 'dropoff';
  riderName?: string;
  onActiveFieldChange: (field: 'pickup' | 'dropoff') => void;
  pickupName: string;
  dropoffName: string;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onContinue: () => void;
  onUseMyLocation: () => void;
  gpsLoading?: boolean;
  onChooseOnMap: () => void;
  onSelectPlace: (place: SearchPlace) => void;
  results: SearchResultRow[];
  loading?: boolean;
  /** Set while the rider is picking an address to save as Home/Work (tapped
   * the shortcut before one was ever saved) — see RideView.tsx's
   * saveFavoriteIfSetting, which every selection path funnels through. */
  settingFavorite?: 'home' | 'work' | null;
  onRequestSetFavorite: (key: 'home' | 'work') => void;
}

interface FavoritePlace {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  icon: string | null;
}

export default function DestinationSearchScreen({
  activeField,
  riderName,
  onActiveFieldChange,
  pickupName,
  dropoffName,
  query,
  onQueryChange,
  onClose,
  onContinue,
  onUseMyLocation,
  gpsLoading,
  onChooseOnMap,
  onSelectPlace,
  results,
  loading,
  settingFavorite,
  onRequestSetFavorite,
}: DestinationSearchScreenProps) {
  // Favorites and recent rides come from the splash-time cache — no
  // per-mount Supabase query needed (see useAppBootstrap).
  const { favorites: allFavorites, recentRides } = useAppBootstrap();
  const favorites = useMemo(() => allFavorites.slice(0, 10) as FavoritePlace[], [allFavorites]);

  const recents = useMemo(() => {
    const seen = new Map<string, SearchPlace>();
    for (const ride of recentRides) {
      const name = activeField === 'pickup' ? ride.pickup_address : ride.dropoff_address;
      const lat = activeField === 'pickup' ? ride.pickup_lat : ride.dropoff_lat;
      const lng = activeField === 'pickup' ? ride.pickup_lon : ride.dropoff_lon;
      if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (!seen.has(name)) {
        const parts = name.split(',').map((p) => p.trim()).filter(Boolean);
        seen.set(name, { name: parts[0] || name, lat: lat as number, lng: lng as number, secondary: parts.slice(1).join(', ') || undefined });
      }
    }
    return Array.from(seen.values()).slice(0, 12);
  }, [recentRides, activeField]);

  const findFavorite = (key: string) =>
    favorites.find((f) => (f.icon || f.name).toLowerCase().includes(key));

  const savedShortcuts: { key: string; label: string; icon: typeof Home }[] = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'work', label: 'Work', icon: Briefcase },
  ];

  const searching = query.trim().length >= 3;
  const fieldId = useId();
  const activeInputRef = useRef<HTMLInputElement>(null);

  const fieldRow = (field: 'pickup' | 'dropoff') => {
    const isActive = activeField === field;
    const value = field === 'pickup' ? pickupName : dropoffName;
    const label = field === 'pickup' ? 'Pickup' : 'Destination';
    const placeholder = field === 'pickup' ? 'Search pickup' : 'Search destination';
    const inputId = `${fieldId}-${field}`;

    return (
      <div
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left',
          field === 'pickup' && 'border-b border-[#e1e5ea]'
        )}
      >
        {field === 'pickup' ? (
          <span aria-hidden="true" className="size-3.5 shrink-0 rounded-full bg-[#ffd300]" />
        ) : (
          <span aria-hidden="true" className="size-3.5 shrink-0 rounded-full bg-primary" />
        )}
        {isActive ? (
          <div className="flex-1 min-w-0">
            <label htmlFor={inputId} className="block text-[11px] font-semibold uppercase text-[#58616f]">
              {label}
            </label>
            <input
              id={inputId}
              ref={activeInputRef}
              autoFocus
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={value || placeholder}
              className="min-h-8 w-full rounded-sm bg-transparent text-sm font-semibold text-[#20232a] placeholder:text-[#58616f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Edit ${label.toLowerCase()}`}
            aria-describedby={`${inputId}-value`}
            onClick={() => onActiveFieldChange(field)}
            className="flex-1 min-w-0 min-h-11 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <span className="block text-[11px] font-semibold uppercase text-[#58616f]">{label}</span>
            <span id={`${inputId}-value`} className="block truncate text-sm font-semibold text-[#20232a]">
              {value || placeholder}
            </span>
          </button>
        )}
        {isActive && query.length > 0 && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            onClick={() => {
              onQueryChange('');
              activeInputRef.current?.focus();
            }}
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <X aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    );
  };

  const optionRow = (
    key: string,
    icon: React.ReactNode,
    title: string,
    subtitle: string | undefined,
    onClick: () => void,
    highlighted = false,
  ) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={cn('flex min-h-[59px] w-full items-center gap-3 rounded-2xl border border-[#e1e5ea] px-3 py-2.5 text-left transition-colors hover:border-primary', highlighted ? 'bg-[#fff0f0]' : 'bg-white')}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#20232a]">{title}</p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-[#58616f]">{subtitle}</p>}
      </div>
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[70] flex flex-col bg-[#f5f6f9] text-[#20232a]"
    >
      <div className="relative shrink-0 px-4 pb-3" style={{ paddingTop: 'max(1.75rem, calc(env(safe-area-inset-top) + 12px))' }}>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[184px] rounded-b-[27px] bg-primary" />
        <div className="relative mb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="grid size-12 shrink-0 place-items-center rounded-full bg-white shadow-sm transition-transform active:scale-90"
          >
            <img src={backIcon} alt="" />
          </button>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            {settingFavorite
              ? `Search for your ${settingFavorite === 'home' ? 'Home' : 'Work'} address`
              : riderName ? `Hi ${riderName}, where to?` : 'Where to?'}
          </h1>
        </div>
        <p className="relative mb-4 text-xs font-medium text-[#111]">Choose your pickup and destination</p>

        <div className="relative overflow-hidden rounded-[22px] border border-[#e5e9ef] bg-white shadow-md">
          {fieldRow('pickup')}
          {fieldRow('dropoff')}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {!searching && (
          <div className="space-y-2.5">
            {activeField === 'pickup' &&
              optionRow(
                'gps',
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fff0f0]">
                  {gpsLoading ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : (
                    <img src={gpsIcon} alt="" />
                  )}
                </span>,
                'Use my current location',
                'Detect pickup automatically',
                onUseMyLocation
              )}

            {optionRow(
              'map',
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white">
                <img src={pinIcon} alt="" />
              </span>,
              'Choose on map',
              'Drop a pin exactly where you want',
              onChooseOnMap,
              true
            )}

            {savedShortcuts.map(({ key, label, icon: Icon }) => {
              const fav = findFavorite(key);
              return optionRow(
                key,
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/20">
                  <Icon className="w-5 h-5 text-primary" />
                </span>,
                label,
                fav ? fav.address || fav.name : 'Tap to set this address',
                () => {
                  if (fav) onSelectPlace({ name: fav.name, lat: fav.latitude, lng: fav.longitude });
                  else onRequestSetFavorite(key as 'home' | 'work');
                }
              );
            })}

            {recents.length > 0 && (
              <>
                <h2 className="pt-3 text-base font-bold">Recent places</h2>
                {recents.map((place, i) =>
                  optionRow(
                    `recent-${i}`,
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fff0f0]">
                      <img src={pinIcon} alt="" />
                    </span>,
                    place.name,
                    place.secondary,
                    () => onSelectPlace(place)
                  )
                )}
              </>
            )}
          </div>
        )}

        {searching && (
          <div className="space-y-2 pt-1">
            {loading && results.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Searching places…</span>
              </div>
            )}
            {results.map((row) =>
              optionRow(
                row.id,
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fff0f0]">
                  <img src={pinIcon} alt="" />
                </span>,
                row.name,
                row.secondary,
                row.onSelect
              )
            )}
            {!loading && results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">No results for “{query}”</p>
            )}
          </div>
        )}
      </div>
      <div className="shrink-0 px-4 pt-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <button
          type="button"
          disabled={!pickupName || !dropoffName || Boolean(query.trim())}
          onClick={onContinue}
          className="min-h-[54px] w-full rounded-full bg-primary px-4 text-base font-semibold text-white disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}

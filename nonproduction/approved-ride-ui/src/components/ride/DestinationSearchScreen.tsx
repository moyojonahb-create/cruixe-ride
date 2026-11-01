import { useEffect, useId, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Briefcase, Clock, Search, ChevronRight, Crosshair, Home, Map as MapIcon, MapPin, X,
} from 'lucide-react';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import './destinationScreen.css';
import { cn } from '@/lib/utils';

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
  onActiveFieldChange: (field: 'pickup' | 'dropoff') => void;
  pickupName: string;
  dropoffName: string;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onUseMyLocation: () => void;
  gpsLoading?: boolean;
  onChooseOnMap: () => void;
  onSelectPlace: (place: SearchPlace) => void;
  results: SearchResultRow[];
  loading?: boolean;
  searchError?: string | null;
  onRetrySearch?: () => void;
  resolving?: boolean;
  gpsError?: string | null;
  onSeeAll?: () => void;
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
  onActiveFieldChange,
  pickupName,
  dropoffName,
  query,
  onQueryChange,
  onClose,
  onUseMyLocation,
  gpsLoading,
  onChooseOnMap,
  onSelectPlace,
  results,
  loading,
  searchError,
  onRetrySearch,
  resolving,
  gpsError,
  onSeeAll,
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

  const screenRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const resize = () => {
      if (!screenRef.current) return;
      screenRef.current.style.height = `${viewport.height}px`;
      screenRef.current.style.top = `${viewport.offsetTop}px`;
    };
    resize(); viewport.addEventListener('resize', resize); viewport.addEventListener('scroll', resize);
    return () => { viewport.removeEventListener('resize', resize); viewport.removeEventListener('scroll', resize); };
  }, []);
  const queryLength = query.trim().length;
  const searching = queryLength >= 3;
  const instruction = queryLength === 0 ? 'Type at least 3 characters to search.' : `Type ${3 - queryLength} more ${queryLength === 2 ? 'character' : 'characters'} to search.`;
  const resultsId = useId();
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
          'destination-field w-full flex items-center gap-3 px-3.5 py-3 text-left',
          field === 'pickup' && 'border-b border-border/60',
          field === 'pickup' && isActive && 'destination-field--editing-pickup'
        )}
      >
        {field === 'pickup' ? (
          <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-accent ring-[3px] ring-accent/20 shrink-0" />
        ) : (
          <span aria-hidden="true" className="w-2.5 h-2.5 rounded-[3px] bg-primary ring-[3px] ring-primary/15 shrink-0" />
        )}
        {isActive ? (
          <div className="destination-input flex-1 min-w-0">
            <label htmlFor={inputId} className="block text-xs font-medium text-muted-foreground">
              {label}
            </label>
            <div className="destination-search-control">
              <Search className="destination-search-icon" aria-hidden="true" />
              <input
                id={inputId}
                ref={activeInputRef}
                autoFocus
                autoComplete="off"
                enterKeyHint="search"
                aria-describedby={`${fieldId}-feedback`}
                aria-controls={searching ? resultsId : undefined}
                value={query}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') e.currentTarget.blur();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const first = document.getElementById(resultsId)?.querySelector<HTMLButtonElement>('button');
                    if (first) first.focus(); else e.currentTarget.blur();
                  }
                }}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder={value || placeholder}
                className="destination-search-text"
              />
              {query.length > 0 && <button type="button" className="destination-search-clear"
                aria-label={`Clear ${label.toLowerCase()}`}
                onClick={() => { onQueryChange(''); activeInputRef.current?.focus(); }}>
                <X aria-hidden="true" />
              </button>}
            </div>
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Edit ${label.toLowerCase()}`}
            aria-describedby={`${inputId}-value`}
            onClick={() => onActiveFieldChange(field)}
            className="flex-1 min-w-0 min-h-11 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <span className="block text-xs font-medium text-muted-foreground">{label}</span>
            <span id={`${inputId}-value`} className={cn('block text-[15px] font-medium truncate', value ? 'text-foreground' : 'text-muted-foreground')}>
              {value || placeholder}
            </span>
          </button>
        )}
        {field === 'pickup' && <button type="button" className="destination-gps" onClick={onUseMyLocation} disabled={gpsLoading}><Crosshair aria-hidden="true" />{gpsLoading ? 'Locating…' : 'Use current location'}</button>}

      </div>
    );
  };

  const optionRow = (
    key: string,
    icon: React.ReactNode,
    title: string,
    subtitle: string | undefined,
    onClick: () => void
  ) => (
    <button
      key={key}
      type="button"
      onClick={() => { activeInputRef.current?.blur(); onClick(); }}
      className={`destination-option destination-option--${key} w-full flex items-center gap-3.5 px-4 py-3 text-left`}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-foreground truncate">{title}</p>
        {subtitle && <p className="text-[12px] text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <ChevronRight aria-hidden="true" className="destination-chevron" />
    </button>
  );

  return (
    <motion.div
      ref={screenRef}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="destination-screen fixed inset-0 z-[70] flex flex-col bg-background"
    >
      {/* Destination header */}
      <div className="destination-header bg-primary px-4 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={onClose}
            aria-label="Back"
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-[16px] font-semibold text-primary-foreground">
            {settingFavorite
              ? `Search for your ${settingFavorite === 'home' ? 'Home' : 'Work'} address`
              : activeField === 'pickup' ? 'Set pickup' : 'Set destination'}
          </h1>
        </div>

        <div className="destination-address-card rounded-2xl bg-card shadow-lg">
          {fieldRow('pickup')}
          {fieldRow('dropoff')}
          {gpsError && <p role="status" className="destination-status">{gpsError}</p>}
        </div>
      </div>

      {/* Body */}
      <div className="destination-body flex-1 overflow-y-auto overscroll-contain bg-background pb-8">
        <p id={`${fieldId}-feedback`} role="status" aria-live="polite" className="destination-search-feedback">
          {!searching ? instruction : resolving ? 'Resolving location…' : loading ? 'Searching places…' : searchError ? 'Some search services are unavailable.' : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
        </p>
        {queryLength === 0 && (
          <div className="pt-2">
            {optionRow(
              'map',
              <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapIcon className="w-5 h-5 text-primary" />
              </span>,
              'Choose on map',
              'Drop a pin exactly where you want',
              onChooseOnMap
            )}

            <div className="h-2 bg-muted/40 my-1" />

            {savedShortcuts.map(({ key, label, icon: Icon }) => {
              const fav = findFavorite(key);
              return optionRow(
                key,
                <span className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center shrink-0">
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

            <div className="destination-recents-heading"><h2 className="destination-recents-title">Recent destinations</h2>{recents.length > 0 && onSeeAll && <button type="button" onClick={onSeeAll}>See all</button>}</div>
            {recents.length === 0 && <p className="destination-empty">Your recent destinations will appear here after a trip.</p>}
            {recents.length > 0 && (
              <>
                <div className="h-2 bg-muted/40 my-1" />

                {recents.map((place, i) =>
                  optionRow(
                    `recent-${i}`,
                    <span className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-muted-foreground" />
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
          <section id={resultsId} aria-label="Search results" aria-busy={Boolean(loading || resolving)} className="destination-results">
            {results.map((row) =>
              optionRow(
                row.id,
                <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </span>,
                row.name,
                row.secondary,
                row.onSelect
              )
            )}
            {searchError && <div className="destination-search-error" role="alert">
              <p>{searchError}</p>
              {onRetrySearch && <button type="button" disabled={Boolean(loading || resolving)} onClick={onRetrySearch}>Retry search</button>}
              <button type="button" onClick={onChooseOnMap}>Choose on map</button>
            </div>}
            {!loading && !resolving && !searchError && results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">No results for “{query}”</p>
            )}
          </section>
        )}
      </div>
    </motion.div>
  );
}

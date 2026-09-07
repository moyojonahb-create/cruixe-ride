/**
 * Ride — the rider's home screen.
 *
 * Styled from the web app's own ride design language (`src/components/ride/
 * rideGlass.ts`): brand red #B81104, yellow #FFDD00, frosted white surfaces
 * over a map, tinted tier cards (blue for economy/parcel, yellow for share),
 * and a red CTA carrying a coloured glow rather than a neutral shadow.
 *
 * Two deliberate approximations, because both real versions are native modules
 * and would each cost an EAS build:
 *
 *   - **No backdrop blur.** `rideGlass`'s panels use `backdrop-filter`, which
 *     RN has no equivalent for without `expo-blur`. High-opacity white reads
 *     close enough over map imagery.
 *   - **No gradient fill.** The CTA's `linear-gradient(135deg,#E01B00,#B81104)`
 *     needs `expo-linear-gradient`. Solid #B81104 with the red glow retained.
 *
 * Both are listed as N-6 candidates. Neither changes the layout, so swapping
 * them in later is a fill change, not a redesign.
 *
 * Still `components/ui/`-free — that workstream is sequenced after the slice.
 */

import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DEFAULT_TOWN,
  detectTown,
  formatFare,
  isWithinAnyServiceArea,
  type RideTierId,
} from '@cruixe/core';

import StaticMap from '../components/StaticMap';
import { useDeviceLocation } from '../location/useDeviceLocation';
import { useFareEstimate } from '../pricing/useFareEstimate';
import { useTownPricing } from '../pricing/useTownPricing';
import type { DestinationResult } from '../search/useDestinationSearch';
import { defaultTheme as t } from '../theme';
import DestinationSearchScreen from './DestinationSearchScreen';

const CAR_ART: Record<RideTierId, ReturnType<typeof require>> = {
  economy: require('../../assets/cars/car-front-economy.png'),
  share: require('../../assets/cars/car-slant-share.png'),
  parcel: require('../../assets/cars/car-parcel.png'),
};

const SCREEN = Dimensions.get('window');
const MAP_HEIGHT = Math.round(SCREEN.height * 0.42);

export default function RideScreen() {
  const insets = useSafeAreaInsets();
  const { status, coords, error, request } = useDeviceLocation();
  const [destination, setDestination] = useState<DestinationResult | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<RideTierId>('economy');

  useEffect(() => {
    void request();
  }, [request]);

  const town = coords ? detectTown(coords.lat, coords.lng) : DEFAULT_TOWN;
  const inServiceArea = coords ? isWithinAnyServiceArea(coords.lat, coords.lng) : false;

  const { pricing } = useTownPricing(town.id);
  const fare = useFareEstimate({
    pricing,
    pickup: coords ? { lat: coords.lat, lng: coords.lng } : null,
    dropoff: destination ? { lat: destination.lat, lng: destination.lng } : null,
  });

  if (searchOpen) {
    return (
      <DestinationSearchScreen
        town={town}
        userCoords={coords ? { lat: coords.lat, lng: coords.lng } : null}
        onSelect={(r: DestinationResult) => {
          setDestination(r);
          setSearchOpen(false);
        }}
        onClose={() => setSearchOpen(false)}
      />
    );
  }

  const selected = fare.tiers.find((x) => x.id === selectedTier) ?? fare.tiers[0];

  return (
    <View style={styles.root}>
      {/* Map layer */}
      <View style={styles.mapLayer}>
        <StaticMap
          pickup={coords ? { lat: coords.lat, lng: coords.lng } : null}
          dropoff={destination ? { lat: destination.lat, lng: destination.lng } : null}
          height={MAP_HEIGHT}
          width={SCREEN.width}
        />
      </View>

      {/* Floating header over the map */}
      <View style={[styles.header, { top: insets.top + 10 }]}>
        <View style={styles.brandPill}>
          <Text style={styles.brandText}>CruiXe</Text>
        </View>
        <View style={styles.townPill}>
          <Text style={styles.townText}>
            {town.name}
            {coords && !inServiceArea ? ' · outside service area' : ''}
          </Text>
        </View>
      </View>

      {/* Glass sheet */}
      <ScrollView
        style={[styles.sheet, { marginTop: MAP_HEIGHT - 24 }]}
        contentContainerStyle={[styles.sheetInner, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grabber} />

        <Text style={styles.h1}>Where to?</Text>

        {/* Pickup / dropoff */}
        <View style={styles.route}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, styles.dotPickup]} />
            <Text style={styles.routeLabel} numberOfLines={1}>
              {coords ? `Your location · ${town.name}` : 'Finding your location…'}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <Pressable
            style={({ pressed }) => [styles.routeRow, pressed && styles.pressed]}
            onPress={() => setSearchOpen(true)}
            accessibilityRole="button"
          >
            <View style={[styles.dot, styles.dotDropoff]} />
            <Text
              style={[styles.routeLabel, !destination && styles.routePlaceholder]}
              numberOfLines={1}
            >
              {destination ? destination.name : 'Enter destination'}
            </Text>
          </Pressable>
        </View>

        {/* Tier cards */}
        <Text style={styles.sectionTitle}>Choose a ride</Text>
        {fare.tiers.map((tier) => {
          const active = tier.id === selectedTier;
          return (
            <Pressable
              key={tier.id}
              onPress={() => setSelectedTier(tier.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.tier,
                tier.id === 'share' ? styles.tintYellow : styles.tintBlue,
                active && styles.tierActive,
                pressed && styles.pressed,
              ]}
            >
              <Image source={CAR_ART[tier.id]} style={styles.carArt} resizeMode="contain" />
              <View style={styles.tierMain}>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierMeta}>
                  {tier.capacity} seats · {tier.badge}
                </Text>
              </View>
              <View style={styles.tierRight}>
                <Text style={styles.tierPrice}>
                  {tier.price == null ? '—' : formatFare(tier.price, fare.currencySymbol)}
                </Text>
                {tier.etaMinutes != null ? (
                  <Text style={styles.tierEta}>{tier.etaMinutes} min</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}

        {/* CTA */}
        <Pressable
          disabled={!destination}
          style={({ pressed }) => [
            styles.cta,
            !destination && styles.ctaDisabled,
            pressed && destination && styles.ctaPressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>
            {destination
              ? `Request ${selected?.name ?? 'ride'}${
                  selected?.price != null ? ` · ${formatFare(selected.price, fare.currencySymbol)}` : ''
                }`
              : 'Enter a destination first'}
          </Text>
        </Pressable>

        {status === 'denied' || status === 'unavailable' ? (
          <Pressable onPress={() => void request()} style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              {status === 'denied' ? 'Location permission needed' : 'Location unavailable'}
            </Text>
            <Text style={styles.errorBody}>{error} — tap to retry</Text>
          </Pressable>
        ) : null}

        {fare.distanceKm != null ? (
          <Text style={styles.note}>
            {fare.distanceKm.toFixed(1)} km straight-line — real road fares will be higher. Live
            routing arrives with the ride request.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.colors.background },
  mapLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  brandPill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  brandText: { fontSize: 16, fontWeight: '800', color: t.colors.brandRed, letterSpacing: -0.3 },
  townPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    elevation: 3,
  },
  townText: { fontSize: 12, fontWeight: '600', color: t.colors.mutedForeground },

  sheet: { flex: 1 },
  sheetInner: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 12,
    minHeight: SCREEN.height * 0.62,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D8DBE0',
    marginBottom: 4,
  },
  h1: { fontSize: 24, fontWeight: '800', color: '#111111', letterSpacing: -0.4 },

  route: {
    backgroundColor: '#F5F6F8',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotPickup: { backgroundColor: t.colors.brandRed },
  dotDropoff: { backgroundColor: '#111111' },
  routeLine: { height: 1, backgroundColor: '#E3E6EA', marginLeft: 22 },
  routeLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111111' },
  routePlaceholder: { color: '#8A8F98', fontWeight: '500' },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },

  tier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  tintBlue: { backgroundColor: '#EEF3FC' },
  tintYellow: { backgroundColor: '#FFFACD' },
  tierActive: { borderColor: t.colors.brandRed, borderWidth: 2 },
  carArt: { width: 62, height: 40 },
  tierMain: { flex: 1, gap: 2 },
  tierName: { fontSize: 15, fontWeight: '800', color: '#111111' },
  tierMeta: { fontSize: 12, color: '#666666' },
  tierRight: { alignItems: 'flex-end', gap: 1 },
  tierPrice: { fontSize: 15, fontWeight: '800', color: '#111111', fontVariant: ['tabular-nums'] },
  tierEta: { fontSize: 12, color: '#666666', fontVariant: ['tabular-nums'] },

  cta: {
    height: 54,
    borderRadius: 16,
    backgroundColor: t.colors.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    // The red glow from rideGlass.redCta, minus the gradient fill.
    shadowColor: '#B81104',
    shadowOpacity: 0.36,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  ctaPressed: { backgroundColor: t.colors.brandRedHover },
  ctaDisabled: { backgroundColor: '#C9CDD4', shadowOpacity: 0, elevation: 0 },
  ctaText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  pressed: { opacity: 0.85 },

  errorCard: {
    backgroundColor: '#FFF8F7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(184,17,4,0.16)',
    padding: 12,
    gap: 3,
  },
  errorTitle: { fontSize: 14, fontWeight: '700', color: t.colors.brandRed },
  errorBody: { fontSize: 12, color: '#666666' },

  note: { fontSize: 11, color: '#8A8F98', lineHeight: 16 },
});

/**
 * Real Mapbox imagery with no native module — an interim, deliberately.
 *
 * `@rnmapbox/maps` is a native module: adding it costs an EAS build and a
 * redistributed dev client, and per §5a of MIGRATION_SCREEN_INVENTORY.md the
 * interactive map is a designed piece of work in its own right (the web app
 * drives Mapbox GL imperatively via `document.createElement`; the RN SDK is
 * declarative, so the interaction model changes, not just the library).
 *
 * The Static Images API needs none of that. It returns a rendered PNG over
 * plain HTTP, so `<Image>` displays it and the screen looks like a map today.
 *
 * **What this is not.** It does not pan, zoom, rotate, or animate a driver
 * marker, and it re-fetches rather than re-renders when the pins move. It is a
 * picture of a map. That is enough to design the screen against and to show a
 * rider where they are; it is not enough for live tracking, which is why the
 * native SDK still lands later as N-6.
 *
 * Falls back to a coordinate readout when no token is configured, rather than
 * rendering a broken image — the coordinates are the load-bearing information.
 */

import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { defaultTheme as t } from '../theme';

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';
const STYLE = 'mapbox/streets-v12';

export interface MapPoint {
  lat: number;
  lng: number;
}

function buildUrl(pickup: MapPoint, dropoff: MapPoint | null, w: number, h: number) {
  // Mapbox wants lon,lat — the reverse of how every other part of this codebase
  // orders them. Getting this backwards puts Gwanda in the Indian Ocean.
  const pins = [
    `pin-s-a+B81104(${pickup.lng},${pickup.lat})`,
    dropoff ? `pin-s-b+111111(${dropoff.lng},${dropoff.lat})` : null,
  ]
    .filter(Boolean)
    .join(',');

  // `auto` frames both pins when there are two; a single pin needs an explicit
  // zoom or Mapbox returns a world view.
  const viewport = dropoff ? 'auto' : `${pickup.lng},${pickup.lat},14,0`;
  const padding = dropoff ? '&padding=60' : '';

  return (
    `https://api.mapbox.com/styles/v1/${STYLE}/static/${pins}/${viewport}` +
    `/${Math.round(w)}x${Math.round(h)}@2x?access_token=${TOKEN}${padding}`
  );
}

export default function StaticMap({
  pickup,
  dropoff,
  height = 320,
  width = 720,
}: {
  pickup: MapPoint | null;
  dropoff?: MapPoint | null;
  height?: number;
  width?: number;
}) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  if (!pickup || !TOKEN || failed) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Text style={styles.fallbackLabel}>
          {!pickup ? 'Finding your location…' : !TOKEN ? 'Map unavailable' : 'Map failed to load'}
        </Text>
        {pickup ? (
          <Text style={styles.fallbackCoords}>
            {pickup.lat.toFixed(5)}, {pickup.lng.toFixed(5)}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <Image
        source={{ uri: buildUrl(pickup, dropoff ?? null, width, height) }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={t.colors.brandRed} />
        </View>
      ) : null}
      <View style={styles.staticBadge}>
        <Text style={styles.staticBadgeText}>STATIC MAP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: t.colors.secondary, overflow: 'hidden' },
  loading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  staticBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  staticBadgeText: { fontSize: 9, fontWeight: '800', color: t.colors.mutedForeground, letterSpacing: 1 },
  fallback: {
    backgroundColor: t.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fallbackLabel: { fontSize: 13, color: t.colors.mutedForeground },
  fallbackCoords: {
    fontSize: 15,
    fontWeight: '700',
    color: t.colors.foreground,
    fontVariant: ['tabular-nums'],
  },
});

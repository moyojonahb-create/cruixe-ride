/**
 * Tab bar icons drawn from Views.
 *
 * **Why not `@expo/vector-icons`.** It depends on `expo-font`, and neither is
 * in this binary — adding them is a native change costing an EAS build. With no
 * icon set available, React Navigation falls back to a placeholder glyph, which
 * renders as tofu boxes on Android and looks broken.
 *
 * These are geometric primitives: circles, rounded rectangles and rules. They
 * cost nothing, take their colour from the tab's active/inactive tint so
 * theming stays in one place, and render identically on both platforms.
 *
 * They are a stand-in for a real icon set, not a replacement for one. When the
 * next native batch lands `expo-font`, swap this component out — the call sites
 * take `{ color, size }` and nothing else, so the swap is mechanical.
 */

import { StyleSheet, View } from 'react-native';

export type TabIconName = 'ride' | 'history' | 'wallet' | 'profile';

export default function TabIcon({
  name,
  color,
  size = 24,
}: {
  name: TabIconName;
  color: string;
  size?: number;
}) {
  const s = size;

  if (name === 'ride') {
    // Car: cabin over a body, with two wheels.
    return (
      <View style={[styles.box, { width: s, height: s }]}>
        <View
          style={{
            width: s * 0.52,
            height: s * 0.26,
            borderTopLeftRadius: s * 0.16,
            borderTopRightRadius: s * 0.16,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            width: s * 0.82,
            height: s * 0.26,
            borderRadius: s * 0.09,
            backgroundColor: color,
            marginTop: -1,
          }}
        />
        <View style={[styles.row, { width: s * 0.72, marginTop: 2 }]}>
          <View style={{ width: s * 0.16, height: s * 0.16, borderRadius: s * 0.08, backgroundColor: color }} />
          <View style={{ width: s * 0.16, height: s * 0.16, borderRadius: s * 0.08, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  if (name === 'history') {
    // Clock: ring plus two hands.
    return (
      <View style={[styles.box, { width: s, height: s }]}>
        <View
          style={{
            width: s * 0.78,
            height: s * 0.78,
            borderRadius: s * 0.39,
            borderWidth: 2,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ position: 'absolute', width: 2, height: s * 0.22, backgroundColor: color, top: s * 0.14 }} />
          <View style={{ position: 'absolute', width: s * 0.18, height: 2, backgroundColor: color, left: s * 0.37 }} />
        </View>
      </View>
    );
  }

  if (name === 'wallet') {
    // Wallet: rounded body with a clasp dot.
    return (
      <View style={[styles.box, { width: s, height: s }]}>
        <View
          style={{
            width: s * 0.84,
            height: s * 0.62,
            borderRadius: s * 0.14,
            borderWidth: 2,
            borderColor: color,
            justifyContent: 'center',
            alignItems: 'flex-end',
            paddingRight: s * 0.1,
          }}
        >
          <View style={{ width: s * 0.14, height: s * 0.14, borderRadius: s * 0.07, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  // profile — head over shoulders
  return (
    <View style={[styles.box, { width: s, height: s }]}>
      <View
        style={{
          width: s * 0.34,
          height: s * 0.34,
          borderRadius: s * 0.17,
          borderWidth: 2,
          borderColor: color,
        }}
      />
      <View
        style={{
          width: s * 0.66,
          height: s * 0.3,
          borderTopLeftRadius: s * 0.33,
          borderTopRightRadius: s * 0.33,
          borderWidth: 2,
          borderBottomWidth: 0,
          borderColor: color,
          marginTop: s * 0.06,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});

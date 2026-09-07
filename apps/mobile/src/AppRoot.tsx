/**
 * Composition root for the CruiXe app shell.
 *
 * Order matters: SafeAreaProvider must wrap the navigator (screens read insets
 * during their first render), and AuthProvider must wrap it too because
 * RootNavigator selects its branch from session state.
 *
 * The config gate sits outermost. A build with missing `EXPO_PUBLIC_*` values
 * cannot create a Supabase client, so rendering the navigator would fail inside
 * a provider with no useful message. Core throws a `CoreConfigError` naming
 * every missing key at once; this renders it instead of crashing.
 */

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, type Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { AuthProvider } from './auth/AuthProvider';
import { coreConfigResult } from './core/config';
import RootNavigator from './navigation/RootNavigator';
import { defaultTheme as t } from './theme';

/**
 * React Navigation paints its own surfaces — screen backgrounds during
 * transitions, headers, tab bars — from this object, not from screen styles.
 * Left at its default it renders stock grey-blue, which reads as a different
 * app for the fraction of a second a push animation takes.
 *
 * Values come from `theme`, so they inherit DIVERGENCE-003's canonical brand
 * hex rather than the rounded HSL.
 */
const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: t.colors.brandRed,
    background: t.colors.background,
    card: t.colors.card,
    text: t.colors.foreground,
    border: t.colors.border,
    notification: t.colors.brandRed,
  },
};

function ConfigError({ error }: { error: Error }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CruiXe is misconfigured</Text>
      <Text style={styles.body}>{error.message}</Text>
      <Text style={styles.hint}>
        Set the EXPO_PUBLIC_* values in apps/mobile/.env and restart Metro.
      </Text>
    </View>
  );
}

export default function AppRoot() {
  if (!coreConfigResult.ok) {
    return (
      <SafeAreaProvider>
        <ConfigError error={coreConfigResult.error} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {/*
        The Capacitor app set `StatusBar: { style: 'light', backgroundColor:
        '#B81104' }`. Only the first half is expressible here: `backgroundColor`
        was removed from expo-status-bar because Android 15 enforces
        edge-to-edge, so the status bar is always transparent over app content.

        The consequence is a real layout rule, not a cosmetic one: **every
        screen must pay its own top inset** via `useSafeAreaInsets`, because
        content now draws underneath the status bar by default. `RideScreen`
        does. The spike harness in `App.tsx` does not — it uses RN's
        `SafeAreaView`, which applies no top inset on Android, which is why its
        tab row sits under the clock and its upper half is untappable.

        `style="dark"` here, not "light": the app's own surfaces are white or
        map imagery, so dark status-bar content is what stays legible. Light
        content would be invisible against them.
      */}
      <StatusBar style="dark" />
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    backgroundColor: t.colors.background,
  },
  title: { fontSize: 18, fontWeight: '800', color: t.colors.destructive },
  body: { fontSize: 13, color: t.colors.foreground, textAlign: 'center' },
  hint: { fontSize: 12, color: t.colors.mutedForeground, textAlign: 'center' },
});

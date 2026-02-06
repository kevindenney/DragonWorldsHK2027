/**
 * Web fallback for MapScreenSafe
 * The WebView-based map is not available on web platform
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Map } from 'lucide-react-native';

import { dragonChampionshipsLightTheme } from '../constants/dragonChampionshipsTheme';
import type { MapScreenProps } from '../types/navigation';

const { colors, spacing } = dragonChampionshipsLightTheme;

export const MapScreen: React.FC<MapScreenProps> = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <View style={styles.iconContainer}>
          <Map size={64} color={colors.textSecondary} />
        </View>
        <Text style={styles.title}>Map Not Available</Text>
        <Text style={styles.subtitle}>
          The interactive map is only available on iOS and Android devices.
        </Text>
        <Text style={styles.hint}>
          Please use the mobile app to view sailing locations and venue details.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  hint: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MapScreen;

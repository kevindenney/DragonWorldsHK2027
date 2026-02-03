import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';

const { colors, spacing, shadows } = dragonChampionshipsLightTheme;

interface FloatingBackButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Floating back chevron button for More tab screens.
 * Positioned absolute in top-left corner, safe area aware.
 * Apple HIG compliant - 40x40pt circular pill with shadow.
 */
export function FloatingBackButton({ onPress, style }: FloatingBackButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { top: insets.top + 8 },
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <ChevronLeft size={24} color={colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: spacing.lg,
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.cardMedium,
    elevation: 8,
    zIndex: 100,
  },
});

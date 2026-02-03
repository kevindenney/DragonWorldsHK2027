/**
 * EventIndicator - Compact header indicator for selected event
 *
 * A small tappable chip/badge that displays the currently selected
 * championship in screen headers. Tapping navigates to Profile where
 * the event can be changed.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { useSelectedEventDefinition } from '../../stores/eventStore';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import type { RootStackParamList } from '../../types/navigation';

const { colors, spacing, borderRadius } = dragonChampionshipsLightTheme;

interface EventIndicatorProps {
  /** Optional style override */
  style?: object;
  /** Whether to show the dropdown chevron */
  showChevron?: boolean;
  /** Whether the indicator is interactive (navigates to profile) */
  interactive?: boolean;
}

/**
 * EventIndicator Component
 *
 * Displays the currently selected event as a subtle chip.
 * When tapped, navigates to Profile screen where the event can be changed.
 */
export function EventIndicator({
  style,
  showChevron = true,
  interactive = true,
}: EventIndicatorProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const eventDefinition = useSelectedEventDefinition();

  const handlePress = async () => {
    if (!interactive) return;

    await Haptics.selectionAsync();
    // Navigate to Profile screen where event selection is available
    navigation.navigate('Profile');
  };

  const content = (
    <View style={[styles.container, style]}>
      <Text style={styles.text} numberOfLines={1}>
        {eventDefinition.shortName}
      </Text>
      {showChevron && (
        <ChevronDown size={12} color={colors.primary} strokeWidth={2.5} />
      )}
    </View>
  );

  if (!interactive) {
    return content;
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Current event: ${eventDefinition.name}. Tap to change.`}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '12',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.2,
  },
});

export default EventIndicator;

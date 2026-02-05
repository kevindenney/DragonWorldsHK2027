import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate
} from '../../utils/reanimatedWrapper';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';
import { haptics } from '../../utils/haptics';

export interface EventToggleOption {
  id: string;
  shortLabel: string;
  fullLabel: string;
}

export interface EventToggleProps {
  options: EventToggleOption[];
  selectedEventId: string;
  onEventChange: (eventId: string) => void;
  badgeCounts?: Record<string, number>;
  style?: StyleProp<ViewStyle>;
}

export const EventToggle: React.FC<EventToggleProps> = ({
  options,
  selectedEventId,
  onEventChange,
  badgeCounts = {},
  style
}) => {
  const animatedValue = useSharedValue(
    options.findIndex(option => option.id === selectedEventId)
  );

  const handleToggle = async (eventId: string, index: number) => {
    if (eventId === selectedEventId) return;

    await haptics.selection();
    animatedValue.value = withTiming(index, { duration: 200 });
    onEventChange(eventId);
  };

  const toggleWidth = 340; // Full width to accommodate readable labels
  const toggleHeight = 44; // Standard iOS segmented control height
  const indicatorWidth = (toggleWidth - 4) / 2;

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      animatedValue.value,
      [0, 1],
      [2, indicatorWidth + 2]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const renderBadge = (eventId: string) => {
    const count = badgeCounts[eventId];
    if (!count || count === 0) return null;

    return (
      <View style={styles.badge}>
        <View style={styles.badgeDot} />
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.toggle, { width: toggleWidth, height: toggleHeight }]}>
        <Animated.View
          style={[
            styles.indicator,
            { width: indicatorWidth, height: toggleHeight - 4 },
            animatedIndicatorStyle
          ]}
        />

        {options.map((option, index) => {
          const isSelected = option.id === selectedEventId;

          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, { width: indicatorWidth }]}
              onPress={() => handleToggle(option.id, index)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.optionText,
                isSelected && styles.optionTextSelected
              ]}>
                {option.fullLabel}
              </Text>
              {renderBadge(option.id)}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    position: 'relative',
    padding: 2,
  },
  indicator: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  optionText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: colors.text,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 1,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
});
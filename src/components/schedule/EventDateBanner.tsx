/**
 * EventDateBanner - Compact date display for schedule header
 *
 * Displays the current event's date range in a pill-shaped banner.
 * Updates automatically when switching between APAC and Worlds events.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { EVENTS, EventId } from '../../constants/events';

interface EventDateBannerProps {
  eventId: EventId;
}

export function EventDateBanner({ eventId }: EventDateBannerProps) {
  // Get the event data based on current selection
  const event = eventId === EVENTS.WORLDS_2027.id
    ? EVENTS.WORLDS_2027
    : EVENTS.APAC_2026;

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Calendar
          size={14}
          color={colors.primary}
          style={styles.icon}
        />
        <IOSText
          textStyle="footnote"
          weight="medium"
          color={colors.primary}
        >
          {event.dates}
        </IOSText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '12', // 7% opacity
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
  },
  icon: {
    marginRight: spacing.xs,
  },
});

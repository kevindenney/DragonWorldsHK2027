import React from 'react';
import { View, StyleSheet } from 'react-native';

import { IOSSegmentedControl } from '../ios/IOSSegmentedControl';
import { IOSBadge } from '../ios/IOSBadge';
import { colors, spacing } from '../../constants/theme';
import { EVENT_INFO, EventInfo } from '../../data/mockEventData';

export interface EventSelectorProps {
  selectedEventId: string;
  onEventChange: (eventId: string) => void;
  unreadCounts?: Record<string, number>;
}

export const EventSelector: React.FC<EventSelectorProps> = ({
  selectedEventId,
  onEventChange,
  unreadCounts = {}
}) => {
  const availableEvents = Object.values(EVENT_INFO);

  const segmentOptions = availableEvents.map((event: EventInfo) => ({
    value: event.id,
    label: event.shortName,
    badge: unreadCounts[event.id] > 0 ? unreadCounts[event.id].toString() : undefined
  }));

  return (
    <View style={styles.container}>
      <IOSSegmentedControl
        options={segmentOptions}
        selectedValue={selectedEventId}
        onValueChange={onEventChange}
        style={styles.segmentedControl}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  segmentedControl: {
    // Additional styling if needed
  },
});
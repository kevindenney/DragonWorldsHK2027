/**
 * ScheduleDayContent Component
 *
 * Displays the activities for a selected day in the schedule.
 * Follows Apple WWDC25 design principle: "Content First" - schedule visible immediately.
 *
 * Features:
 * - Day header with formatted date and day title
 * - List of filtered activities using ActivityItem component
 * - Empty state when no activities match filter
 * - Smooth fade animation when content changes
 */

import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { Calendar, SunMedium } from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { ActivityItem } from './ActivityItem';
import { colors, spacing } from '../../constants/theme';
import type { Day, Activity, ActivityType } from '../../data/scheduleData';
import { useWalkthroughStore } from '../../stores/walkthroughStore';

interface ScheduleDayContentProps {
  day: Day | null;
}

export const ScheduleDayContent: React.FC<ScheduleDayContentProps> = ({
  day,
}) => {
  const firstActivityRef = useRef<View>(null);
  const { registerTarget, unregisterTarget } = useWalkthroughStore();

  // Register first activity as walkthrough target
  useEffect(() => {
    registerTarget('activity-item', firstActivityRef);
    return () => {
      unregisterTarget('activity-item');
    };
  }, [registerTarget, unregisterTarget]);

  // Get all activities for the day
  const activities = useMemo(() => {
    if (!day) return [];
    return day.activities;
  }, [day]);

  // Empty state when no day selected
  if (!day) {
    return (
      <View style={styles.emptyContainer}>
        <Calendar size={48} color={colors.textMuted} strokeWidth={1.5} />
        <IOSText textStyle="headline" style={styles.emptyTitle}>
          Select a Day
        </IOSText>
        <IOSText textStyle="subheadline" style={styles.emptySubtitle}>
          Choose a day from above to view the schedule
        </IOSText>
      </View>
    );
  }

  // Empty state when no activities for the day
  if (activities.length === 0) {
    return (
      <View style={styles.container}>
        {/* Empty State */}
        <View style={styles.emptyFilterContainer}>
          <SunMedium size={40} color={colors.textMuted} strokeWidth={1.5} />
          <IOSText textStyle="headline" style={styles.emptyTitle}>
            No Activities
          </IOSText>
          <IOSText textStyle="subheadline" style={styles.emptySubtitle}>
            No activities scheduled for this day
          </IOSText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Activities List */}
      <View style={styles.activitiesContainer}>
        {activities.map((activity, index) => (
          <View
            key={`${day.id}-${index}-${activity.time}-${activity.activity}`}
            ref={index === 0 ? firstActivityRef : undefined}
            collapsable={false}
          >
            <ActivityItem
              activity={activity}
              activityDate={day.date}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  activitiesContainer: {
    gap: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyFilterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
});

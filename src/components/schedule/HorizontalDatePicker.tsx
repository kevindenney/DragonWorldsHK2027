/**
 * HorizontalDatePicker Component
 *
 * A horizontal scrollable day selector for navigating through event schedule days.
 * Follows Apple WWDC25 design principles: structure, progressive disclosure, content first.
 *
 * Features:
 * - Quick day navigation with day name and date number
 * - Activity type dots (racing=blue, social=red, registration=orange)
 * - Today indicator with blue background
 * - Auto-scroll to selected day
 * - Snap scrolling with smooth animations
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { IOSText } from '../ios/IOSText';
import { colors, spacing } from '../../constants/theme';
import type { Day, ActivityType } from '../../data/scheduleData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_ITEM_WIDTH = 64;
const DAY_ITEM_MARGIN = 8;

export interface DatePickerDay {
  id: string;
  dayOfWeek: string;     // "Mon", "Tue"
  dayNumber: number;     // 17, 18, 19
  month: string;         // "Nov"
  isToday: boolean;
  hasRacing: boolean;
  hasSocial: boolean;
  hasRegistration: boolean;
  hasMeeting: boolean;
  activityCount: number;
}

interface HorizontalDatePickerProps {
  days: Day[];
  selectedDayId: string | null;
  onDaySelect: (dayId: string) => void;
  selectedDayTitle?: string;
  monthYear?: string; // e.g., "November 2026"
}

// Parse day data from schedule data format
const parseDayData = (day: Day): DatePickerDay => {
  // Parse date string like "Thursday, November 19, 2026"
  const dateParts = day.date.split(', ');
  const dayOfWeekFull = dateParts[0]; // "Thursday"
  const monthDay = dateParts[1]?.split(' ') || ['November', '19'];
  const month = monthDay[0]?.substring(0, 3) || 'Nov'; // "Nov"
  const dayNumber = parseInt(monthDay[1] || '1', 10);
  const dayOfWeek = dayOfWeekFull.substring(0, 3); // "Thu"

  // Check if this is today
  const today = new Date();
  const yearStr = dateParts[2] || '2026';
  const eventDate = new Date(`${monthDay[0]} ${dayNumber}, ${yearStr}`);
  const isToday = today.toDateString() === eventDate.toDateString();

  // Check activity types
  const hasRacing = day.activities.some(a => a.type === 'racing');
  const hasSocial = day.activities.some(a => a.type === 'social');
  const hasRegistration = day.activities.some(a => a.type === 'registration');
  const hasMeeting = day.activities.some(a => a.type === 'meeting');

  return {
    id: day.id,
    dayOfWeek,
    dayNumber,
    month,
    isToday,
    hasRacing,
    hasSocial,
    hasRegistration,
    hasMeeting,
    activityCount: day.activities.length,
  };
};

// Get activity dot color based on type
const getActivityDotColor = (type: 'racing' | 'social' | 'registration' | 'meeting'): string => {
  switch (type) {
    case 'racing':
      return '#2E7D8E'; // Teal-blue for racing
    case 'social':
      return '#E74C3C'; // Red for social
    case 'registration':
      return '#F39C12'; // Orange for registration
    case 'meeting':
      return '#8E44AD'; // Purple for meetings
    default:
      return colors.textMuted;
  }
};

export const HorizontalDatePicker: React.FC<HorizontalDatePickerProps> = ({
  days,
  selectedDayId,
  onDaySelect,
  selectedDayTitle,
  monthYear,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const parsedDays = days.map(parseDayData);

  // Auto-scroll to selected day
  useEffect(() => {
    if (selectedDayId && parsedDays.length > 0) {
      const selectedIndex = parsedDays.findIndex(day => day.id === selectedDayId);
      if (selectedIndex >= 0 && scrollViewRef.current) {
        const scrollPosition = Math.max(0, selectedIndex * (DAY_ITEM_WIDTH + DAY_ITEM_MARGIN) - spacing.lg);

        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: scrollPosition,
            animated: true,
          });
        }, 100);
      }
    }
  }, [selectedDayId, parsedDays]);

  const handleDayPress = useCallback((dayId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDaySelect(dayId);
  }, [onDaySelect]);

  return (
    <View style={styles.container}>
      {/* Month/Year header */}
      {monthYear && (
        <View style={styles.monthYearContainer}>
          <IOSText textStyle="caption1" weight="medium" style={styles.monthYearText}>
            {monthYear}
          </IOSText>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={DAY_ITEM_WIDTH + DAY_ITEM_MARGIN}
        snapToAlignment="start"
      >
        {parsedDays.map((day) => {
          const isSelected = selectedDayId === day.id;

          return (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.dayItem,
                isSelected && styles.dayItemSelected,
                day.isToday && !isSelected && styles.dayItemToday,
              ]}
              onPress={() => handleDayPress(day.id)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityLabel={`${day.dayOfWeek} ${day.month} ${day.dayNumber}`}
              accessibilityState={{ selected: isSelected }}
            >
              {/* Day of week */}
              <IOSText
                textStyle="caption2"
                style={[
                  styles.dayOfWeek,
                  isSelected && styles.dayOfWeekSelected,
                  day.isToday && !isSelected && styles.dayOfWeekToday,
                ]}
              >
                {day.dayOfWeek}
              </IOSText>

              {/* Day number */}
              <IOSText
                textStyle="title3"
                weight="semibold"
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                  day.isToday && !isSelected && styles.dayNumberToday,
                ]}
              >
                {day.dayNumber}
              </IOSText>

              {/* Activity dots */}
              <View style={styles.dotsContainer}>
                {day.hasRacing && (
                  <View style={[styles.activityDot, { backgroundColor: getActivityDotColor('racing') }]} />
                )}
                {day.hasSocial && (
                  <View style={[styles.activityDot, { backgroundColor: getActivityDotColor('social') }]} />
                )}
                {day.hasRegistration && (
                  <View style={[styles.activityDot, { backgroundColor: getActivityDotColor('registration') }]} />
                )}
                {day.hasMeeting && (
                  <View style={[styles.activityDot, { backgroundColor: getActivityDotColor('meeting') }]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Day Title - displayed below date picker */}
      {selectedDayTitle && (
        <View style={styles.dayTitleContainer}>
          <IOSText textStyle="subheadline" style={styles.dayTitle}>
            {selectedDayTitle}
          </IOSText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
  },
  monthYearContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  monthYearText: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayTitleContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  dayTitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: DAY_ITEM_MARGIN,
  },
  dayItem: {
    width: DAY_ITEM_WIDTH,
    height: 72,
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dayItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayItemToday: {
    backgroundColor: '#E3F2FD',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  dayOfWeek: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayOfWeekSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dayOfWeekToday: {
    color: colors.primary,
    fontWeight: '600',
  },
  dayNumber: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 24,
    marginTop: 2,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  dayNumberToday: {
    color: colors.primary,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 3,
    height: 6,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

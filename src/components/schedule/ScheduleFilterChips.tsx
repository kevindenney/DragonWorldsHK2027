/**
 * ScheduleFilterChips Component
 *
 * Horizontal scrollable filter chips for filtering activities by type.
 * Follows Apple WWDC25 design principle: "Organize by Behavior".
 *
 * Features:
 * - Filter chips: All, Racing, Social, Meeting, Registration, Technical
 * - Only shows filters that have activities for the selected day
 * - Active state with filled background
 * - Haptic feedback on selection
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Sailboat,
  Users,
  MessageSquare,
  ClipboardList,
  Settings,
  Grid3X3,
  LucideIcon,
} from 'lucide-react-native';
import { IOSText } from '../ios/IOSText';
import { colors, spacing } from '../../constants/theme';
import type { Activity, ActivityType } from '../../data/scheduleData';
import { activityTypes } from '../../data/scheduleData';

export type FilterValue = 'all' | ActivityType;

interface ScheduleFilterChipsProps {
  activities: Activity[];
  activeFilter: FilterValue;
  onFilterChange: (filter: FilterValue) => void;
}

interface FilterOption {
  value: FilterValue;
  label: string;
  icon: LucideIcon;
  color: string;
}

// Define all filter options
const allFilters: FilterOption[] = [
  { value: 'all', label: 'All', icon: Grid3X3, color: colors.primary },
  { value: 'racing', label: 'Racing', icon: Sailboat, color: activityTypes.racing.color },
  { value: 'social', label: 'Social', icon: Users, color: activityTypes.social.color },
  { value: 'meeting', label: 'Meeting', icon: MessageSquare, color: activityTypes.meeting.color },
  { value: 'registration', label: 'Registration', icon: ClipboardList, color: activityTypes.registration.color },
  { value: 'technical', label: 'Technical', icon: Settings, color: activityTypes.technical.color },
];

export const ScheduleFilterChips: React.FC<ScheduleFilterChipsProps> = ({
  activities,
  activeFilter,
  onFilterChange,
}) => {
  // Determine which filters to show based on available activity types
  const availableFilters = useMemo(() => {
    const activityTypeSet = new Set(activities.map(a => a.type));

    // Always show "All" filter, then only show filters for activity types present
    return allFilters.filter(filter => {
      if (filter.value === 'all') return true;
      return activityTypeSet.has(filter.value as ActivityType);
    });
  }, [activities]);

  // Get count for each filter
  const getFilterCount = useCallback((filter: FilterValue): number => {
    if (filter === 'all') return activities.length;
    return activities.filter(a => a.type === filter).length;
  }, [activities]);

  const handleFilterPress = useCallback((filter: FilterValue) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onFilterChange(filter);
  }, [onFilterChange]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {availableFilters.map((filter) => {
          const isActive = activeFilter === filter.value;
          const count = getFilterCount(filter.value);
          const IconComponent = filter.icon;

          return (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.chip,
                isActive && { backgroundColor: filter.color },
              ]}
              onPress={() => handleFilterPress(filter.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${filter.label}, ${count} activities`}
              accessibilityState={{ selected: isActive }}
            >
              <IconComponent
                size={14}
                color={isActive ? '#FFFFFF' : filter.color}
                strokeWidth={2.5}
              />
              <IOSText
                textStyle="footnote"
                weight="semibold"
                style={[
                  styles.chipLabel,
                  isActive && styles.chipLabelActive,
                  !isActive && { color: filter.color },
                ]}
              >
                {filter.label}
              </IOSText>
              <View style={[
                styles.countBadge,
                isActive && styles.countBadgeActive,
                !isActive && { backgroundColor: `${filter.color}20` },
              ]}>
                <IOSText
                  textStyle="caption2"
                  weight="semibold"
                  style={[
                    styles.countText,
                    isActive && styles.countTextActive,
                    !isActive && { color: filter.color },
                  ]}
                >
                  {count}
                </IOSText>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipLabel: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
  },
  countTextActive: {
    color: '#FFFFFF',
  },
});
